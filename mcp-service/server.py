from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Server_Flow")

@mcp.tool()
def hello(name:str)->str:
    print("hello , {name}")

if __name__ == "__main__":
    print("server is running")
    mcp.run()