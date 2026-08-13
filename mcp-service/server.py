import os
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Server_Flow")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@mcp.tool()
def hello(name: str) -> str:
    """Greet a person by name."""
    return f"hello, {name}"

@mcp.tool()
def read_file(filename: str) -> str:
    """Read and return the contents of a text file in the server's directory."""
    # print("read file called")
    path = os.path.join(BASE_DIR, os.path.basename(filename))
    with open(path, "r") as f:
        return f.read()

@mcp.tool()
def write_file(filename: str, content: str) -> str:
    """Write text content to a file in the server's directory. Overwrites if it already exists."""
    # print("write tool is called.")
    path = os.path.join(BASE_DIR, os.path.basename(filename))
    with open(path, "w") as f:
        f.write(content)
    return f"data inserted in {filename} successfully"

@mcp.tool()
def create_file(filename , content: str)->str:
    """Create a file if not exist and write content which the user ask for ."""
    path = os.path.join(BASE_DIR , os.path.basename(filename))

    if os.path.exists(path):
        return f"File exists {filename} in this directory."

    with open(path , "w") as f:
        f.write(content)

    return f"file is created with name {filename}"    
    


if __name__ == "__main__":
    mcp.run(transport="stdio")