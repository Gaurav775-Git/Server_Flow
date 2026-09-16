import os
import json
import shutil
import hashlib
from datetime import datetime
from mcp.server.fastmcp import FastMCP
import re

try:
    from llm import ask_llm
    HAS_LLM = True
except ImportError:
    HAS_LLM = False
    ask_llm = None

mcp = FastMCP("Server_Flow")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.join(BASE_DIR, "user_project")
os.makedirs(PROJECT_DIR, exist_ok=True)

HTTP_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"}


def safe_path(relative_path: str) -> str:
    full_path = os.path.abspath(os.path.join(PROJECT_DIR, relative_path))
    if not full_path.startswith(PROJECT_DIR):
        raise ValueError("Access outside the project directory is not permitted.")
    return full_path


def format_size(size_bytes: int) -> str:
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"


def normalize_flow(flow) -> dict:
    if isinstance(flow, str):
        flow = json.loads(flow)
    if not isinstance(flow, dict):
        raise ValueError("Flow must be a JSON object.")

    nodes = flow.get("nodes", [])
    connections = flow.get("connections", [])

    if not isinstance(nodes, list):
        raise ValueError("Flow must contain a nodes array.")
    if not isinstance(connections, list):
        raise ValueError("Flow must contain a connections array.")

    normalized_nodes = []
    ids = set()

    for node in nodes:
        if not isinstance(node, dict):
            raise ValueError("Each node must be a dictionary.")
        if not isinstance(node.get("id"), str):
            raise ValueError("Every node needs a string id.")
        if node["id"] in ids:
            raise ValueError(f"Duplicate node id: {node['id']}")
        ids.add(node["id"])

        category = str(node.get("category", "")).upper()
        if category not in {"HTTP", "DATABASE", "AUTH", "LOGIC", "TRANSFORM", "RESPONSE"}:
            raise ValueError(f"Unsupported node category: {category or 'missing'}")

        config = node.get("configuration") or {}
        if not isinstance(config, dict):
            raise ValueError(f"Node {node['id']} configuration must be an object.")

        if category == "HTTP":
            endpoint = config.get("endpoint") or config.get("path") or config.get("route")
            if not endpoint:
                config["endpoint"] = "/"
            elif not endpoint.startswith("/"):
                config["endpoint"] = "/" + endpoint.lstrip("/")

        normalized_nodes.append({
            "id": node["id"],
            "category": category,
            "type": str(node.get("type", "")).upper(),
            "configuration": config
        })

    for connection in connections:
        if not isinstance(connection, dict):
            raise ValueError("Each connection must be a dictionary.")
        if connection.get("source") not in ids:
            raise ValueError(f"Connection source {connection.get('source')} not found.")
        if connection.get("target") not in ids:
            raise ValueError(f"Connection target {connection.get('target')} not found.")

    return {"nodes": normalized_nodes, "connections": connections}


def generate_code_with_llm(nodes, connections):
    """Returns (code, status_message)"""
    if not HAS_LLM or ask_llm is None:
        return None, "LLM module not available"

    node_desc = []
    for node in nodes:
        config = node["configuration"]
        desc = f"id: {node['id']}, category: {node['category']}, type: {node['type']}"
        if node["category"] == "HTTP":
            endpoint = config.get("endpoint", "/")
            method = node["type"] if node["type"] in HTTP_METHODS else "GET"
            desc += f", method: {method}, endpoint: {endpoint}"
        if config.get("description"):
            desc += f", description: {config['description']}"
        for key in ["auth", "table", "status", "query", "message"]:
            if key in config:
                desc += f", {key}: {config[key]}"
        node_desc.append(desc)

    conn_desc = [f"{conn['source']} -> {conn['target']}" for conn in connections]

    prompt = f"""You are an expert Node.js developer. Given the following backend workflow described by nodes and connections, generate a complete Express.js server with proper routes, middleware, database integration, and error handling.

Nodes:
{chr(10).join('- ' + d for d in node_desc)}

Connections:
{chr(10).join('- ' + d for d in conn_desc)}

Requirements:
- Use Express.js with CORS, Helmet, JSON parsing, and Morgan logging.
- Use environment variables for configuration (dotenv).
- Use async/await for all asynchronous operations.
- Include proper error handling (try/catch with 500 errors).
- For HTTP nodes, create appropriate route handlers.
- For DATABASE nodes, include database connection and queries (use PostgreSQL, assume `pool` from `pg`).
- For AUTH nodes, include authentication middleware (JWT).
- For RESPONSE nodes, format appropriate JSON responses.
- Include a health check endpoint `GET /health`.
- Include a 404 handler and a global error handler.
- The code should be production-ready and well-structured.

Generate ONLY the JavaScript code for a complete `app.js` file (no extra text or explanation). It should require and use `dotenv`, `express`, etc. Do not include `server.listen` – just export the app as `module.exports = app;`.
"""
    try:
        response = ask_llm([{"role": "user", "content": prompt}])
        code = response.get("content", "")
        code = re.sub(r'^```javascript\s*', '', code, flags=re.MULTILINE)
        code = re.sub(r'^```\s*', '', code, flags=re.MULTILINE)
        code = re.sub(r'```$', '', code, flags=re.MULTILINE)
        code = code.strip()

        if not code:
            return None, "LLM returned empty code"

        return code, "LLM"
    except Exception as e:
        error_msg = f"LLM error: {str(e)}"
        print(f"[generate_code_with_llm] {error_msg}")
        return None, error_msg


