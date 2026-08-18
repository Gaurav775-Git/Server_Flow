import os
import json
import shutil
import hashlib
from datetime import datetime
from pathlib import Path
from mcp.server.fastmcp import FastMCP
import re

mcp = FastMCP("Server_Flow")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.join(BASE_DIR, "user_project")
os.makedirs(PROJECT_DIR, exist_ok=True)

def safe_path(relative_path: str) -> str:
    """Resolve a path safely inside PROJECT_DIR."""
    full_path = os.path.abspath(os.path.join(PROJECT_DIR, relative_path))
    if not full_path.startswith(PROJECT_DIR):
        raise ValueError("Access outside the project directory is not permitted.")
    return full_path

def format_size(size_bytes: int) -> str:
    """Convert bytes to human-readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"

# ======================== EXISTING TOOLS ========================

@mcp.tool()
def jsonDataResolver(data: str) -> str:
    """If the data is in JSON format, convert it into readable indented plain text."""
    try:
        parsed = json.loads(data)
        return json.dumps(parsed, indent=2)
    except (json.JSONDecodeError, TypeError):
        return data

@mcp.tool()
def hello(name: str) -> str:
    """Greet a person by name."""
    return f"hello, {name}"

@mcp.tool()
def read_file(filename: str) -> str:
    """Read and return the contents of a text file."""
    path = safe_path(filename)
    with open(path, "r") as f:
        return f.read()

@mcp.tool()
def write_file(filename: str, content: str) -> str:
    """Write text content to a file. Overwrites if it already exists."""
    path = safe_path(filename)
    with open(path, "w") as f:
        f.write(content)
    return f"Data inserted in {filename} successfully"

@mcp.tool()
def create_file(filename: str, content: str) -> str:
    """Create a file if it doesn't exist, and write content into it."""
    path = safe_path(filename)
    if os.path.exists(path):
        return f"File {filename} already exists."
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
    return f"File created: {filename}"

@mcp.tool()
def create_folder(foldername: str) -> str:
    """Create a new folder. Fails if it already exists."""
    path = safe_path(foldername)
    if os.path.exists(path):
        return f"Folder {foldername} already exists."
    os.mkdir(path)
    return f"Folder {foldername} created successfully."

# ======================== NEW TOOLS ========================

@mcp.tool()
def list_files(directory: str = "") -> str:
    """List all files and folders inside a directory."""
    try:
        path = safe_path(directory)
        items = os.listdir(path)
        result = []
        for item in sorted(items):
            item_path = os.path.join(path, item)
            if os.path.isdir(item_path):
                result.append(f"📁 {item}/")
            else:
                size = os.path.getsize(item_path)
                result.append(f"📄 {item} ({format_size(size)})")
        return "\n".join(result) if result else "Directory is empty."
    except FileNotFoundError:
        return f"Directory '{directory}' not found."
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.tool()
def delete_file(filename: str, permanent: bool = False) -> str:
    """Delete a file. Moves to trash by default, permanently if permanent=True."""
    try:
        path = safe_path(filename)
        if not os.path.exists(path):
            return f"File {filename} does not exist."
        if os.path.isdir(path):
            return f"{filename} is a directory. Use delete_folder instead."
        os.remove(path)
        return f"File {filename} deleted{' permanently' if permanent else ''}."
    except Exception as e:
        return f"Error deleting file: {str(e)}"

@mcp.tool()
def delete_folder(foldername: str, recursive: bool = False) -> str:
    """Delete a folder (only if empty, unless recursive=True)."""
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
        return f"Error: {str(e)}. Folder may not be empty. Use recursive=True."

