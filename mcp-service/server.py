import os
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Server_Flow")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def safe_path(relative_path: str) -> str:
    """Resolve a path safely, allowing subfolders but blocking traversal outside BASE_DIR."""
    full_path = os.path.abspath(os.path.join(BASE_DIR, relative_path))
    if not full_path.startswith(BASE_DIR):
        raise ValueError("Access outside the allowed directory is not permitted.")
    return full_path

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.join(BASE_DIR, "user_project")
os.makedirs(PROJECT_DIR, exist_ok=True)

def safe_path(relative_path: str) -> str:
    """Resolve a path safely inside PROJECT_DIR, allowing subfolders but blocking traversal outside it."""
    full_path = os.path.abspath(os.path.join(PROJECT_DIR, relative_path))
    if not full_path.startswith(PROJECT_DIR):
        raise ValueError("Access outside the project directory is not permitted.")
    return full_path

@mcp.tool()
def hello(name: str) -> str:
    """Greet a person by name."""
    return f"hello, {name}"

@mcp.tool()
def read_file(filename: str) -> str:
    """Read and return the contents of a text file, optionally inside a subfolder."""
    path = safe_path(filename)
    with open(path, "r") as f:
        return f.read()

@mcp.tool()
def write_file(filename: str, content: str) -> str:
    """Write text content to a file, optionally inside a subfolder. Overwrites if it already exists."""
    path = safe_path(filename)
    with open(path, "w") as f:
        f.write(content)
    return f"data inserted in {filename} successfully"

@mcp.tool()
def create_file(filename: str, content: str) -> str:
    """Create a file (optionally inside a subfolder) if it doesn't exist, and write content into it."""
    path = safe_path(filename)

    if os.path.exists(path):
        return f"File exists {filename} in this directory."

    os.makedirs(os.path.dirname(path), exist_ok=True)

    with open(path, "w") as f:
        f.write(content)

    return f"file is created with name {filename}"

@mcp.tool()
def create_folder(foldername: str) -> str:
    """Create a new folder, optionally nested inside another folder. Fails if it already exists."""
    path = safe_path(foldername)

    if os.path.exists(path):
        return f"Folder {foldername} already exists in the directory."

    os.mkdir(path)

    return f"Folder {foldername} created successfully."

if __name__ == "__main__":
    mcp.run(transport="stdio")