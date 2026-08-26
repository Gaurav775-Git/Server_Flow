import os
import json
import shutil
import hashlib
from datetime import datetime
from pathlib import Path
from mcp.server.fastmcp import FastMCP
import re

# Try to import your LLM module
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
    if not HAS_LLM or ask_llm is None:
        return None

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
        return code.strip()
    except Exception as e:
        print(f"LLM generation error: {e}")
        return None

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
        "  res.json({",
        "    status: 'OK',",
        "    timestamp: new Date().toISOString(),",
        "    uptime: process.uptime()",
        "  });",
        "});",
        "",
    ])
    
    lines.extend([
        "app.use((req, res) => {",
        "  res.status(404).json({ error: 'Route not found' });",
        "});",
        "",
    ])
    
    lines.extend([
        "app.use((err, req, res, next) => {",
        "  console.error('Error:', err.stack);",
        "  res.status(err.status || 500).json({",
        "    error: err.message || 'Internal Server Error',",
        "    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })",
        "  });",
        "});",
        "",
        "module.exports = app;",
    ])
    
    return "\n".join(lines)

def generate_server_js():
    return """const app = require('./app');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
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
        f"const router = express.Router();",
        f"const {controller_name} = require('../controllers/{name}.controller');",
        "const { validate } = require('../middleware/validate');",
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
    name = controller_name.lower().replace(' ', '_').replace('-', '_')
    
    lines = []
    
    for endpoint in endpoints:
        handler = endpoint.get('handler', 'handler')
        
        lines.extend([
            f"exports.{handler} = async (req, res, next) => {{",
            "  try {",
            "    res.json({",
            "      message: 'Success',",
            "      data: req.body",
            "    });",
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
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }
    next();
  };
};

module.exports = { validate };
"""

def generate_auth_middleware():
    return """const jwt = require('jsonwebtoken');

const auth = {
  initialize: () => {
    return (req, res, next) => {
      next();
    };
  },
  
  authenticate: (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  },
  
  authorize: (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    };
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
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
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
        "description": "Generated by Server Flow - Complete Backend API",
        "main": "server.js",
        "scripts": {
            "start": "node server.js",
            "dev": "nodemon server.js",
            "test": "jest",
            "lint": "eslint .",
            "format": "prettier --write ."
        },
        "dependencies": all_deps,
        "devDependencies": {
            "nodemon": "^3.1.0",
            "jest": "^29.7.0",
            "eslint": "^8.57.0",
            "prettier": "^3.2.0"
        },
        "engines": {
            "node": ">=18.0.0"
        }
    }

def generate_dockerfile():
    return """FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
"""

def generate_docker_compose():
    return """version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=serverflow
      - DB_USER=postgres
      - DB_PASSWORD=password
    depends_on:
      - postgres
    volumes:
      - ./logs:/app/logs

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=serverflow
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
"""

def generate_env_example():
    return """PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=serverflow
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
LOG_LEVEL=info
"""

def generate_readme(project_name, routes):
    lines = [
        f"# {project_name}",
        "",
        "Generated by Server Flow - Complete Backend API",
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
        "| Method | Endpoint | Description | Auth |",
        "|--------|----------|-------------|------|",
    ]
    
    for route in routes:
        method = route.get('method', 'GET')
        path = route.get('path', '/')
        description = route.get('description', '')
        auth = 'Yes' if route.get('auth', False) else 'No'
        lines.append(f"| {method} | `/api{path}` | {description} | {auth} |")
    
    lines.extend([
        "",
        "## Project Structure",
        "",
        "```",
        f"{project_name}/",
        "├── src/",
        "│   ├── config/",
        "│   │   └── database.js",
        "│   ├── controllers/",
        "│   │   └── *.controller.js",
        "│   ├── middleware/",
        "│   │   ├── auth.js",
        "│   │   └── validate.js",
        "│   ├── models/",
        "│   │   └── *.model.js",
        "│   ├── routes/",
        "│   │   ├── index.js",
        "│   │   └── *.js",
        "│   ├── services/",
        "│   │   └── *.service.js",
        "│   ├── utils/",
        "│   │   └── helpers.js",
        "│   ├── app.js",
        "│   └── server.js",
        "├── tests/",
        "│   └── *.test.js",
        "├── .env.example",
        "├── .gitignore",
        "├── Dockerfile",
        "├── docker-compose.yml",
        "├── package.json",
        "└── README.md",
        "```",
        "",
        "## Docker Deployment",
        "",
        "```bash",
        "docker-compose up --build",
        "```",
    ])
    
    return "\n".join(lines)

def build_complete_project(flow, project_name="server-flow-api"):
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
        elif category == "MIDDLEWARE":
            middlewares.append({"description": config.get("description", "Middleware"), "code": config.get("code", "() => {}")})

    project_path = os.path.join(PROJECT_DIR, project_name)
    os.makedirs(project_path, exist_ok=True)

    folders = [
        "src/config",
        "src/controllers",
        "src/middleware",
        "src/models",
        "src/routes",
        "src/services",
        "src/utils",
        "tests"
    ]
    for folder in folders:
        os.makedirs(os.path.join(project_path, folder), exist_ok=True)

    llm_code = generate_code_with_llm(nodes, connections) if HAS_LLM else None

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

    with open(os.path.join(project_path, "Dockerfile"), "w") as f:
        f.write(generate_dockerfile())
    with open(os.path.join(project_path, "docker-compose.yml"), "w") as f:
        f.write(generate_docker_compose())

    with open(os.path.join(project_path, ".gitignore"), "w") as f:
        f.write("""node_modules/
