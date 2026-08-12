import os
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Server_Flow")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@mcp.tool()
def hello(name:str)->str:
    print("hello , {name}")

@mcp.tool()
def read_file(filename:str)->str:
    path = os.path.join(BASE_DIR,os.path.basename(filename))
    with open (path ,"r") as f:
        return f.read()


if __name__ == "__main__":
    print("server is running")
    mcp.run()