@mcp.tool()
def move_file(source: str, destination: str) -> str:
    """Move or rename a file or folder from source to destination."""
    try:
        src_path = safe_path(source)
        dst_path = safe_path(destination)
        if not os.path.exists(src_path):
            return f"Source {source} does not exist."
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        shutil.move(src_path, dst_path)
        return f"Moved/renamed {source} → {destination}"
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.tool()
def copy_file(source: str, destination: str) -> str:
    """Copy a file from source to destination."""
    try:
        src_path = safe_path(source)
        dst_path = safe_path(destination)
        if not os.path.exists(src_path):
            return f"Source {source} does not exist."
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        shutil.copy2(src_path, dst_path)
        return f"Copied {source} → {destination}"
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.tool()
def file_info(path: str) -> str:
    """Get detailed information about a file or folder."""
    try:
        full_path = safe_path(path)
        if not os.path.exists(full_path):
            return f"Path {path} does not exist."
        
        info = {
            "name": os.path.basename(full_path),
            "type": "Directory" if os.path.isdir(full_path) else "File",
            "size": format_size(os.path.getsize(full_path)) if os.path.isfile(full_path) else "N/A",
            "created": datetime.fromtimestamp(os.path.getctime(full_path)).strftime("%Y-%m-%d %H:%M:%S"),
            "modified": datetime.fromtimestamp(os.path.getmtime(full_path)).strftime("%Y-%m-%d %H:%M:%S"),
            "accessed": datetime.fromtimestamp(os.path.getatime(full_path)).strftime("%Y-%m-%d %H:%M:%S"),
            "path": full_path
        }
        if os.path.isdir(full_path):
            items = os.listdir(full_path)
            info["items"] = len(items)
            info["subfolders"] = sum(1 for i in items if os.path.isdir(os.path.join(full_path, i)))
            info["files"] = sum(1 for i in items if os.path.isfile(os.path.join(full_path, i)))
        
        return json.dumps(info, indent=2)
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.tool()
def read_json(filename: str) -> str:
    """Read a JSON file and return its content as a Python dictionary (pretty formatted)."""
    try:
        path = safe_path(filename)
        with open(path, "r") as f:
            data = json.load(f)
        return json.dumps(data, indent=2)
    except FileNotFoundError:
        return f"File {filename} not found."
    except json.JSONDecodeError as e:
        return f"Invalid JSON: {str(e)}"
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.tool()
def write_json(filename: str, data: dict) -> str:
    """Write a dictionary to a JSON file (pretty formatted, overwrites if exists)."""
    try:
        path = safe_path(filename)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
        return f"JSON written to {filename}"
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.tool()
def update_json(filename: str, updates: dict) -> str:
    """Update specific fields in a JSON file (merge with existing data)."""
    try:
        path = safe_path(filename)
        if not os.path.exists(path):
            return f"File {filename} does not exist."
        
        with open(path, "r") as f:
            data = json.load(f)
        
        # Deep merge
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
        return f"Error: {str(e)}"

@mcp.tool()
def search_in_file(filename: str, pattern: str, case_sensitive: bool = False) -> str:
    """Search for a pattern (regex) in a file and return matching lines with line numbers."""
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
        return f"Error: {str(e)}"

@mcp.tool()
def find_in_files(directory: str, pattern: str, file_pattern: str = "*") -> str:
    """Search for a pattern in all files matching a pattern inside a directory."""
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
        return f"Error: {str(e)}"

@mcp.tool()
def get_file_hash(filename: str, algorithm: str = "sha256") -> str:
    """Get the hash (SHA256 or MD5) of a file to verify its integrity."""
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
        return f"Error: {str(e)}"

@mcp.tool()
def count_files(directory: str, recursive: bool = False) -> str:
    """Count files and folders in a directory (optionally recursive)."""
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
        
        return f"📊 {directory}:\n📁 Folders: {total_folders}\n📄 Files: {total_files}\n📦 Total items: {total_files + total_folders}"
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.tool()
def get_folder_size(directory: str) -> str:
    """Calculate the total size of a folder (human-readable format)."""
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
        return f"Error: {str(e)}"

@mcp.tool()
def read_file_range(filename: str, start_line: int, end_line: int) -> str:
    """Read a specific range of lines from a file (1-indexed)."""
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
        return f"Error: {str(e)}"

@mcp.tool()
def append_to_file(filename: str, content: str) -> str:
    """Append content to the end of a file (creates file if it doesn't exist)."""
    try:
        path = safe_path(filename)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "a") as f:
            f.write(content)
            if not content.endswith("\n"):
                f.write("\n")
        return f"Appended to {filename}"
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.tool()
def prepend_to_file(filename: str, content: str) -> str:
    """Prepend content to the beginning of a file."""
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
        return f"Error: {str(e)}"

@mcp.tool()
def get_file_extension(filename: str) -> str:
    """Get the file extension from a filename."""
    try:
        path = safe_path(filename)
        _, ext = os.path.splitext(path)
        return ext if ext else "No extension"
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.tool()
def change_file_extension(filename: str, new_extension: str) -> str:
    """Change the extension of a file."""
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
        return f"Extension changed: {filename} → {relative_new}"
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    mcp.run(transport="stdio")