from fastmcp import FastMCP
import platform

mcp = FastMCP("LinuxHomeworkMCP")

@mcp.tool()
def add(a: int, b: int) -> int:
    return a + b

@mcp.tool()
def multiply(a: int, b: int) -> int:
    return a * b

@mcp.tool()
def system_info() -> str:
    return f"System: {platform.system()} {platform.release()}"

if __name__ == "__main__":
    mcp.run(
        transport="streamable-http",
        host="0.0.0.0",
        port=8000
    )