def generate_app_js_template(routes, middlewares, database_config, auth_config):
    lines = [
        "const express = require('express');",
        "const cors = require('cors');",
        "const helmet = require('helmet');",
        "const morgan = require('morgan');",
        "require('dotenv').config();",
        "",
        "const app = express();",
        "",
        "app.use(helmet());",
        "app.use(cors());",
        "app.use(express.json());",
        "app.use(express.urlencoded({ extended: true }));",
        "app.use(morgan('dev'));",
        "",
    ]

    for middleware in middlewares:
        lines.append(f"app.use({middleware['code']});")
        lines.append("")

    if database_config:
        lines.extend([
            "const db = require('./config/database');",
            "db.connect();",
            "",
        ])

    if auth_config:
        lines.extend([
            "const auth = require('./middleware/auth');",
            "app.use(auth.initialize());",
            "",
        ])

    lines.append("const apiRoutes = require('./routes');")
    lines.append("app.use('/api', apiRoutes);")
    lines.append("")

    lines.extend([
        "app.get('/health', (req, res) => {",
        "  res.json({ status: 'OK', timestamp: new Date().toISOString() });",
        "});",
        "",
        "app.use((req, res) => {",
        "  res.status(404).json({ error: 'Route not found' });",
        "});",
        "",
        "app.use((err, req, res, next) => {",
        "  console.error('Error:', err.stack);",
        "  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });",
        "});",
        "",
        "module.exports = app;",
    ])

    return "\n".join(lines)


def generate_server_js():
    return """const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
"""


def generate_routes_index(routes):
    lines = [
        "const express = require('express');",
        "const router = express.Router();",
        "",
    ]

    route_names = set()
    for route in routes:
        name = route.get('name', 'default')
        import_name = name.lower().replace(' ', '_').replace('-', '_')
        if import_name not in route_names:
            route_names.add(import_name)
            lines.append(f"const {import_name}Routes = require('./{import_name}');")
            lines.append(f"router.use('/{import_name}', {import_name}Routes);")

    lines.append("")
    lines.append("module.exports = router;")
    return "\n".join(lines)


def generate_route_file(route_name, endpoints):
    name = route_name.lower().replace(' ', '_').replace('-', '_')
    controller_name = name + '_controller'

    lines = [
        "const express = require('express');",
        "const router = express.Router();",
        f"const {controller_name} = require('../controllers/{name}.controller');",
        "",
    ]

    for endpoint in endpoints:
        method = endpoint.get('method', 'GET').lower()
        path = endpoint.get('path', '/')
        needs_auth = endpoint.get('auth', False)

        if needs_auth:
            lines.append(f"router.{method}('{path}', auth, {controller_name}.{endpoint.get('handler', 'handler')});")
        else:
            lines.append(f"router.{method}('{path}', {controller_name}.{endpoint.get('handler', 'handler')});")
        lines.append("")

    lines.append("module.exports = router;")
    return "\n".join(lines)


def generate_controller_file(controller_name, endpoints):
    lines = []

    for endpoint in endpoints:
        handler = endpoint.get('handler', 'handler')
        lines.extend([
            f"exports.{handler} = async (req, res, next) => {{",
            "  try {",
            "    res.json({ message: 'Success', data: req.body });",
            "  } catch (error) {",
            "    next(error);",
            "  }",
            "};",
            "",
        ])

    return "\n".join(lines)


def generate_validation_middleware():
    return """const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });
    }
    next();
  };
};

module.exports = { validate };
"""


def generate_auth_middleware():
    return """const jwt = require('jsonwebtoken');

const auth = {
  initialize: () => (req, res, next) => next(),
  authenticate: (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
};

module.exports = auth;
"""


def generate_database_config():
    return """const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'serverflow',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

const connect = async () => {
  try {
    await pool.connect();
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = { pool, connect };
"""


def generate_package_json(project_name, dependencies):
    default_deps = {
        "express": "^4.21.2",
        "cors": "^2.8.5",
        "dotenv": "^16.4.5",
        "helmet": "^7.0.0",
        "morgan": "^1.10.0",
        "joi": "^17.12.0",
        "jsonwebtoken": "^9.0.0",
        "bcryptjs": "^2.4.3",
        "pg": "^8.11.0"
    }

    all_deps = {**default_deps, **dependencies}

    return {
        "name": project_name.lower().replace(' ', '-'),
        "version": "1.0.0",
        "description": "Generated by Server Flow",
        "main": "server.js",
        "scripts": {
            "start": "node server.js",
            "dev": "nodemon server.js"
        },
        "dependencies": all_deps,
        "devDependencies": {"nodemon": "^3.1.0"}
    }


