"""
Server Flow MCP server
======================

Turns a visual workflow (nodes + connections) into a complete Express.js backend.

Every project file is written by the LLM inside an agent loop:

    ANALYZE  -> deterministic graph analysis (routes, pipelines, shared nodes, cycles)
    PLAN     -> LLM designs the file tree + per-file export contracts (validated, retried,
                with a graph-derived blueprint as the fallback *plan* - never as code)
    WRITE    -> LLM writes one file at a time, seeing the real code of its dependencies.
                Each file is validated (syntax, imports, exports) and self-corrected.
    VERIFY   -> deterministic cross-file checks + optional LLM review
    REPAIR   -> failing files are rewritten with the exact problems as feedback

Hand-written templates are only used when no LLM is available at all.

The LLM adapter is expected at llm.py:  ask_llm(messages: list[dict]) -> {"content": str}

NOTE: stdout belongs to the MCP stdio transport. Everything is logged to stderr.
"""

import json
import os
import posixpath
import re
import shutil
import subprocess
import sys
import threading
import time
import uuid
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Optional

from mcp.server.fastmcp import FastMCP

try:
    from llm import ask_llm
    HAS_LLM = True
except Exception as exc:  # pragma: no cover
    HAS_LLM = False
    ask_llm = None
    sys.stderr.write(f"[server] LLM unavailable; only the minimal offline template will work: {exc}\n")

mcp = FastMCP("Server_Flow")

# ==================================================================
# CONFIG
# ==================================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.join(BASE_DIR, "user_project")
META_DIR = os.path.join(PROJECT_DIR, ".serverflow")  # manifests live outside generated projects
os.makedirs(PROJECT_DIR, exist_ok=True)
os.makedirs(META_DIR, exist_ok=True)

HTTP_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"}

# Categories the agent has specific guidance for. Unknown categories are still accepted
# (with a warning) and interpreted by the LLM from their type / configuration.
KNOWN_CATEGORIES = {
    "HTTP", "TRAFFIC", "COMPUTE", "DATA", "DATABASE", "SECURITY", "AUTH",
    "OBSERVABILITY", "MESSAGING", "LOGIC", "TRANSFORM", "RESPONSE",
}

LLM_RETRIES = 2              # transport-level retries per LLM call
PLAN_ATTEMPTS = 3            # planning attempts (with feedback) before falling back to blueprint
MAX_WRITE_ATTEMPTS = 3       # write -> validate -> self-fix cycles per file
MAX_REPAIR_ROUNDS = 2        # project-level verify -> repair rounds
DEP_CONTEXT_BUDGET = 24000   # chars of dependency source shown when writing a file
REVIEW_CHAR_BUDGET = 60000   # chars of source shown to the LLM reviewer
MAX_FILE_BYTES = 300_000

META_ORDER = [".gitignore", "package.json", ".env.example", "readme.md"]
MANDATORY_FILES = {
    "package.json": "npm manifest: exactly the dependencies the code imports, plus start/dev scripts",
    ".env.example": "every environment variable read by the code, with safe example values",
    ".gitignore": "Node.js gitignore (node_modules, .env, logs, coverage, OS files)",
    "README.md": "how to install, configure and run; table of every endpoint",
    "server.js": "process entry point: load env, connect resources, start HTTP server, graceful shutdown",
    "src/app.js": "Express app: global middleware in flow order, mount routes, 404 + error handler; exports app",
}

NODE_BUILTINS = {
    "assert", "async_hooks", "buffer", "child_process", "cluster", "console", "constants", "crypto",
    "dgram", "diagnostics_channel", "dns", "domain", "events", "fs", "http", "http2", "https",
    "inspector", "module", "net", "os", "path", "perf_hooks", "process", "punycode", "querystring",
    "readline", "repl", "stream", "string_decoder", "timers", "tls", "trace_events", "tty", "url",
    "util", "v8", "vm", "worker_threads", "zlib",
}

CATEGORY_PLAYBOOK = {
    "HTTP": "Each HTTP node is exactly one Express route (method + endpoint). Route files only wire "
            "path -> middleware chain -> controller handler. Follow the connections to decide the chain order.",
    "TRAFFIC": "Rate limiting, throttling, CORS, proxying/load-balancing, caching headers, compression: implement as "
               "Express middleware (express-rate-limit, cors, compression, http-proxy-middleware...) driven by node config.",
    "COMPUTE": "Business logic, workers, scheduled jobs, functions: async service functions called by controllers. "
               "Use node-cron / worker_threads only if the config asks for schedules or heavy work.",
    "DATA": "Data sources, caches, file/object storage: data-access modules (ioredis, fs, S3 SDK...) with a small async API.",
    "DATABASE": "Connection module (src/config/database.js exporting connect/disconnect) + one model/repository per "
                "table/collection named in the config. Choose the driver from the node type (mongoose for MongoDB, "
                "pg/knex/sequelize for SQL, ...). Never hardcode credentials.",
    "SECURITY": "helmet, input validation/sanitisation (express-validator/joi), CSRF, IP allow/deny lists: middleware, "
                "applied in the order the flow specifies.",
    "AUTH": "JWT/session/OAuth/API-key auth: middleware (+ login/register helpers only if the flow needs them). "
            "Secrets and expiry from env. Respond 401/403 with a consistent JSON error.",
    "OBSERVABILITY": "Logging (winston/pino/morgan), metrics (prom-client), tracing, health endpoints: middleware + a shared logger util.",
    "MESSAGING": "Queues, pub/sub, email, webhooks, websockets: one service module per broker/channel "
                 "(amqplib, kafkajs, bullmq, nodemailer, ws...) exposing connect/publish/subscribe-style functions.",
    "LOGIC": "Conditionals, switches, loops, validation branches: explicit control flow in controller/service code or "
             "conditional middleware. Connection labels (true/false/case values) are the branches.",
    "TRANSFORM": "Mappers, serializers, parsers, aggregators: pure, well-typed-by-JSDoc functions in src/utils or a service.",
    "RESPONSE": "Final response: status code, body, headers exactly as configured. Use one consistent JSON envelope across routes.",
}

PERSONA = (
    "You are a senior Node.js backend engineer acting as an autonomous code-generation agent. "
    "You write complete, production-quality, runnable code: real logic, input validation, error handling, "
    "no TODOs, no placeholders, no pseudo-code, no stubs. Use CommonJS (require / module.exports), Express 4 and async/await."
)


def log(msg: str) -> None:
    sys.stderr.write(f"[server] {msg}\n")
    sys.stderr.flush()


# ==================================================================
# GENERIC HELPERS
# ==================================================================

def safe_path(relative_path: str = "") -> str:
    """Resolve a path inside PROJECT_DIR; refuses anything that escapes it."""
    rel = (relative_path or "").replace("\\", "/").lstrip("/")
    full = os.path.abspath(os.path.join(PROJECT_DIR, rel))
    if os.path.commonpath([PROJECT_DIR, full]) != PROJECT_DIR:
        raise ValueError("Access outside the project directory is not permitted.")
    return full


PROJECT_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")


def list_project_names() -> list:
    return sorted(d for d in os.listdir(PROJECT_DIR)
                  if not d.startswith(".") and os.path.isdir(os.path.join(PROJECT_DIR, d)))


def project_root(name: str, must_exist: bool = True) -> str:
    if not isinstance(name, str) or not PROJECT_NAME_RE.match(name):
        raise ValueError(f"Invalid project name {name!r} (letters, digits, '.', '_', '-'; max 64 chars).")
    root = os.path.join(PROJECT_DIR, name)
    if must_exist and not os.path.isdir(root):
        raise FileNotFoundError(f"Project '{name}' not found. Existing projects: {list_project_names() or 'none'}")
    return root


def format_size(size_bytes: float) -> str:
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"


def slugify(text: Any, default: str = "item") -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "_", str(text)).strip("_").lower()
    return s or default


def clean_rel_path(p: Any) -> Optional[str]:
    """Normalise a project-relative path; None if it is unsafe or empty."""
    p = str(p or "").strip().replace("\\", "/")
    p = re.sub(r"^(\./)+", "", p)
    if not p or p.startswith("/") or re.match(r"^[A-Za-z]:", p):
        return None
    parts = p.split("/")
    if any(x in ("", "..", ".") for x in parts):
        return None
    return "/".join(parts)


def write_text(full_path: str, content: str) -> None:
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)


def load_project_files(root: str) -> dict:
    files = {}
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in {"node_modules", ".git", ".serverflow"}]
        for fn in filenames:
            if fn == "package-lock.json":
                continue
            full = os.path.join(dirpath, fn)
            try:
                if os.path.getsize(full) > MAX_FILE_BYTES:
                    continue
                with open(full, "r", encoding="utf-8") as f:
                    files[os.path.relpath(full, root).replace(os.sep, "/")] = f.read()
            except (UnicodeDecodeError, OSError):
                continue
    return files


# ==================================================================
# LLM LAYER  (robust calling + robust parsing)
# ==================================================================

class LLMError(RuntimeError):
    pass


def _response_text(resp: Any) -> str:
    if isinstance(resp, str):
        return resp
    content = resp.get("content", "") if isinstance(resp, dict) else getattr(resp, "content", "")
    if isinstance(content, list):  # content blocks
        return "".join(b.get("text", "") if isinstance(b, dict) else str(b) for b in content)
    return content or ""


def call_llm(prompt: str, retries: int = LLM_RETRIES) -> str:
    if not HAS_LLM or ask_llm is None:
        raise LLMError("LLM unavailable")
    last = "unknown error"
    for attempt in range(retries + 1):
        try:
            text = _response_text(ask_llm([{"role": "user", "content": prompt}]))
            if text.strip():
                return text
            last = "empty response"
        except Exception as exc:
            last = f"{type(exc).__name__}: {exc}"
        log(f"LLM call failed (attempt {attempt + 1}/{retries + 1}): {last}")
        if attempt < retries:
            time.sleep(min(2 ** attempt, 5))
    raise LLMError(last)


