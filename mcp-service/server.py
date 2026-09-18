def write_template_project(project_path, project_name):
    os.makedirs(os.path.join(project_path, "src"), exist_ok=True)

    with open(os.path.join(project_path, "server.js"), "w") as f:
        f.write(generate_server_js_template())
    with open(os.path.join(project_path, "src", "app.js"), "w") as f:
        f.write(generate_app_js_template())
    with open(os.path.join(project_path, "package.json"), "w") as f:
        json.dump(generate_package_json(project_name), f, indent=2)
    with open(os.path.join(project_path, ".env.example"), "w") as f:
        f.write(generate_env_example_template())
    with open(os.path.join(project_path, ".gitignore"), "w") as f:
        f.write(generate_gitignore())
    with open(os.path.join(project_path, "README.md"), "w") as f:
        f.write(generate_readme_template(project_name))


# ==================================================================
# MAIN ORCHESTRATOR
# ==================================================================

def build_complete_project(flow, project_name="server-flow-api"):
    if os.path.exists(PROJECT_DIR):
        shutil.rmtree(PROJECT_DIR)
    os.makedirs(PROJECT_DIR, exist_ok=True)

    try:
        graph = normalize_flow(flow)
    except ValueError as e:
        return f"Flow validation failed: {e}"

    nodes = graph["nodes"]
    connections = graph["connections"]

    project_path = os.path.join(PROJECT_DIR, project_name)
    os.makedirs(project_path, exist_ok=True)

    if not HAS_LLM or ask_llm is None:
        write_template_project(project_path, project_name)
        return f"Project generated using Template: {project_name}/ (LLM unavailable)"

    # ---------- PHASE 1: PLAN ----------
    sys.stderr.write(f"[agent] planning project {project_name}...\n")
    plan, plan_status = plan_project_with_llm(nodes, connections)

    if not plan:
        sys.stderr.write(f"[agent] planning failed: {plan_status}, falling back to template\n")
        write_template_project(project_path, project_name)
        return f"Project generated using Template ({plan_status}): {project_name}/"

    plan_paths = [f["path"] for f in plan["files"]]
    sys.stderr.write(f"[agent] plan has {len(plan_paths)} files\n")

    # ---------- PHASE 2: WRITE EACH FILE ----------
    written_files = {}
    write_errors = []

    for file_spec in plan["files"]:
        path = file_spec["path"]
        purpose = file_spec.get("purpose", "")

        if path.startswith("/") or ".." in path.split("/"):
            write_errors.append(f"skipped unsafe path: {path}")
            continue

        sys.stderr.write(f"[agent] writing {path}...\n")
        content, status = write_file_with_llm(
            path, purpose, plan, written_files, nodes, connections
        )

        if content is None:
            write_errors.append(f"{path}: {status}")
            sys.stderr.write(f"[agent] FAILED {path}: {status}\n")
            continue

        full_path = os.path.join(project_path, path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        written_files[path] = content
        sys.stderr.write(f"[agent] wrote {path} ({len(content)} chars)\n")

    # ---------- PHASE 3: VERIFY + FILL GAPS ----------
    sys.stderr.write("[agent] verifying...\n")
    verification = verify_project_with_llm(plan, written_files, nodes, connections)

    for missing_path in verification.get("missing", []):
        if missing_path in written_files:
            continue
        if missing_path.startswith("/") or ".." in missing_path.split("/"):
            continue
        sys.stderr.write(f"[agent] writing missing file {missing_path}...\n")
        content, status = write_file_with_llm(
            missing_path, "missing file added during verification",
            plan, written_files, nodes, connections
        )
        if content is None:
            continue
        full_path = os.path.join(project_path, missing_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        written_files[missing_path] = content

    gitignore_path = os.path.join(project_path, ".gitignore")
    if not os.path.exists(gitignore_path):
        with open(gitignore_path, "w") as f:
            f.write(generate_gitignore())

    issues = verification.get("issues", [])
    issues_note = f" | issues: {len(issues)}" if issues else ""

    return (
        f"Project generated using LLM (agent): {project_name}/ "
        f"with {len(written_files)} files, {len(connections)} connections"
        f"{issues_note}"
    )


# ==================================================================
# MCP TOOLS
# ==================================================================

@mcp.tool()
def validate_flow(flow: dict) -> str:
    try:
        normalized = normalize_flow(flow)
        return f"Flow is valid. {len(normalized['nodes'])} nodes, {len(normalized['connections'])} connections."
    except ValueError as e:
        return f"Invalid flow: {e}"


@mcp.tool()
def generate_server_from_flow(flow: dict, project_name: str = "server-flow-api") -> str:
    return build_complete_project(flow, project_name)


@mcp.tool()
def plan_project(flow: dict) -> str:
    try:
        graph = normalize_flow(flow)
    except ValueError as e:
        return f"Invalid flow: {e}"
    plan, status = plan_project_with_llm(graph["nodes"], graph["connections"])
    if not plan:
        return f"Planning failed: {status}"
    lines = [f"Project type: {plan.get('project_type', 'unknown')}"]
    for f in plan["files"]:
        lines.append(f"  {f['path']}  —  {f.get('purpose', '')}")
    return "\n".join(lines)


@mcp.tool()
def project_files(action: str, path: str = "", content: str = "") -> str:
    try:
        if action == "list":
            file_path = safe_path(path) if path else PROJECT_DIR
            if not os.path.isdir(file_path):
                return f"Directory not found: {path or '.'}"
            items = os.listdir(file_path)
            if not items:
                return "Directory is empty."
            result = []
            for item in sorted(items):
                item_path = os.path.join(file_path, item)
                if os.path.isdir(item_path):
                    result.append(f"Folder: {item}/")
                else:
                    size = os.path.getsize(item_path)
                    result.append(f"File: {item} ({format_size(size)})")
            return "\n".join(result)

        elif action == "read":
            file_path = safe_path(path)
            if not os.path.exists(file_path):
                return f"File not found: {path}"
            with open(file_path, "r") as f:
                return f.read()

        elif action == "write":
            file_path = safe_path(path)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "w") as f:
                f.write(content)
            return f"Wrote {path}"

        elif action == "delete":
            file_path = safe_path(path)
            if not os.path.exists(file_path):
                return f"File not found: {path}"
            if os.path.isdir(file_path):
                shutil.rmtree(file_path)
                return f"Deleted folder: {path}"
            os.remove(file_path)
            return f"Deleted file: {path}"
        return "Unsupported action."
    except (OSError, ValueError) as exc:
        return f"File operation failed: {exc}"


@mcp.tool()
def jsonDataResolver(data: str) -> str:
    try:
        graph = normalize_flow(data)
        nodes = [f"{n['id']}: {n['category']} {n['type']}" for n in graph["nodes"]]
        edges = [f"{e['source']} -> {e['target']}" for e in graph["connections"]]
        return "Nodes:\n" + "\n".join(nodes) + "\nConnections:\n" + "\n".join(edges)
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        return f"Invalid flow JSON: {exc}"


@mcp.tool()
def hello(name: str) -> str:
    return f"Hello, {name}!"


@mcp.tool()
def read_file(filename: str) -> str:
    try:
        with open(safe_path(filename), "r") as f:
            return f.read()
    except Exception as e:
        return f"Error: {e}"


@mcp.tool()
def write_file(filename: str, content: str) -> str:
    try:
        path = safe_path(filename)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(content)
        return f"Data written to {filename}"
    except Exception as e:
        return f"Error: {e}"


@mcp.tool()
def create_file(filename: str, content: str) -> str:
    try:
        path = safe_path(filename)
        if os.path.exists(path):
            return f"File {filename} already exists."
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(content)
        return f"File created: {filename}"
    except Exception as e:
        return f"Error: {e}"


@mcp.tool()
def create_folder(foldername: str) -> str:
    try:
        path = safe_path(foldername)
        if os.path.exists(path):
            return f"Folder {foldername} already exists."
        os.mkdir(path)
        return f"Folder {foldername} created."
    except Exception as e:
        return f"Error: {e}"


@mcp.tool()
def list_files(directory: str = "") -> str:
    try:
        path = safe_path(directory)
        items = os.listdir(path)
        if not items:
            return "Directory is empty."
        result = []
        for item in sorted(items):
            item_path = os.path.join(path, item)
            if os.path.isdir(item_path):
                result.append(f"Folder: {item}/")
            else:
                result.append(f"File: {item} ({format_size(os.path.getsize(item_path))})")
        return "\n".join(result)
    except Exception as e:
        return f"Error: {e}"


@mcp.tool()
def delete_file(filename: str) -> str:
    try:
        path = safe_path(filename)
        if not os.path.exists(path):
            return f"File {filename} does not exist."
        os.remove(path)
        return f"File {filename} deleted."
    except Exception as e:
        return f"Error: {e}"


@mcp.tool()
def delete_folder(foldername: str, recursive: bool = False) -> str:
    try:
        path = safe_path(foldername)
        if not os.path.exists(path):
            return f"Folder {foldername} does not exist."
        if recursive:
            shutil.rmtree(path)
        else:
            os.rmdir(path)
        return f"Folder {foldername} deleted."
    except OSError as e:
        return f"Error: {e}"


if __name__ == "__main__":
    mcp.run(transport="stdio")