.env
dist/
coverage/
*.log
.DS_Store
*.pid
""")

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
            if name not in route_groups:
                route_groups[name] = []
            route_groups[name].append(route)

        for name, endpoints in route_groups.items():
            route_filename = name.lower().replace(' ', '_').replace('-', '_') + '.js'
            with open(os.path.join(project_path, "src", "routes", route_filename), "w") as f:
                f.write(generate_route_file(name, endpoints))
            controller_filename = name.lower().replace(' ', '_').replace('-', '_') + '.controller.js'
            with open(os.path.join(project_path, "src", "controllers", controller_filename), "w") as f:
                f.write(generate_controller_file(name, endpoints))

        with open(os.path.join(project_path, "src", "routes", "index.js"), "w") as f:
            f.write(generate_routes_index(routes))

    with open(os.path.join(project_path, "src", "utils", "helpers.js"), "w") as f:
        f.write("""exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

exports.omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

exports.pick = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (key in obj) result[key] = obj[key];
    return result;
  }, {});
};
""")

    with open(os.path.join(project_path, "src", "models", "base.model.js"), "w") as f:
        f.write("""const { pool } = require('../config/database');

class BaseModel {
  static async query(sql, params = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

module.exports = BaseModel;
""")

    status = "LLM" if llm_code else "Template"
    return f"Complete project generated using {status}: {project_name}/ with {len(routes)} routes, database: {database_config['type'] if database_config else 'None'}, auth: {auth_config['type'] if auth_config else 'None'}"

@mcp.tool()
def validate_flow(flow: dict) -> str:
    try:
        normalized = normalize_flow(flow)
        return f"Flow is valid. Found {len(normalized['nodes'])} nodes and {len(normalized['connections'])} connections."
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
            if not path:
                return "Error: path required for read action"
            file_path = safe_path(path)
            if not os.path.exists(file_path):
                return f"File not found: {path}"
            with open(file_path, "r") as file:
                return file.read()
                
        elif action == "write":
            if not path:
                return "Error: path required for write action"
            file_path = safe_path(path)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "w") as file:
                file.write(content)
            return f"Wrote {path}"
            
        elif action == "delete":
            if not path:
                return "Error: path required for delete action"
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
            return "Unsupported action. Use list, read, write, or delete."
            
    except (OSError, ValueError) as exc:
        return f"File operation failed: {exc}"

@mcp.tool()
def jsonDataResolver(data: str) -> str:
    try:
        graph = normalize_flow(data)
        nodes = [f"{node['id']}: {node['category']} {node['type']} {node['configuration']}" for node in graph["nodes"]]
        edges = [f"{edge['source']} -> {edge['target']}" for edge in graph["connections"]]
        return "Nodes:\n" + "\n".join(nodes) + "\nConnections:\n" + "\n".join(edges)
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        return f"Invalid flow JSON: {exc}"

@mcp.tool()
def hello(name: str) -> str:
    return f"Hello, {name}!"

@mcp.tool()
def read_file(filename: str) -> str:
    try:
        path = safe_path(filename)
        with open(path, "r") as f:
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
                size = os.path.getsize(item_path)
                result.append(f"File: {item} ({format_size(size)})")
        return "\n".join(result)
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
def delete_file(filename: str) -> str:
    try:
        path = safe_path(filename)
        if not os.path.exists(path):
            return f"File {filename} does not exist."
        if os.path.isdir(path):
            return f"{filename} is a folder. Use delete_folder instead."
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
        if not os.path.isdir(path):
            return f"{foldername} is a file. Use delete_file instead."
        if recursive:
            shutil.rmtree(path)
            return f"Folder {foldername} deleted recursively."
        else:
            os.rmdir(path)
            return f"Folder {foldername} deleted."
    except OSError as e:
        return f"Error: {e}. Folder may not be empty. Use recursive=True."

@mcp.tool()
def move_file(source: str, destination: str) -> str:
    try:
        src_path = safe_path(source)
        dst_path = safe_path(destination)
        if not os.path.exists(src_path):
            return f"Source {source} does not exist."
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        shutil.move(src_path, dst_path)
        return f"Moved/renamed {source} -> {destination}"
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
def copy_file(source: str, destination: str) -> str:
    try:
        src_path = safe_path(source)
        dst_path = safe_path(destination)
        if not os.path.exists(src_path):
            return f"Source {source} does not exist."
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        shutil.copy2(src_path, dst_path)
        return f"Copied {source} -> {destination}"
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
def file_info(path: str) -> str:
    try:
        full_path = safe_path(path)
        if not os.path.exists(full_path):
            return f"Path {path} does not exist."
        
        stat = os.stat(full_path)
        info = {
            "name": os.path.basename(full_path),
            "type": "Directory" if os.path.isdir(full_path) else "File",
            "size": format_size(os.path.getsize(full_path)) if os.path.isfile(full_path) else "N/A",
            "created": datetime.fromtimestamp(stat.st_ctime).strftime("%Y-%m-%d %H:%M:%S"),
            "modified": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
            "accessed": datetime.fromtimestamp(stat.st_atime).strftime("%Y-%m-%d %H:%M:%S"),
            "path": full_path
        }
        if os.path.isdir(full_path):
            items = os.listdir(full_path)
            info["items"] = len(items)
            info["subfolders"] = sum(1 for i in items if os.path.isdir(os.path.join(full_path, i)))
            info["files"] = sum(1 for i in items if os.path.isfile(os.path.join(full_path, i)))
        
        return json.dumps(info, indent=2)
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
def read_json(filename: str) -> str:
    try:
        path = safe_path(filename)
        with open(path, "r") as f:
            data = json.load(f)
        return json.dumps(data, indent=2)
    except FileNotFoundError:
        return f"File {filename} not found."
    except json.JSONDecodeError as e:
        return f"Invalid JSON: {e}"
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
def write_json(filename: str, data: dict) -> str:
    try:
        path = safe_path(filename)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
        return f"JSON written to {filename}"
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
def update_json(filename: str, updates: dict) -> str:
    try:
        path = safe_path(filename)
        if not os.path.exists(path):
            return f"File {filename} does not exist."
        
        with open(path, "r") as f:
            data = json.load(f)
        
        def deep_merge(base, updates):
            for key, value in updates.items():
                if isinstance(value, dict) and key in base and isinstance(base[key], dict):
                    deep_merge(base[key], value)
                else:
                    base[key] = value
            return base
        
        data = deep_merge(data, updates)
        
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
        return f"JSON updated in {filename}"
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
def search_in_file(filename: str, pattern: str, case_sensitive: bool = False) -> str:
    try:
        path = safe_path(filename)
        if not os.path.exists(path):
            return f"File {filename} does not exist."
        
        flags = 0 if case_sensitive else re.IGNORECASE
        compiled_pattern = re.compile(pattern, flags)
        
        matches = []
        with open(path, "r") as f:
            for line_num, line in enumerate(f, 1):
                if compiled_pattern.search(line):
                    matches.append(f"Line {line_num}: {line.strip()}")
        
        if matches:
            return f"Found {len(matches)} matches:\n" + "\n".join(matches)
        return f"No matches found for pattern: {pattern}"
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
def find_in_files(directory: str, pattern: str, file_pattern: str = "*") -> str:
    try:
        path = safe_path(directory)
        if not os.path.exists(path):
            return f"Directory {directory} does not exist."
        
        import glob
        results = []
        search_path = os.path.join(path, file_pattern)
        for file_path in glob.glob(search_path, recursive=True):
            if os.path.isfile(file_path):
                try:
                    with open(file_path, "r", errors="ignore") as f:
                        for line_num, line in enumerate(f, 1):
                            if pattern in line:
                                results.append(f"{os.path.basename(file_path)}:{line_num}: {line.strip()}")
                except:
                    continue
        
        if results:
            return f"Found {len(results)} matches:\n" + "\n".join(results[:50])
        return f"No matches found for pattern: {pattern} in {directory}"
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
def get_file_hash(filename: str, algorithm: str = "sha256") -> str:
    try:
        path = safe_path(filename)
        if not os.path.exists(path):
            return f"File {filename} does not exist."
        
        algorithms = {
            "sha256": hashlib.sha256,
            "md5": hashlib.md5,
            "sha1": hashlib.sha1,
            "sha512": hashlib.sha512
        }
        
        if algorithm not in algorithms:
            return f"Unsupported algorithm: {algorithm}. Use: sha256, md5, sha1, sha512"
        
        hasher = algorithms[algorithm]()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hasher.update(chunk)
        
        return f"{algorithm.upper()}: {hasher.hexdigest()}"
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
def count_files(directory: str, recursive: bool = False) -> str:
    try:
        path = safe_path(directory)
        if not os.path.exists(path):
            return f"Directory {directory} does not exist."
        
        total_files = 0
        total_folders = 0
        
        if recursive:
            for root, dirs, files in os.walk(path):
                total_files += len(files)
                total_folders += len(dirs)
        else:
            items = os.listdir(path)
            for item in items:
                if os.path.isdir(os.path.join(path, item)):
                    total_folders += 1
                else:
                    total_files += 1
        
        return f"{directory}: Folders: {total_folders}, Files: {total_files}, Total: {total_files + total_folders}"
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
def get_folder_size(directory: str) -> str:
    try:
        path = safe_path(directory)
        if not os.path.exists(path):
            return f"Directory {directory} does not exist."
        
        total_size = 0
        for root, dirs, files in os.walk(path):
            for file in files:
                file_path = os.path.join(root, file)
                total_size += os.path.getsize(file_path)
        
        return f"Total size of {directory}: {format_size(total_size)}"
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
def read_file_range(filename: str, start_line: int, end_line: int) -> str:
    try:
        path = safe_path(filename)
        if not os.path.exists(path):
            return f"File {filename} does not exist."
        
        if start_line < 1:
            start_line = 1
        
        with open(path, "r") as f:
            lines = f.readlines()
        
        if start_line > len(lines):
            return f"Start line {start_line} exceeds file length ({len(lines)} lines)."
        
        end_line = min(end_line, len(lines))
        result = []
        for i in range(start_line - 1, end_line):
            result.append(f"{i+1}: {lines[i].rstrip()}")
        
        return "\n".join(result)
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
def append_to_file(filename: str, content: str) -> str:
    try:
        path = safe_path(filename)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "a") as f:
            f.write(content)
            if not content.endswith("\n"):
                f.write("\n")
        return f"Appended to {filename}"
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
def prepend_to_file(filename: str, content: str) -> str:
    try:
        path = safe_path(filename)
        if not os.path.exists(path):
            return f"File {filename} does not exist."
        
        with open(path, "r") as f:
            existing = f.read()
        
        with open(path, "w") as f:
            f.write(content)
            if not content.endswith("\n"):
                f.write("\n")
            f.write(existing)
        
        return f"Prepended to {filename}"
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
def get_file_extension(filename: str) -> str:
    _, ext = os.path.splitext(filename)
    return ext if ext else "No extension"

@mcp.tool()
def change_file_extension(filename: str, new_extension: str) -> str:
    try:
        path = safe_path(filename)
        if not os.path.exists(path):
            return f"File {filename} does not exist."
        
        if not new_extension.startswith("."):
            new_extension = "." + new_extension
        
        base = os.path.splitext(path)[0]
        new_path = base + new_extension
        
        os.rename(path, new_path)
        relative_new = os.path.relpath(new_path, PROJECT_DIR)
        return f"Extension changed: {filename} -> {relative_new}"
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    # ✅ FIXED: Use PORT from environment or default to 8000
    port = int(os.environ.get("PORT", 8000))
    mcp.run(transport="sse", host="0.0.0.0", port=port)