_FENCE_FULL = re.compile(r"^```[\w.+-]*[ \t]*\r?\n(.*?)\r?\n?```[ \t]*$", re.DOTALL)
_FENCE_TAIL = re.compile(r"```[\w.+-]*[ \t]*\r?\n(.*?)\r?\n?```[ \t]*$", re.DOTALL)


def _unwrap_fence(text: str) -> str:
    m = _FENCE_FULL.match(text.strip())
    return m.group(1) if m else text


def clean_file_output(text: str, path: str) -> str:
    """Strip an outer code fence (only the outer one - inner fences in a README are content)."""
    t = text.replace("\ufeff", "").strip()
    unwrapped = _unwrap_fence(t)
    if unwrapped is t and not path.lower().endswith(".md"):
        m = _FENCE_TAIL.search(t)
        if m and 0 <= t.find("```") < 400:  # short prose preamble before the fenced file
            unwrapped = m.group(1)
    return unwrapped.rstrip() + "\n"


def _balanced_end(text: str, start: int) -> int:
    open_ch = text[start]
    close_ch = "}" if open_ch == "{" else "]"
    depth, in_str, esc = 0, False, False
    for i in range(start, len(text)):
        ch = text[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == open_ch:
            depth += 1
        elif ch == close_ch:
            depth -= 1
            if depth == 0:
                return i
    return -1


def extract_json(text: str) -> Any:
    """Parse JSON out of an LLM answer even if it has prose or fences around it."""
    t = _unwrap_fence(text.strip())
    try:
        return json.loads(t)
    except ValueError:
        pass
    for m in re.finditer(r"[\{\[]", t):
        end = _balanced_end(t, m.start())
        if end == -1:
            continue
        try:
            return json.loads(t[m.start():end + 1])
        except ValueError:
            continue
    raise ValueError("no valid JSON found in the LLM output")


# ==================================================================
# FLOW NORMALISATION + ANALYSIS  (deterministic - no LLM)
# ==================================================================

class FlowError(ValueError):
    def __init__(self, errors: list):
        super().__init__("; ".join(errors))
        self.errors = errors


def normalize_flow(flow: Any) -> dict:
    """Validate and normalise a flow. Keeps labels/config; unknown categories become warnings."""
    if isinstance(flow, str):
        try:
            flow = json.loads(flow)
        except ValueError as exc:
            raise FlowError([f"Flow is not valid JSON: {exc}"])
    if not isinstance(flow, dict):
        raise FlowError(["Flow must be a JSON object."])

    raw_nodes = flow.get("nodes", [])
    raw_conns = flow.get("connections", flow.get("edges", []))
    errors, warnings = [], []
    if not isinstance(raw_nodes, list):
        raise FlowError(["Flow must contain a nodes array."])
    if not isinstance(raw_conns, list):
        raise FlowError(["Flow must contain a connections array."])

    nodes, ids = [], set()
    for idx, node in enumerate(raw_nodes):
        if not isinstance(node, dict):
            errors.append(f"nodes[{idx}] must be an object.")
            continue
        if node.get("id") in (None, ""):
            errors.append(f"nodes[{idx}] has no id.")
            continue
        nid = str(node["id"])
        if nid in ids:
            errors.append(f"Duplicate node id: {nid}")
            continue
        ids.add(nid)

        category = str(node.get("category", "")).strip().upper()
        if not category:
            errors.append(f"Node {nid} has no category.")
            continue
        if category not in KNOWN_CATEGORIES:
            warnings.append(f"Node {nid}: unrecognised category '{category}' - the agent will infer its role from type/config.")

        cfg = node.get("configuration")
        if cfg is None:
            cfg = node.get("config")
        if cfg is None and isinstance(node.get("data"), dict):
            cfg = node["data"].get("configuration")
        cfg = dict(cfg or {}) if isinstance(cfg or {}, dict) else None
        if cfg is None:
            errors.append(f"Node {nid} configuration must be an object.")
            continue

        ntype = str(node.get("type", "")).strip().upper()
        if category == "HTTP":
            raw_ep = next((cfg[k] for k in ("endpoint", "path", "route", "url") if cfg.get(k)), "/")
            ep = str(raw_ep).strip() or "/"
            cfg["endpoint"] = ep if ep.startswith("/") else "/" + ep.lstrip("/")
            method = str(cfg.get("method") or (ntype if ntype in HTTP_METHODS else "")).upper()
            if method not in HTTP_METHODS:
                if method:
                    warnings.append(f"Node {nid}: unknown HTTP method '{method}', defaulting to GET.")
                method = "GET"
            cfg["method"] = method

        nodes.append({
            "id": nid,
            "kind": str(node.get("kind", "")).lower(),
            "category": category,
            "type": ntype,
            "label": str(node.get("label") or node.get("name") or node.get("title") or ""),
            "configuration": cfg,
        })

    conns, seen_edges = [], set()
    for idx, c in enumerate(raw_conns):
        if not isinstance(c, dict):
            errors.append(f"connections[{idx}] must be an object.")
            continue
        src = c.get("source", c.get("from"))
        tgt = c.get("target", c.get("to"))
        src = None if src is None else str(src)
        tgt = None if tgt is None else str(tgt)
        if src not in ids:
            errors.append(f"Connection source {src} not found.")
            continue
        if tgt not in ids:
            errors.append(f"Connection target {tgt} not found.")
            continue
        if src == tgt:
            warnings.append(f"Ignored self-connection on {src}.")
            continue
        label = next((str(c[k]) for k in ("label", "condition", "branch", "sourceHandle") if c.get(k)), "")
        key = (src, tgt, label)
        if key in seen_edges:
            continue
        seen_edges.add(key)
        conns.append({"source": src, "target": tgt, "label": label})

    if errors:
        raise FlowError(errors)
    if not nodes:
        warnings.append("Flow has no nodes.")
    return {"nodes": nodes, "connections": conns, "warnings": warnings}


def route_resource(endpoint: str) -> str:
    for seg in endpoint.split("/"):
        if seg and not seg.startswith(":") and seg.lower() not in {"api", "v1", "v2", "v3"}:
            return slugify(seg, "root")
    return "root"


def analyze_flow(graph: dict) -> dict:
    """Trace every HTTP entry through the graph: ordered pipelines, shared nodes, orphans, cycles."""
    nodes = {n["id"]: n for n in graph["nodes"]}
    out, inc = defaultdict(list), defaultdict(list)
    for c in graph["connections"]:
        out[c["source"]].append(c)
        inc[c["target"]].append(c)

    def reach(start: str) -> list:
        seen, dq = [start], deque([start])
        seen_set = {start}
        while dq:
            cur = dq.popleft()
            for c in out[cur]:
                if c["target"] not in seen_set:
                    seen_set.add(c["target"])
                    seen.append(c["target"])
                    dq.append(c["target"])
        indeg = {i: 0 for i in seen}
        for i in seen:
            for c in out[i]:
                if c["target"] in indeg and c["target"] != start:
                    indeg[c["target"]] += 1
        order, placed, q = [], set(), deque([start])
        while q:
            cur = q.popleft()
            if cur in placed:
                continue
            placed.add(cur)
            order.append(cur)
            for c in out[cur]:
                t = c["target"]
                if t == start or t not in indeg:
                    continue
                indeg[t] -= 1
                if indeg[t] <= 0 and t not in placed:
                    q.append(t)
        return order + [i for i in seen if i not in placed]

    routes, covered = [], set()
    for n in graph["nodes"]:
        if n["category"] != "HTTP":
            continue
        steps = reach(n["id"])
        covered.update(steps)
        cfg = n["configuration"]
        routes.append({
            "entry": n["id"], "method": cfg["method"], "endpoint": cfg["endpoint"],
            "resource": route_resource(cfg["endpoint"]), "steps": steps,
            "terminals": [i for i in steps if not out[i]],
        })

    other_entries = [n["id"] for n in graph["nodes"]
                     if n["category"] != "HTTP" and not inc[n["id"]] and out[n["id"]]]
    for e in other_entries:
        covered.update(reach(e))
    standalone = [n["id"] for n in graph["nodes"] if n["id"] not in covered and n["id"] not in other_entries]

    counts = defaultdict(int)
    for r in routes:
        for s in r["steps"]:
            counts[s] += 1
    shared = sorted(i for i, k in counts.items() if k > 1)

    # global cycle detection (Kahn)
    indeg = {n["id"]: len(inc[n["id"]]) for n in graph["nodes"]}
    q = deque(i for i, d in indeg.items() if d == 0)
    while q:
        cur = q.popleft()
        indeg.pop(cur, None)
        for c in out[cur]:
            if c["target"] in indeg:
                indeg[c["target"]] -= 1
                if indeg[c["target"]] == 0:
                    q.append(c["target"])
    cycle_nodes = sorted(i for i, d in indeg.items())

    warnings = list(graph.get("warnings", []))
    if not routes:
        warnings.append("Flow has no HTTP nodes - no API routes will be generated.")
    if standalone:
        warnings.append(f"Nodes not reachable from any entry: {standalone} (implemented as standalone modules).")
    if cycle_nodes:
        warnings.append(f"Cycle among nodes {cycle_nodes} (treated as a loop / retry).")
    return {"routes": routes, "other_entries": other_entries, "standalone": standalone,
            "shared": shared, "cycle_nodes": cycle_nodes, "warnings": warnings}


def _cfg_str(cfg: dict, limit: int = 700) -> str:
    s = json.dumps(cfg, default=str, ensure_ascii=False)
    return s if len(s) <= limit else s[:limit] + "...(truncated)"


def fmt_node(n: dict, with_cfg: bool) -> str:
    kind = f"/{n['kind']}" if n["kind"] else ""
    label = f' "{n["label"]}"' if n.get("label") else ""
    s = f"{n['id']} [{n['category']}{kind}] type={n['type'] or 'n/a'}{label}"
    if with_cfg and n["configuration"]:
        s += " config=" + _cfg_str(n["configuration"])
    return s


def render_flow_spec(graph: dict, analysis: dict, focus: Optional[set] = None) -> str:
    """Text spec for prompts. Full config for `focus` nodes (all nodes when focus is None)."""
    nodes = {n["id"]: n for n in graph["nodes"]}
    out = defaultdict(list)
    for c in graph["connections"]:
        out[c["source"]].append(c)

    lines = ["WORKFLOW NODES:"]
    lines += ["- " + fmt_node(n, focus is None or n["id"] in focus) for n in graph["nodes"]]
    lines.append("\nROUTE PIPELINES (execution order; '=>' lists next nodes, '(label)' is a branch condition):")
    if not analysis["routes"]:
        lines.append("(no HTTP nodes)")
    for i, r in enumerate(analysis["routes"], 1):
        lines.append(f"ROUTE {i}: {r['method']} {r['endpoint']}  (entry {r['entry']}, resource '{r['resource']}')")
        for k, nid in enumerate(r["steps"], 1):
            nxt = ", ".join(c["target"] + (f" ({c['label']})" if c["label"] else "") for c in out[nid]) or "END"
            n = nodes[nid]
            lines.append(f"  {k}. {nid} {n['category']}/{n['type'] or 'n/a'} => {nxt}")
    if analysis["other_entries"]:
        lines.append(f"\nNON-HTTP ENTRY NODES (background triggers/consumers): {analysis['other_entries']}")
    if analysis["standalone"]:
        lines.append(f"STANDALONE NODES (not connected to any entry): {analysis['standalone']}")
    if analysis["shared"]:
        lines.append(f"SHARED NODES (used by several routes - put in reusable modules): {analysis['shared']}")
    for w in analysis["warnings"]:
        lines.append(f"WARNING: {w}")
    return "\n".join(lines)


def playbook_for(categories: set) -> str:
    lines = []
    for cat in sorted(categories):
        lines.append(f"- {cat}: " + CATEGORY_PLAYBOOK.get(
            cat, "Unrecognised category: infer its purpose from its type and configuration; implement it as a service/middleware module."))
    return "\n".join(lines)


# ==================================================================
# STATIC ANALYSIS OF GENERATED CODE
# ==================================================================

REQUIRE_RE = re.compile(r"""require\(\s*['"]([^'"]+)['"]\s*\)""")
DESTRUCT_RE = re.compile(r"""(?:const|let|var)\s*\{([^}]*)\}\s*=\s*require\(\s*['"](\.{1,2}/[^'"]+)['"]\s*\)""")
NAMED_RE = re.compile(r"""(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(\s*['"](\.{1,2}/[^'"]+)['"]\s*\)""")
ENV_RE = re.compile(r"""process\.env\.([A-Za-z_][A-Za-z0-9_]*)|process\.env\[\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]\s*\]""")
PLACEHOLDER_RE = re.compile(r"\bTODO\b|implement (?:me|here|this)|your (?:code|logic) (?:goes )?here|not implemented yet", re.I)
ESM_RE = re.compile(r"^\s*(?:import\s+[^\n]+\s+from\s+['\"]|import\s+['\"]|export\s+(?:default|const|function|class|async)\b)", re.M)
OBJECT_PROTO = {"constructor", "hasOwnProperty", "toString", "valueOf", "toJSON", "then", "length", "name", "prototype"}

NODE_BIN = shutil.which("node")


def is_js(path: str) -> bool:
    return path.endswith(".js")


def pkg_name(spec: str) -> Optional[str]:
    if spec.startswith((".", "/", "node:")):
        return None
    parts = spec.split("/")
    name = "/".join(parts[:2]) if spec.startswith("@") else parts[0]
    return None if name in NODE_BUILTINS else name


def collect_packages(files: dict) -> set:
    pk = set()
    for p, c in files.items():
        if is_js(p):
            for m in REQUIRE_RE.finditer(c):
                n = pkg_name(m.group(1))
                if n:
                    pk.add(n)
    return pk


def collect_env_vars(files: dict) -> set:
    found = set()
    for p, c in files.items():
        if is_js(p):
            for m in ENV_RE.finditer(c):
                found.add(m.group(1) or m.group(2))
    return found


def resolve_module(from_path: str, spec: str, known) -> Optional[str]:
    base = posixpath.normpath(posixpath.join(posixpath.dirname(from_path), spec))
    for cand in (base, base + ".js", base + ".json", base + "/index.js"):
        if cand in known:
            return cand
    return None


def _find_matching_brace(text: str, open_idx: int) -> int:
    depth, i, n = 0, open_idx, len(text)
    while i < n:
        ch = text[i]
        if ch in "'\"`":
            j = i + 1
            while j < n and text[j] != ch:
                j += 2 if text[j] == "\\" else 1
            i = j + 1
            continue
        if text.startswith("//", i):
            j = text.find("\n", i)
            i = n if j == -1 else j
            continue
        if text.startswith("/*", i):
            j = text.find("*/", i + 2)
            i = n if j == -1 else j + 2
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def _split_top_level(body: str) -> list:
    parts, cur, depth, i, n = [], [], 0, 0, len(body)
    while i < n:
        ch = body[i]
        if ch in "'\"`":
            j = i + 1
            while j < n and body[j] != ch:
                j += 2 if body[j] == "\\" else 1
            cur.append(body[i:j + 1])
            i = j + 1
            continue
        if body.startswith("//", i):
            j = body.find("\n", i)
            i = n if j == -1 else j
            continue
        if body.startswith("/*", i):
            j = body.find("*/", i + 2)
            i = n if j == -1 else j + 2
            continue
        if ch in "({[":
            depth += 1
        elif ch in ")}]":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append("".join(cur))
            cur = []
        else:
            cur.append(ch)
        i += 1
    if "".join(cur).strip():
        parts.append("".join(cur))
    return parts


_KEY_RE = re.compile(r"""^(?:async\s+)?(?:\*\s*)?(?:get\s+|set\s+)?([A-Za-z_$][\w$]*|'[^']+'|"[^"]+")\s*(?::|\(|$)""")


def module_exports(content: str) -> Optional[set]:
    """Names exported by a CommonJS module, or None when they can't be determined statically."""
    if re.search(r"module\.exports\s*=(?!\s*\{)", content):
        return None  # function / class / router / instance
    names, known = set(), False
    for m in re.finditer(r"(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=", content):
        names.add(m.group(1))
        known = True
    m = re.search(r"module\.exports\s*=\s*\{", content)
    if m:
        open_idx = m.end() - 1
        end = _find_matching_brace(content, open_idx)
        if end == -1:
            return None
        for seg in _split_top_level(content[open_idx + 1:end]):
            seg = seg.strip()
            if not seg:
                continue
            if seg.startswith("..."):
                return None
            km = _KEY_RE.match(seg)
            if not km:
                return None
            names.add(km.group(1).strip("'\""))
        known = True
    return names if known else None


def file_problems(path: str, content: str, known: set, sources: dict) -> list:
    """Per-file checks. `known` = paths that exist/are planned, `sources` = contents for export lookups."""
    if not content.strip():
        return ["file is empty"]
    problems = []
    if not path.lower().endswith(".md") and re.search(r"^```", content, re.M):
        problems.append("contains a markdown code fence (```) - output must be the raw file only")
    if path.endswith(".json"):
        try:
            json.loads(content)
        except ValueError as exc:
            problems.append(f"invalid JSON: {exc}")
    if not is_js(path):
        return problems

    if ESM_RE.search(content):
        problems.append("uses ES-module syntax (import/export); the project is CommonJS - use require / module.exports")
    if PLACEHOLDER_RE.search(content):
        problems.append("contains a TODO/placeholder - every function must be fully implemented")

    for m in REQUIRE_RE.finditer(content):
        spec = m.group(1)
        if spec.startswith(".") and not resolve_module(path, spec, known):
            avail = sorted(p for p in known if is_js(p))[:25]
            problems.append(f"require('{spec}') does not resolve to any project file. Existing files: {avail}")

    for m in DESTRUCT_RE.finditer(content):
        target = resolve_module(path, m.group(2), sources)
        exports = module_exports(sources[target]) if target else None
        if exports is None:
            continue
        for part in m.group(1).split(","):
            name = part.split(":")[0].split("=")[0].strip()
            if name and name not in exports:
                problems.append(f"imports '{name}' from '{m.group(2)}' but that module only exports {sorted(exports)}")

    for m in NAMED_RE.finditer(content):
        ident, spec = m.group(1), m.group(2)
        target = resolve_module(path, spec, sources)
        exports = module_exports(sources[target]) if target else None
        if exports is None:
            continue
        used = set(re.findall(rf"\b{re.escape(ident)}\.([A-Za-z_$][\w$]*)", content))
        for name in sorted(used - exports - OBJECT_PROTO):
            problems.append(f"uses '{ident}.{name}' but '{spec}' only exports {sorted(exports)}")
    return problems


def node_check(full_path: str) -> Optional[str]:
    if not NODE_BIN:
        return None
    try:
        r = subprocess.run([NODE_BIN, "--check", full_path], capture_output=True, text=True, timeout=20)
    except (subprocess.TimeoutExpired, OSError):
        return None
    if r.returncode != 0:
        lines = [l.strip() for l in (r.stderr or r.stdout).splitlines() if l.strip()]
        return " | ".join(lines[:4])[:400]
    return None


def sync_meta_files(root: str, files: dict) -> list:
    """Deterministic fixes: add imported packages to package.json, add read env vars to .env.example."""
    notes = []
    raw = files.get("package.json")
    if raw:
        try:
            data = json.loads(raw)
            deps = data.setdefault("dependencies", {})
            declared = set(deps) | set(data.get("devDependencies", {}))
            missing = sorted(collect_packages(files) - declared)
            changed = False
            for pkg in missing:
                deps[pkg] = "latest"
                changed = True
            if not isinstance(data.get("scripts"), dict) or "start" not in data["scripts"]:
                data.setdefault("scripts", {})["start"] = "node server.js"
                changed = True
            if changed:
                text = json.dumps(data, indent=2) + "\n"
                write_text(os.path.join(root, "package.json"), text)
                files["package.json"] = text
                notes.append(f"package.json: added missing dependencies {missing}" if missing else "package.json: added start script")
        except ValueError:
            pass
    env = files.get(".env.example")
    if env is not None:
        present = set(re.findall(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=", env, re.M))
        missing_env = sorted(collect_env_vars(files) - present)
        if missing_env:
            text = env.rstrip("\n") + "\n\n# added by verifier (read by the code)\n" + "\n".join(f"{v}=" for v in missing_env) + "\n"
            write_text(os.path.join(root, ".env.example"), text)
            files[".env.example"] = text
            notes.append(f".env.example: added {missing_env}")
    return notes


def owners_of_node(plan: dict, node_id: str) -> list:
    return [f["path"] for f in plan["files"] if node_id in f.get("nodes", [])]


def collect_issues(files: dict, plan: dict, analysis: Optional[dict], root: Optional[str] = None,
                   run_node_check: bool = True) -> list:
    """Whole-project deterministic verification. Returns [{'path','problem'}]."""
    issues = []
    planned = {f["path"] for f in plan["files"]}
    known = planned | set(files)

    for p in sorted(planned):
        if p not in files:
            issues.append({"path": p, "problem": "planned file was never written"})
    for p, c in sorted(files.items()):
        for prob in file_problems(p, c, known, files):
            issues.append({"path": p, "problem": prob})
        if run_node_check and root and is_js(p):
            err = node_check(os.path.join(root, *p.split("/")))
            if err:
                issues.append({"path": p, "problem": f"syntax error: {err}"})

    if "package.json" in files:
        try:
            pj = json.loads(files["package.json"])
            entry = pj.get("main", "server.js")
            if entry not in files:
                issues.append({"path": "package.json", "problem": f"main points to '{entry}' which does not exist"})
        except ValueError:
            pass  # already reported as invalid JSON
    if "server.js" in files and "src/app.js" in files and "app" not in files["server.js"]:
        issues.append({"path": "server.js", "problem": "does not appear to load the Express app from src/app.js"})

    if analysis:
        code = "\n".join(c for p, c in files.items() if is_js(p))
        route_files = [p for p in files if "/routes/" in p and is_js(p)]
        for r in analysis["routes"]:
            tokens = [s for s in r["endpoint"].split("/") if s and not s.startswith(":")]
            missing = [t for t in tokens if t not in code]
            verb = r["method"].lower()
            no_verb = f".{verb}(" not in code and ".all(" not in code and ".route(" not in code
            if not (missing or no_verb):
                continue
            reasons = ([f"path segment(s) {missing} appear nowhere in the code"] if missing else []) + \
                      ([f"no router/app .{verb}(...) handler exists"] if no_verb else [])
            owners = [p for p in route_files if r["resource"] in p][:1] or route_files[:2] or \
                     owners_of_node(plan, r["entry"]) or (["src/app.js"] if "src/app.js" in files else [])
            for o in owners:
                issues.append({"path": o, "problem": f"route {r['method']} {r['endpoint']} (node {r['entry']}) is not "
                                                     f"implemented/mounted: {'; '.join(reasons)}"})
    return issues


# ==================================================================
# PLAN PHASE
# ==================================================================

def is_meta(path: str) -> bool:
    return path.casefold() in META_ORDER


def topo_order(items: list, deps_of: Callable[[str], list]) -> list:
    item_set, order, done, remaining = set(items), [], set(), list(items)
    while remaining:
        progressed = False
        for it in list(remaining):
            if all(d in done or d not in item_set for d in deps_of(it)):
                order.append(it)
                done.add(it)
                remaining.remove(it)
                progressed = True
        if not progressed:  # dependency cycle: break it in plan order
            it = remaining.pop(0)
            order.append(it)
            done.add(it)
    return order


def order_plan_files(files: list) -> list:
    by_path = {f["path"]: f for f in files}
    code = [f["path"] for f in files if not is_meta(f["path"])]
    code = topo_order(code, lambda p: by_path[p]["depends_on"])
    meta = sorted((f["path"] for f in files if is_meta(f["path"])), key=lambda p: META_ORDER.index(p.casefold()))
    return [by_path[p] for p in code + meta]  # meta last: they describe what the code actually uses


def sanitize_plan(plan: Any, graph: dict) -> dict:
    if isinstance(plan, list):
        plan = {"files": plan}
    if not isinstance(plan, dict) or not isinstance(plan.get("files"), list) or not plan["files"]:
        raise ValueError("plan must be an object with a non-empty 'files' array")
    node_ids = {n["id"] for n in graph["nodes"]}
    files, seen = [], set()
    for f in plan["files"]:
        if isinstance(f, str):
            f = {"path": f}
        if not isinstance(f, dict):
            continue
        path = clean_rel_path(f.get("path"))
        if not path or path.casefold() in seen:
            continue
        seen.add(path.casefold())
        nodes = f.get("nodes") if isinstance(f.get("nodes"), list) else []
        deps = f.get("depends_on") if isinstance(f.get("depends_on"), list) else []
        files.append({
            "path": path,
            "purpose": str(f.get("purpose") or "").strip() or "project file",
            "nodes": [str(x) for x in nodes if str(x) in node_ids],
            "depends_on": deps,
            "exports": str(f.get("exports") or "").strip(),
        })
    present = {f["path"].casefold() for f in files}
    for path, purpose in MANDATORY_FILES.items():
        if path.casefold() not in present:
            files.append({"path": path, "purpose": purpose, "nodes": [], "depends_on": [], "exports": ""})
    paths = {f["path"] for f in files}
    for f in files:
        cleaned = (clean_rel_path(d) for d in f["depends_on"])
        f["depends_on"] = [d for d in cleaned if d in paths and d != f["path"]]
    return {"project_type": "express-nodejs", "summary": str(plan.get("summary") or ""), "files": order_plan_files(files)}


def plan_problems(plan: dict, graph: dict, analysis: dict) -> list:
    problems = []
    covered = {n for f in plan["files"] for n in f["nodes"]}
    uncovered = [n["id"] for n in graph["nodes"] if n["id"] not in covered]
    if uncovered:
        problems.append(f"these workflow nodes are not assigned to any file's 'nodes': {uncovered}")
    code_files = [f for f in plan["files"] if not is_meta(f["path"])]
    if len(graph["nodes"]) >= 3 and len(code_files) < 5:
        problems.append("too few files - separate config, models, services, controllers, middleware, routes, app and server")
    if analysis["routes"] and not any("/routes/" in f["path"] or f["path"].endswith("routes.js") for f in code_files):
        problems.append("no route files planned although the workflow has HTTP nodes")
    return problems


PLAN_SCHEMA = """{
  "project_type": "express-nodejs",
  "summary": "one sentence describing the API",
  "files": [
    {"path": "src/config/database.js", "purpose": "MongoDB connection", "nodes": ["<db node id>"], "depends_on": [], "exports": "{ connect(): Promise<void>, disconnect(): Promise<void> }"},
    {"path": "src/controllers/users.controller.js", "purpose": "Handlers for the /users routes", "nodes": ["<http node id>", "<response node id>"], "depends_on": ["src/services/users.service.js"], "exports": "{ createUser(req,res,next), getUser(req,res,next) }"}
  ]
}"""


def build_plan_prompt(graph: dict, analysis: dict, feedback: str) -> str:
    cats = {n["category"] for n in graph["nodes"]}
    mandatory = "\n".join(f"  - {p}: {d}" for p, d in MANDATORY_FILES.items())
    return f"""{PERSONA}

Design the FILE PLAN (no code yet) for an Express.js backend that implements this visual workflow completely and faithfully.

{render_flow_spec(graph, analysis)}

CATEGORY GUIDANCE (only categories present in this workflow):
{playbook_for(cats)}

Return ONLY a JSON object - no markdown, no commentary - shaped like this (names are illustrative, do NOT copy them):
{PLAN_SCHEMA}

PLANNING RULES:
- Build a real layered project: src/config, src/models (or repositories), src/services, src/controllers, src/middleware, src/routes, src/utils, src/app.js, server.js.
- Group routes by resource (e.g. /users and /users/:id share users.routes.js / users.controller.js / users.service.js). Add src/routes/index.js to mount them all.
- EVERY workflow node id must appear in the "nodes" list of at least one file (a file may implement many nodes; a node may appear in several files, e.g. shared middleware).
- "depends_on" lists the planned files this file will require(); it must exist in your plan and must be acyclic.
- "exports" states exactly what module.exports contains (names and call shapes) so dependants import correctly.
- Always include these files:
{mandatory}
- Do not create files for categories that are absent, but do implement every node that is present.
- Paths are relative, forward-slash, no leading "/", no "..".
{feedback}"""


def blueprint_plan(graph: dict, analysis: dict) -> dict:
    """Graph-derived FILE PLAN used only when the LLM cannot produce a valid plan. Code is still LLM-written."""
    nodes = {n["id"]: n for n in graph["nodes"]}
    by_cat = defaultdict(list)
    for n in graph["nodes"]:
        by_cat[n["category"]].append(n["id"])
    files = {}

    def add(path, purpose, nids=(), deps=(), exports=""):
        f = files.setdefault(path, {"path": path, "purpose": purpose, "nodes": [], "depends_on": [], "exports": exports})
        f["nodes"] += [n for n in nids if n not in f["nodes"]]
        f["depends_on"] += [d for d in deps if d not in f["depends_on"]]

    model_paths = []
    if by_cat["DATABASE"]:
        add("src/config/database.js", "Database connection configured from env", by_cat["DATABASE"], exports="{ connect, disconnect, ... }")
        for nid in by_cat["DATABASE"]:
            cfg = nodes[nid]["configuration"]
            name = slugify(cfg.get("table") or cfg.get("collection") or cfg.get("model") or nid)
            path = f"src/models/{name}.model.js"
            add(path, f"Model/repository for '{name}'", [nid], ["src/config/database.js"])
            if path not in model_paths:
                model_paths.append(path)

    mw_files = []
    for cat, name in (("SECURITY", "security"), ("TRAFFIC", "traffic"), ("AUTH", "auth"), ("OBSERVABILITY", "observability")):
        if by_cat[cat]:
            path = f"src/middleware/{name}.js"
            add(path, f"{cat} middleware", by_cat[cat])
            mw_files.append(path)
    extra_services = []
    if by_cat["MESSAGING"]:
        add("src/services/messaging.service.js", "Messaging integrations", by_cat["MESSAGING"])
        extra_services.append("src/services/messaging.service.js")

    resources = defaultdict(lambda: {"http": [], "svc": [], "ctl": []})
    for r in analysis["routes"]:
        res = resources[r["resource"]]
        for s in r["steps"]:
            cat = nodes[s]["category"]
            if cat in ("COMPUTE", "DATA", "TRANSFORM"):
                res["svc"].append(s)
            elif cat in ("HTTP", "RESPONSE", "LOGIC"):
                res["ctl"].append(s)
    route_paths = []
    for name, res in resources.items():
        svc = f"src/services/{name}.service.js"
        ctl = f"src/controllers/{name}.controller.js"
        rte = f"src/routes/{name}.routes.js"
        add(svc, f"Business logic for '{name}'", res["svc"], model_paths + extra_services)
        add(ctl, f"Request handlers for '{name}'", res["ctl"], [svc] + extra_services)
        add(rte, f"Express router for '{name}'", [], [ctl] + mw_files)
        route_paths.append(rte)
    add("src/routes/index.js", "Mounts all routers", [], route_paths)
    add("src/app.js", "Express app wiring", [], ["src/routes/index.js"] + mw_files)
    add("server.js", "Entry point", [], ["src/app.js"] + (["src/config/database.js"] if by_cat["DATABASE"] else []))

    assigned = {n for f in files.values() for n in f["nodes"]}
    leftover = [n["id"] for n in graph["nodes"] if n["id"] not in assigned]
    if leftover:
        add("src/services/misc.service.js", "Standalone / unclassified workflow nodes", leftover)

    return sanitize_plan({"summary": "Blueprint derived from the workflow graph", "files": list(files.values())}, graph)


def plan_project_with_llm(graph: dict, analysis: dict, progress: Callable = log) -> tuple:
    """Returns (plan | None, notes). Retries with concrete feedback; keeps the best plan seen."""
    feedback, best, notes = "", None, []
    for attempt in range(1, PLAN_ATTEMPTS + 1):
        try:
            raw = call_llm(build_plan_prompt(graph, analysis, feedback))
        except LLMError as exc:
            return best, notes + [f"planning LLM error: {exc}"]
        try:
            plan = sanitize_plan(extract_json(raw), graph)
        except ValueError as exc:
            notes.append(f"plan attempt {attempt}: unusable output ({exc})")
            feedback = f"\nYOUR PREVIOUS ANSWER WAS REJECTED: {exc}. Return ONLY the JSON object."
            continue
        problems = plan_problems(plan, graph, analysis)
        best = plan
        if not problems:
            return plan, notes
        notes.append(f"plan attempt {attempt}: {'; '.join(problems)}")
        progress(f"plan attempt {attempt} had problems, retrying: {problems[0]}")
        feedback = "\nYOUR PREVIOUS PLAN WAS REJECTED. Fix these problems and return the full corrected JSON:\n" + \
                   "\n".join(f"- {p}" for p in problems)
    return best, notes


# ==================================================================
# WRITE PHASE
# ==================================================================

@dataclass
class BuildContext:
    graph: dict
    analysis: dict
    plan: dict
    project_path: str
    progress: Callable[[str], None] = log
    written: dict = field(default_factory=dict)
    failed: dict = field(default_factory=dict)


def summarize_module(content: str, limit: int = 30) -> str:
    keep = re.compile(r"module\.exports|^\s*exports\.|^\s*(?:async\s+)?function\s+\w+|"
                      r"^\s*(?:const|let)\s+\w+\s*=\s*(?:async\s*)?\(|router\.(?:get|post|put|patch|delete|use|all)\(|"
                      r"^\s*(?:app|router)\.use\(")
    lines = [l.rstrip() for l in content.splitlines() if keep.search(l)]
    return "\n".join(lines[:limit]) or "(no top-level declarations detected)"


def role_hint(path: str) -> str:
    p = path.casefold()
    if p == "server.js":
        return ("Load dotenv first. Require ./src/app. Connect every external resource (database, brokers, caches) BEFORE listening, "
                "using the connect functions exported by the planned files. Listen on process.env.PORT. Handle SIGTERM/SIGINT with graceful "
                "shutdown, and handle unhandledRejection/uncaughtException by logging and exiting.")
    if p == "src/app.js":
        return ("Build and EXPORT the Express app (do not listen). Apply global middleware in the order the workflow implies "
                "(security -> traffic -> observability -> body parsers), mount the routers, then a 404 handler and a final error-handling "
                "middleware that returns a JSON error. Add GET /health.")
    if p == "package.json":
        return ("Output valid JSON. 'main': 'server.js'; scripts start/dev; list in 'dependencies' EXACTLY the npm packages in the "
                "DETECTED IMPORTS list (no more, no fewer) using caret ranges of stable major versions you are sure exist, otherwise \"latest\".")
    if p == ".env.example":
        return "One KEY=value per line for EVERY variable in DETECTED ENV VARS, with safe example values and short # comments. No real secrets."
    if p == "readme.md":
        return ("Markdown: what this API does, install/run steps, environment variables, and a table of every endpoint "
                "(method, path, auth required, description) taken from the ROUTE PIPELINES.")
    if p == ".gitignore":
        return "Standard Node.js .gitignore."
    if "/routes/" in p:
        return "Only wiring: express.Router(), middleware chain per route in pipeline order, handler from the controller. Export the router."
    if "/controllers/" in p:
        return "Thin handlers: validate input, call services, map results to the RESPONSE node config (status/body), forward errors with next(err)."
    if "/models/" in p or "/config/" in p:
        return "Read connection settings from process.env. Export exactly what the plan says."
    if "/middleware/" in p:
        return "Export middleware functions (req,res,next) or factories that return them; configuration comes from the node config / env."
    return ""


def detected_facts(ctx: BuildContext) -> str:
    pk = sorted(collect_packages(ctx.written))
    env = sorted(collect_env_vars(ctx.written))
    routes = [f"{r['method']} {r['endpoint']}" for r in ctx.analysis["routes"]]
    return (f"\nDETECTED IMPORTS (npm packages required by the written code): {pk}\n"
            f"DETECTED ENV VARS (read via process.env): {env}\n"
            f"ENDPOINTS: {routes}\n")


def build_write_prompt(ctx: BuildContext, spec: dict, instructions: str = "", previous: Optional[str] = None) -> str:
    path = spec["path"]
    nodes = {n["id"]: n for n in ctx.graph["nodes"]}
    focus = set(spec.get("nodes", []))
    for c in ctx.graph["connections"]:
        if c["source"] in spec.get("nodes", []):
            focus.add(c["target"])
        if c["target"] in spec.get("nodes", []):
            focus.add(c["source"])
    plan_lines = "\n".join(
        f"- {f['path']} - {f['purpose']}" + (f" | exports: {f['exports']}" if f.get("exports") else "")
        for f in ctx.plan["files"])
    cats = {nodes[i]["category"] for i in spec.get("nodes", []) if i in nodes}
    playbook = playbook_for(cats) or "(none)"

    deps = [d for d in spec.get("depends_on", []) if d in ctx.written]
    per_dep = max(1500, DEP_CONTEXT_BUDGET // max(1, len(deps)))
    dep_blocks = []
    for d in deps:
        body = ctx.written[d]
        note = "\n...(truncated)" if len(body) > per_dep else ""
        dep_blocks.append(f"=== {d} (FULL SOURCE - import from it exactly as written) ===\n{body[:per_dep]}{note}")
    others = [f"=== {p} (exported API summary) ===\n{summarize_module(c)}"
              for p, c in ctx.written.items() if p not in deps and is_js(p) and p != path]

    meta_block = detected_facts(ctx) if is_meta(path) else ""
    edit_block = ""
    if previous is not None:
        edit_block = (f"\nCURRENT CONTENT OF THIS FILE (modify it; keep everything that still applies):\n<<<FILE\n{previous}\nFILE>>>\n")
    extra = f"\nADDITIONAL INSTRUCTIONS FROM THE USER:\n{instructions}\n" if instructions.strip() else ""

    return f"""{PERSONA}

You are writing ONE file of a larger project. Every other file is written by you as well, so the contracts below must be honoured exactly.

PROJECT: {ctx.plan.get('summary') or 'Express API generated from a workflow'}

FILE PLAN (all files that exist in this project, with their export contracts):
{plan_lines}

{render_flow_spec(ctx.graph, ctx.analysis, focus)}

CATEGORY GUIDANCE FOR THIS FILE:
{playbook}

DEPENDENCIES ALREADY WRITTEN:
{chr(10).join(dep_blocks) if dep_blocks else '(none)'}

OTHER WRITTEN FILES (API only):
{chr(10).join(others) if others else '(none)'}
{meta_block}{edit_block}{extra}
YOUR TASK - write the complete file:
  PATH: {path}
  PURPOSE: {spec.get('purpose', '')}
  IMPLEMENTS NODES: {spec.get('nodes') or 'none specifically'}
  MUST EXPORT: {spec.get('exports') or 'as needed by its dependants'}
  ROLE NOTES: {role_hint(path) or 'n/a'}

HARD RULES:
- Output ONLY the raw file content. No markdown fences, no explanations before or after.
- Implement the behaviour of the workflow nodes assigned to this file using their configuration values (endpoints, tables, statuses, messages, limits, secrets-from-env...). No placeholders or TODOs.
- Every relative require() must point to a file in the FILE PLAN, with the correct relative path from {posixpath.dirname(path) or '.'}/.
- Only import names that the dependency actually exports (see the source above / the plan's exports).
- Never hardcode secrets; read them from process.env.
- Use async/await and forward errors to next(err) in Express code.
"""


def build_fix_prompt(ctx: BuildContext, path: str, content: str, problems: list) -> str:
    plan_lines = "\n".join(f"- {f['path']}" + (f" | exports: {f['exports']}" if f.get("exports") else "") for f in ctx.plan["files"])
    deps = next((f["depends_on"] for f in ctx.plan["files"] if f["path"] == path), [])
    dep_src = "\n".join(f"=== {d} ===\n{ctx.written[d][:4000]}" for d in deps if d in ctx.written)
    return f"""{PERSONA}

The file below has problems. Fix ALL of them and return the COMPLETE corrected file. Output ONLY the raw file content (no fences, no explanations).

FILE: {path}
PROBLEMS:
{chr(10).join('- ' + p for p in problems)}

PROJECT FILES:
{plan_lines}

DEPENDENCY SOURCE:
{dep_src or '(none)'}

CURRENT CONTENT:
<<<FILE
{content}
FILE>>>
"""


def validate_file(ctx: BuildContext, path: str, content: str) -> list:
    known = {f["path"] for f in ctx.plan["files"]} | set(ctx.written)
    problems = file_problems(path, content, known, ctx.written)
    if is_js(path):
        err = node_check(os.path.join(ctx.project_path, *path.split("/")))
        if err:
            problems.insert(0, f"syntax error: {err}")
    return problems


def write_one_file(ctx: BuildContext, spec: dict, instructions: str = "", previous: Optional[str] = None) -> tuple:
    """Write -> validate -> self-correct loop for a single file. Returns (ok, note)."""
    path = spec["path"]
    full = os.path.join(ctx.project_path, *path.split("/"))
    prompt = build_write_prompt(ctx, spec, instructions, previous)
    problems: list = []
    for attempt in range(1, MAX_WRITE_ATTEMPTS + 1):
        try:
            raw = call_llm(prompt)
        except LLMError as exc:
            return False, f"LLM error: {exc}"
        content = clean_file_output(raw, path)
        write_text(full, content)
        ctx.written[path] = content
        problems = validate_file(ctx, path, content)
        if not problems:
            return True, "ok"
        ctx.progress(f"{path}: attempt {attempt}/{MAX_WRITE_ATTEMPTS} - {len(problems)} problem(s): {problems[0][:160]}")
        prompt = build_fix_prompt(ctx, path, content, problems)
    return False, "; ".join(problems[:3])


# ==================================================================
# VERIFY + REPAIR PHASE
# ==================================================================

def llm_review(ctx: BuildContext) -> list:
    """Semantic review of the generated project. Returns [{'path','problem'}]."""
    js_like = {p: c for p, c in ctx.written.items() if p not in {"package-lock.json"}}
    if not js_like:
        return []
    per_file = max(1200, REVIEW_CHAR_BUDGET // len(js_like))
    blocks = [f"=== {p} ===\n{c[:per_file]}{'...(truncated)' if len(c) > per_file else ''}" for p, c in sorted(js_like.items())]
    prompt = f"""{PERSONA}

Review this generated Express backend against the workflow it must implement. Report REAL defects only.

{render_flow_spec(ctx.graph, ctx.analysis)}

Already verified mechanically: syntax, that relative imports resolve, and that imported names are exported.

SOURCE FILES:
{chr(10).join(blocks)}

Look for: workflow nodes that are not implemented or are wired in the wrong order; routes not mounted in src/app.js or routes/index.js;
middleware order wrong (e.g. auth after the handler); controllers calling service/model functions with wrong arguments or forgetting await;
missing error handling; response shape/status different from the RESPONSE node configuration; hardcoded secrets;
server.js not connecting resources before listen.

Return ONLY JSON: {{"issues": [{{"path": "src/...", "problem": "one precise sentence"}}]}}
If there is nothing wrong return {{"issues": []}}. Maximum 12 issues.
"""
    try:
        data = extract_json(call_llm(prompt))
    except (LLMError, ValueError) as exc:
        ctx.progress(f"LLM review skipped: {exc}")
        return []
    out = []
    for item in (data.get("issues") if isinstance(data, dict) else []) or []:
        if isinstance(item, dict) and item.get("path") in ctx.written and item.get("problem"):
            out.append({"path": item["path"], "problem": str(item["problem"])})
    return out[:12]


def repair_file(ctx: BuildContext, path: str, problems: list) -> bool:
    spec = next((f for f in ctx.plan["files"] if f["path"] == path), None)
    if spec is None:
        spec = {"path": path, "purpose": "project file", "nodes": [], "depends_on": [], "exports": ""}
    if path not in ctx.written:  # never written: write it from scratch
        ok, note = write_one_file(ctx, spec, "Problems to avoid: " + "; ".join(problems))
        if not ok:
            ctx.failed[path] = note
        return ok
    full = os.path.join(ctx.project_path, *path.split("/"))
    try:
        raw = call_llm(build_fix_prompt(ctx, path, ctx.written[path], problems))
    except LLMError as exc:
        ctx.failed[path] = f"repair LLM error: {exc}"
        return False
    content = clean_file_output(raw, path)
    old = ctx.written[path]
    write_text(full, content)
    ctx.written[path] = content
    remaining = validate_file(ctx, path, content)
    if remaining and len(remaining) > len(problems) + 2:  # clearly worse -> roll back
        write_text(full, old)
        ctx.written[path] = old
        return False
    return not remaining


def verify_and_repair(ctx: BuildContext, use_llm_review: bool = True) -> list:
    """Alternate deterministic checks / LLM review with targeted rewrites. Returns remaining issues."""
    reviewed = False
    for round_no in range(1, MAX_REPAIR_ROUNDS + 1):
        for note in sync_meta_files(ctx.project_path, ctx.written):
            ctx.progress(f"auto-fix {note}")
        issues = collect_issues(ctx.written, ctx.plan, ctx.analysis, ctx.project_path)
        if not issues and use_llm_review and HAS_LLM and not reviewed:
            reviewed = True
            ctx.progress("static checks clean - running LLM review")
            issues = llm_review(ctx)
        if not issues:
            return []
        by_path = defaultdict(list)
        for i in issues:
            by_path[i["path"]].append(i["problem"])
        ctx.progress(f"repair round {round_no}: {len(issues)} issue(s) in {len(by_path)} file(s)")
        # repair leaf dependencies first so dependants see the corrected code
        order = [f["path"] for f in ctx.plan["files"] if f["path"] in by_path] + [p for p in by_path if p not in {f['path'] for f in ctx.plan['files']}]
        for p in order:
            ctx.progress(f"repairing {p}")
            repair_file(ctx, p, by_path[p])
    for note in sync_meta_files(ctx.project_path, ctx.written):
        ctx.progress(f"auto-fix {note}")
    return collect_issues(ctx.written, ctx.plan, ctx.analysis, ctx.project_path)


# ==================================================================
# OFFLINE FALLBACK (only when NO LLM is available)
# ==================================================================

def write_offline_project(project_path: str, project_name: str, analysis: dict) -> list:
    endpoints = "\n".join(f"- `{r['method']} {r['endpoint']}`" for r in analysis["routes"]) or "- (none)"
    files = {
        "server.js": "require('dotenv').config();\nconst app = require('./src/app');\nconst PORT = process.env.PORT || 3000;\n"
                     "app.listen(PORT, () => console.log(`Server running on ${PORT}`));\n",
        "src/app.js": "const express = require('express');\nconst app = express();\napp.use(express.json());\n"
                      "app.get('/health', (req, res) => res.json({ status: 'OK' }));\n"
                      "app.use((req, res) => res.status(404).json({ error: 'Not found' }));\nmodule.exports = app;\n",
        "package.json": json.dumps({"name": slugify(project_name, "server-flow-api").replace("_", "-"), "version": "1.0.0", "private": True,
                                    "main": "server.js", "scripts": {"start": "node server.js"},
                                    "dependencies": {"express": "^4.21.2", "dotenv": "^16.4.5"}}, indent=2) + "\n",
        ".env.example": "PORT=3000\n",
        ".gitignore": "node_modules/\n.env\n*.log\n",
        "README.md": f"# {project_name}\n\nOffline skeleton - the LLM was unavailable, so the flow was NOT implemented.\n\nPlanned endpoints:\n{endpoints}\n",
    }
    for rel, text in files.items():
        write_text(os.path.join(project_path, *rel.split("/")), text)
    return sorted(files)


# ==================================================================
# ORCHESTRATOR
# ==================================================================

_ACTIVE: set = set()
_ACTIVE_LOCK = threading.Lock()


def save_manifest(name: str, graph: dict, plan: dict, report: dict) -> None:
    with open(os.path.join(META_DIR, f"{name}.json"), "w", encoding="utf-8") as f:
        json.dump({"project_name": name, "saved_at": datetime.now(timezone.utc).isoformat(),
                   "flow": graph, "plan": plan, "report": report}, f, indent=2)


def read_manifest(name: str) -> Optional[dict]:
    try:
        with open(os.path.join(META_DIR, f"{name}.json"), "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def build_complete_project(flow: Any, project_name: str = "server-flow-api", progress: Callable[[str], None] = log,
                           use_llm_review: bool = True, overwrite: bool = True) -> dict:
    started = time.time()
    try:
        graph = normalize_flow(flow)
    except FlowError as exc:
        return {"status": "invalid_flow", "errors": exc.errors}
    name = project_name.strip() if isinstance(project_name, str) else ""
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip("-.") or "server-flow-api"
    name = name[:64]
    analysis = analyze_flow(graph)
    root = project_root(name, must_exist=False)

    with _ACTIVE_LOCK:
        if name in _ACTIVE:
            return {"status": "busy", "error": f"Project '{name}' is already being generated."}
        _ACTIVE.add(name)
    try:
        if os.path.exists(root):
            if not overwrite:
                return {"status": "exists", "error": f"Project '{name}' already exists (pass overwrite=true to replace it)."}
            shutil.rmtree(root)  # only this project - other projects are untouched
        os.makedirs(root, exist_ok=True)

        report = {"project": name, "path": root, "routes": [f"{r['method']} {r['endpoint']}" for r in analysis["routes"]],
                  "warnings": list(analysis["warnings"])}

        if not HAS_LLM:
            report.update(status="offline_template", mode="template_only",
                          files_written=write_offline_project(root, name, analysis), files_failed={}, issues_remaining=[])
            report["warnings"].append("LLM unavailable: only a bare skeleton was written; the workflow was NOT implemented.")
            save_manifest(name, graph, {"files": []}, report)
            return report

        # ---- PLAN ----
        progress(f"[{name}] planning ({len(graph['nodes'])} nodes, {len(analysis['routes'])} routes)")
        plan, notes = plan_project_with_llm(graph, analysis, progress)
        plan_source = "llm"
        if plan is None:
            plan, plan_source = blueprint_plan(graph, analysis), "blueprint"
            progress(f"[{name}] LLM planning failed - using graph blueprint as the file plan ({'; '.join(notes)[:200]})")
        elif notes:
            report["warnings"] += [f"planning: {n}" for n in notes]
        progress(f"[{name}] plan: {len(plan['files'])} files ({plan_source})")

        ctx = BuildContext(graph=graph, analysis=analysis, plan=plan, project_path=root, progress=progress)

        # ---- WRITE ----
        total = len(plan["files"])
        for i, spec in enumerate(plan["files"], 1):
            progress(f"[{name}] writing {i}/{total}: {spec['path']}")
            ok, note = write_one_file(ctx, spec)
            if not ok and spec["path"] not in ctx.written:
                ctx.failed[spec["path"]] = note
                progress(f"[{name}] FAILED {spec['path']}: {note}")

        # ---- VERIFY + REPAIR ----
        progress(f"[{name}] verifying")
        remaining = verify_and_repair(ctx, use_llm_review)

        report.update(
            mode="llm_agent", plan_source=plan_source, files_written=sorted(ctx.written),
            files_failed={p: r for p, r in ctx.failed.items() if p not in ctx.written},
            issues_remaining=remaining, duration_sec=round(time.time() - started, 1),
        )
        report["status"] = ("failed" if not ctx.written else
                            "complete" if not remaining and not report["files_failed"] else "complete_with_issues")
        save_manifest(name, graph, plan, report)
        progress(f"[{name}] done: {report['status']} ({len(ctx.written)} files, {len(remaining)} open issue(s))")
        return report
    finally:
        with _ACTIVE_LOCK:
            _ACTIVE.discard(name)


def plan_from_disk(files: dict) -> dict:
    return sanitize_plan({"summary": "", "files": [{"path": p, "purpose": "existing file"} for p in files]},
                         {"nodes": [], "connections": []}) if files else {"project_type": "express-nodejs", "summary": "", "files": []}


def load_context(project_name: str, progress: Callable[[str], None] = log) -> BuildContext:
    root = project_root(project_name)
    files = load_project_files(root)
    manifest = read_manifest(project_name)
    if manifest and manifest.get("flow"):
        graph, plan = manifest["flow"], manifest.get("plan") or plan_from_disk(files)
        if not plan.get("files"):
            plan = plan_from_disk(files)
    else:
        graph, plan = {"nodes": [], "connections": [], "warnings": []}, plan_from_disk(files)
    return BuildContext(graph=graph, analysis=analyze_flow(graph), plan=plan, project_path=root, progress=progress, written=files)


def require_llm() -> None:
    if not HAS_LLM:
        raise LLMError("LLM unavailable - this tool needs llm.ask_llm")


# ---------- background jobs (LLM generation can take minutes; clients often time out) ----------

JOBS: dict = {}
_JOBS_LOCK = threading.Lock()


def _run_job(job_id: str, flow: Any, project_name: str, use_llm_review: bool) -> None:
    job = JOBS[job_id]

    def progress(msg: str) -> None:
        log(msg)
        with _JOBS_LOCK:
            job["log"].append(f"{datetime.now().strftime('%H:%M:%S')} {msg}")

    try:
        report = build_complete_project(flow, project_name, progress, use_llm_review)
        with _JOBS_LOCK:
            job.update(status="done", report=report, finished=time.time())
    except Exception as exc:  # never let the worker thread die silently
        log(f"job {job_id} crashed: {exc!r}")
        with _JOBS_LOCK:
            job.update(status="error", error=f"{type(exc).__name__}: {exc}", finished=time.time())


# ==================================================================
# MCP TOOLS - FLOW
# ==================================================================

def _j(obj: Any) -> str:
    return json.dumps(obj, indent=2, ensure_ascii=False, default=str)


@mcp.tool()
def validate_flow(flow: dict) -> str:
    """Validate a workflow JSON ({nodes, connections}) and report errors, warnings and statistics."""
    try:
        graph = normalize_flow(flow)
    except FlowError as exc:
        return _j({"valid": False, "errors": exc.errors})
    a = analyze_flow(graph)
    cats = defaultdict(int)
    for n in graph["nodes"]:
        cats[n["category"]] += 1
    return _j({"valid": True, "nodes": len(graph["nodes"]), "connections": len(graph["connections"]),
               "categories": dict(cats), "routes": [f"{r['method']} {r['endpoint']}" for r in a["routes"]],
               "warnings": a["warnings"]})


@mcp.tool()
def analyze_flow_tool(flow: dict) -> str:
    """Trace the workflow: for every HTTP route the ordered chain of nodes, shared nodes, orphans and cycles."""
    try:
        graph = normalize_flow(flow)
    except FlowError as exc:
        return _j({"valid": False, "errors": exc.errors})
    return render_flow_spec(graph, analyze_flow(graph))


@mcp.tool()
def plan_project(flow: dict) -> str:
    """Ask the LLM agent for the project file plan (paths, purposes, export contracts) without writing any code."""
    try:
        graph = normalize_flow(flow)
        require_llm()
    except (FlowError, LLMError) as exc:
        return f"Cannot plan: {exc}"
    analysis = analyze_flow(graph)
    plan, notes = plan_project_with_llm(graph, analysis)
    source = "llm"
    if plan is None:
        plan, source = blueprint_plan(graph, analysis), "blueprint"
    lines = [f"Plan source: {source}", f"Summary: {plan.get('summary') or '-'}"]
    for f in plan["files"]:
        lines.append(f"  {f['path']} - {f['purpose']}" + (f"  [nodes: {', '.join(f['nodes'])}]" if f["nodes"] else "")
                     + (f"  [needs: {', '.join(f['depends_on'])}]" if f["depends_on"] else ""))
    lines += [f"note: {n}" for n in notes]
    return "\n".join(lines)


# ==================================================================
# MCP TOOLS - GENERATION
# ==================================================================

@mcp.tool()
def generate_server_from_flow(flow: dict, project_name: str = "server-flow-api", use_llm_review: bool = True,
                              overwrite: bool = True) -> str:
    """Generate the complete Express backend for a workflow (blocking). Plan -> write every file with the LLM ->
    verify -> repair. For big flows prefer start_generation_job + get_job_status to avoid client timeouts."""
    return _j(build_complete_project(flow, project_name, log, use_llm_review, overwrite))


@mcp.tool()
def start_generation_job(flow: dict, project_name: str = "server-flow-api", use_llm_review: bool = True) -> str:
    """Start generation in the background and return a job_id immediately. Poll with get_job_status."""
    try:
        normalize_flow(flow)
    except FlowError as exc:
        return _j({"status": "invalid_flow", "errors": exc.errors})
    job_id = uuid.uuid4().hex[:8]
    with _JOBS_LOCK:
        JOBS[job_id] = {"id": job_id, "project": project_name, "status": "running", "log": [], "started": time.time()}
        for old in sorted(JOBS, key=lambda k: JOBS[k]["started"])[:-20]:  # keep the last 20 jobs
            JOBS.pop(old, None)
    threading.Thread(target=_run_job, args=(job_id, flow, project_name, use_llm_review), daemon=True).start()
    return _j({"job_id": job_id, "status": "running"})


@mcp.tool()
def get_job_status(job_id: str = "", tail: int = 15) -> str:
    """Status, recent progress log and (when finished) the final report of a generation job. Empty job_id lists jobs."""
    with _JOBS_LOCK:
        if not job_id:
            return _j([{"id": j["id"], "project": j["project"], "status": j["status"]} for j in JOBS.values()])
        job = JOBS.get(job_id)
        if not job:
            return f"Unknown job_id {job_id!r}."
        view = {k: v for k, v in job.items() if k not in ("log", "started", "finished")}
        view["log_tail"] = job["log"][-max(1, tail):]
        view["elapsed_sec"] = round((job.get("finished") or time.time()) - job["started"], 1)
        return _j(view)


# ==================================================================
# MCP TOOLS - PROJECT MAINTENANCE
# ==================================================================

@mcp.tool()
def review_project(project_name: str, use_llm: bool = False) -> str:
    """Static verification of an existing generated project: syntax, imports/exports, packages, env vars, routes.
    Set use_llm=true to add a semantic LLM review."""
    try:
        ctx = load_context(project_name)
    except (ValueError, OSError) as exc:
        return f"Error: {exc}"
    issues = collect_issues(ctx.written, ctx.plan, ctx.analysis or None, ctx.project_path)
    if use_llm and HAS_LLM and not issues:
        issues = llm_review(ctx)
    return _j({"project": project_name, "files": len(ctx.written), "issues": issues, "node_available": bool(NODE_BIN)})


@mcp.tool()
def fix_project(project_name: str, use_llm_review: bool = True) -> str:
    """Run the verify -> repair loop on an existing project (rewrites only the files that have problems)."""
    try:
        require_llm()
        ctx = load_context(project_name)
    except (ValueError, OSError, LLMError) as exc:
        return f"Error: {exc}"
    remaining = verify_and_repair(ctx, use_llm_review)
    return _j({"project": project_name, "status": "clean" if not remaining else "issues_remaining",
               "issues_remaining": remaining, "failed": ctx.failed})


@mcp.tool()
def regenerate_file(project_name: str, path: str, instructions: str = "") -> str:
    """Have the agent (re)write one file of an existing project, optionally following extra instructions.
    The file sees the rest of the project, so imports stay consistent."""
    try:
        require_llm()
        ctx = load_context(project_name)
    except (ValueError, OSError, LLMError) as exc:
        return f"Error: {exc}"
    rel = clean_rel_path(path)
    if not rel:
        return f"Error: invalid path {path!r}"
    spec = next((f for f in ctx.plan["files"] if f["path"] == rel), None)
    if spec is None:
        spec = {"path": rel, "purpose": instructions or "new file", "nodes": [], "depends_on": [], "exports": ""}
        ctx.plan["files"].append(spec)
    ok, note = write_one_file(ctx, spec, instructions, ctx.written.get(rel))
    remaining = [i for i in collect_issues(ctx.written, ctx.plan, ctx.analysis or None, ctx.project_path) if i["path"] == rel]
    return _j({"path": rel, "ok": ok, "note": note, "remaining_issues": remaining})


def _run(cmd: list, cwd: str, timeout: int, env: Optional[dict] = None) -> tuple:
    try:
        r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout, env=env)
        return r.returncode, ((r.stdout or "") + (r.stderr or "")).strip()[-1500:]
    except subprocess.TimeoutExpired:
        return None, "timed out"
    except OSError as exc:
        return -1, str(exc)


@mcp.tool()
def check_project(project_name: str, install: bool = False) -> str:
    """Static checks; with install=true also runs 'npm install --ignore-scripts' and a load test that require()s
    src/app.js (executes the generated code, so only use on projects you trust)."""
    try:
        ctx = load_context(project_name)
    except (ValueError, OSError) as exc:
        return f"Error: {exc}"
    result = {"static_issues": collect_issues(ctx.written, ctx.plan, ctx.analysis or None, ctx.project_path)}
    if install:
        npm = shutil.which("npm")
        if not npm or not NODE_BIN:
            result["install"] = "npm/node not found on PATH"
        else:
            code, out = _run([npm, "install", "--ignore-scripts", "--no-audit", "--no-fund"], ctx.project_path, 300)
            result["install"] = {"ok": code == 0, "output": out}
            if code == 0:
                env = os.environ.copy()
                env.update({k: v for k, v in re.findall(r"^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$", ctx.written.get(".env.example", ""), re.M)})
                env["NODE_ENV"] = "test"
                entry = "src/app.js" if "src/app.js" in ctx.written else "server.js"
                code, out = _run([NODE_BIN, "-e", f"require('./{entry}');console.log('LOAD_OK');setTimeout(()=>process.exit(0),800)"],
                                 ctx.project_path, 30, env)
                result["load_test"] = {"ok": code == 0 and "LOAD_OK" in out, "output": out}
    return _j(result)


# ==================================================================
# MCP TOOLS - FILES
# ==================================================================

def _list_dir(path: str = "") -> str:
    full = safe_path(path)
    if not os.path.isdir(full):
        return f"Directory not found: {path or '.'}"
    items = sorted(os.listdir(full))
    if not items:
        return "Directory is empty."
    out = []
    for item in items:
        p = os.path.join(full, item)
        out.append(f"Folder: {item}/" if os.path.isdir(p) else f"File: {item} ({format_size(os.path.getsize(p))})")
    return "\n".join(out)


@mcp.tool()
def list_projects() -> str:
    """List generated projects with file counts and their last generation status."""
    rows = []
    for name in list_project_names():
        m = read_manifest(name) or {}
        count = sum(len(f) for _, _, f in os.walk(os.path.join(PROJECT_DIR, name)) if "node_modules" not in _)
        rows.append({"project": name, "files": count, "status": (m.get("report") or {}).get("status", "unknown"),
                     "saved_at": m.get("saved_at")})
    return _j(rows) if rows else "No projects yet."


@mcp.tool()
def project_tree(project_name: str, max_depth: int = 6) -> str:
    """Recursive tree of one project (skips node_modules and .git)."""
    try:
        root = project_root(project_name)
    except (ValueError, OSError) as exc:
        return f"Error: {exc}"
    lines = [f"{project_name}/"]

    def walk(d: str, prefix: str, depth: int) -> None:
        if depth > max_depth:
            return
        for item in sorted(os.listdir(d), key=lambda x: (not os.path.isdir(os.path.join(d, x)), x)):
            if item in {"node_modules", ".git"}:
                continue
            p = os.path.join(d, item)
            if os.path.isdir(p):
                lines.append(f"{prefix}{item}/")
                walk(p, prefix + "  ", depth + 1)
            else:
                lines.append(f"{prefix}{item} ({format_size(os.path.getsize(p))})")

    walk(root, "  ", 1)
    return "\n".join(lines)


@mcp.tool()
def read_file(filename: str) -> str:
    """Read a text file (path relative to user_project/, e.g. 'my-api/src/app.js')."""
    try:
        full = safe_path(filename)
        if not os.path.isfile(full):
            return f"File not found: {filename}"
        if os.path.getsize(full) > MAX_FILE_BYTES:
            return f"File too large to read ({format_size(os.path.getsize(full))})."
        with open(full, "r", encoding="utf-8") as f:
            return f.read()
    except (OSError, ValueError, UnicodeDecodeError) as exc:
        return f"Error: {exc}"


@mcp.tool()
def write_file(filename: str, content: str) -> str:
    """Create or overwrite a file (path relative to user_project/)."""
    try:
        write_text(safe_path(filename), content)
        return f"Data written to {filename}"
    except (OSError, ValueError) as exc:
        return f"Error: {exc}"


@mcp.tool()
def create_file(filename: str, content: str) -> str:
    """Create a new file; fails if it already exists."""
    try:
        full = safe_path(filename)
        if os.path.exists(full):
            return f"File {filename} already exists."
        write_text(full, content)
        return f"File created: {filename}"
    except (OSError, ValueError) as exc:
        return f"Error: {exc}"


@mcp.tool()
def create_folder(foldername: str) -> str:
    """Create a folder (parents are created as needed)."""
    try:
        full = safe_path(foldername)
        if os.path.exists(full):
            return f"Folder {foldername} already exists."
        os.makedirs(full)
        return f"Folder {foldername} created."
    except (OSError, ValueError) as exc:
        return f"Error: {exc}"


@mcp.tool()
def list_files(directory: str = "") -> str:
    """List one directory (path relative to user_project/)."""
    try:
        return _list_dir(directory)
    except (OSError, ValueError) as exc:
        return f"Error: {exc}"


@mcp.tool()
def move_file(source: str, destination: str) -> str:
    """Move/rename a file or folder inside user_project/. Refuses to overwrite."""
    try:
        src, dst = safe_path(source), safe_path(destination)
        if not os.path.exists(src):
            return f"{source} does not exist."
        if os.path.exists(dst):
            return f"{destination} already exists."
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.move(src, dst)
        return f"Moved {source} -> {destination}"
    except (OSError, ValueError) as exc:
        return f"Error: {exc}"


@mcp.tool()
def search_in_project(project_name: str, query: str, regex: bool = False, max_results: int = 50) -> str:
    """Grep through a project's files. Returns 'path:line: text' matches."""
    try:
        files = load_project_files(project_root(project_name))
        pattern = re.compile(query if regex else re.escape(query), re.I)
    except (ValueError, OSError, re.error) as exc:
        return f"Error: {exc}"
    hits = []
    for p, c in sorted(files.items()):
        for i, line in enumerate(c.splitlines(), 1):
            if pattern.search(line):
                hits.append(f"{p}:{i}: {line.strip()[:200]}")
                if len(hits) >= max_results:
                    return "\n".join(hits) + f"\n... (stopped at {max_results} matches)"
    return "\n".join(hits) or "No matches."


@mcp.tool()
def delete_file(filename: str) -> str:
    """Delete a single file."""
    try:
        full = safe_path(filename)
        if not os.path.isfile(full):
            return f"File {filename} does not exist."
        os.remove(full)
        return f"File {filename} deleted."
    except (OSError, ValueError) as exc:
        return f"Error: {exc}"


@mcp.tool()
def delete_folder(foldername: str, recursive: bool = False) -> str:
    """Delete a folder (must be empty unless recursive=true). Cannot delete the user_project root."""
    try:
        full = safe_path(foldername)
        if full == PROJECT_DIR or full == META_DIR:
            return "Refusing to delete a protected directory."
        if not os.path.isdir(full):
            return f"Folder {foldername} does not exist."
        shutil.rmtree(full) if recursive else os.rmdir(full)
        return f"Folder {foldername} deleted."
    except (OSError, ValueError) as exc:
        return f"Error: {exc}"


# ---------- backwards-compatible wrappers ----------

@mcp.tool()
def project_files(action: str, path: str = "", content: str = "") -> str:
    """Deprecated multiplexer kept for old clients: action = list | read | write | delete."""
    try:
        if action == "list":
            return _list_dir(path)
        if action == "read":
            return read_file(path)
        if action == "write":
            return write_file(path, content)
        if action == "delete":
            full = safe_path(path)
            return delete_folder(path, True) if os.path.isdir(full) else delete_file(path)
        return "Unsupported action (use list, read, write, delete)."
    except (OSError, ValueError) as exc:
        return f"File operation failed: {exc}"


@mcp.tool()
def jsonDataResolver(data: str) -> str:
    """Deprecated: summarise a flow JSON string. Use analyze_flow_tool instead."""
    try:
        graph = normalize_flow(data)
    except FlowError as exc:
        return f"Invalid flow JSON: {exc}"
    return render_flow_spec(graph, analyze_flow(graph))


if __name__ == "__main__":
    mcp.run(transport="stdio")