def generate_env_example():
    return """PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=serverflow
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your_super_secret_jwt_key_here
"""


def generate_readme(project_name, routes):
    lines = [
        f"# {project_name}",
        "",
        "Generated by Server Flow",
        "",
        "## Quick Start",
        "",
        "```bash",
        "npm install",
        "cp .env.example .env",
        "npm run dev",
        "```",
        "",
        "## API Endpoints",
        "",
        "| Method | Endpoint | Description |",
        "|--------|----------|-------------|",
    ]

    for route in routes:
        method = route.get('method', 'GET')
        path = route.get('path', '/')
        description = route.get('description', '')
        lines.append(f"| {method} | `/api{path}` | {description} |")

    return "\n".join(lines)


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

    routes = []
    middlewares = []
    database_config = None
    auth_config = None

    for node in nodes:
        config = node["configuration"]
        category = node["category"]
        if category == "HTTP":
            method = node["type"] if node["type"] in HTTP_METHODS else "GET"
            endpoint = config.get("endpoint") or config.get("path") or config.get("route") or "/"
            if not endpoint.startswith("/"):
                endpoint = "/" + endpoint.lstrip("/")
            routes.append({
                "method": method,
                "path": endpoint,
                "description": config.get("description", ""),
                "auth": config.get("auth", False),
                "name": config.get("name", "default"),
                "handler": config.get("handler", "handler")
            })
        elif category == "DATABASE":
            database_config = {"type": node["type"], "description": config.get("description", "Database")}
        elif category == "AUTH":
            auth_config = {"type": node["type"], "description": config.get("description", "Authentication")}

    project_path = os.path.join(PROJECT_DIR, project_name)
    os.makedirs(project_path, exist_ok=True)

    folders = [
        "src/config", "src/controllers", "src/middleware",
        "src/models", "src/routes", "src/services", "src/utils", "tests"
    ]
    for folder in folders:
        os.makedirs(os.path.join(project_path, folder), exist_ok=True)

    llm_code, llm_status = generate_code_with_llm(nodes, connections) if HAS_LLM else (None, "LLM not loaded")

    if llm_code:
        with open(os.path.join(project_path, "src", "app.js"), "w") as f:
            f.write(llm_code)
    else:
        with open(os.path.join(project_path, "src", "app.js"), "w") as f:
            f.write(generate_app_js_template(routes, middlewares, database_config, auth_config))

    with open(os.path.join(project_path, "src", "server.js"), "w") as f:
        f.write(generate_server_js())

    deps = {}
    if database_config:
        deps["pg"] = "^8.11.0"
    if auth_config:
        deps["jsonwebtoken"] = "^9.0.0"
        deps["bcryptjs"] = "^2.4.3"

    with open(os.path.join(project_path, "package.json"), "w") as f:
        json.dump(generate_package_json(project_name, deps), f, indent=2)

    with open(os.path.join(project_path, ".env.example"), "w") as f:
        f.write(generate_env_example())

    with open(os.path.join(project_path, "README.md"), "w") as f:
        f.write(generate_readme(project_name, routes))

    with open(os.path.join(project_path, ".gitignore"), "w") as f:
        f.write("node_modules/\n.env\ndist/\n*.log\n")

    if database_config:
        with open(os.path.join(project_path, "src", "config", "database.js"), "w") as f:
            f.write(generate_database_config())

    with open(os.path.join(project_path, "src", "middleware", "validate.js"), "w") as f:
        f.write(generate_validation_middleware())

    if auth_config:
        with open(os.path.join(project_path, "src", "middleware", "auth.js"), "w") as f:
            f.write(generate_auth_middleware())

    if routes:
        route_groups = {}
        for route in routes:
            name = route.get('name', 'default')
            route_groups.setdefault(name, []).append(route)

        for name, endpoints in route_groups.items():
            route_filename = name.lower().replace(' ', '_').replace('-', '_') + '.js'
            with open(os.path.join(project_path, "src", "routes", route_filename), "w") as f:
                f.write(generate_route_file(name, endpoints))

            controller_filename = name.lower().replace(' ', '_').replace('-', '_') + '.controller.js'
            with open(os.path.join(project_path, "src", "controllers", controller_filename), "w") as f:
                f.write(generate_controller_file(name, endpoints))

        with open(os.path.join(project_path, "src", "routes", "index.js"), "w") as f:
            f.write(generate_routes_index(routes))

    source = "LLM" if llm_code else f"Template ({llm_status})"
    return f"Project generated using {source}: {project_name}/ with {len(routes)} routes"


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
            with open(file_path, "r") as file:
                return file.read()

        elif action == "write":
            file_path = safe_path(path)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "w") as file:
                file.write(content)
            return f"Wrote {path}"

        elif action == "delete":
            file_path = safe_path(path)
            if not os.path.exists(file_path):
                return f"File not found: {path}"
            if os.path.isdir(file_path):
                shutil.rmtree(file_path)
                return f"Deleted folder: {path}"
            else:
                os.remove(file_path)
                return f"Deleted file: {path}"
        else:
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