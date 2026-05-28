from fastmcp import FastMCP
from fastapi import HTTPException

mcp = FastMCP("AuthDemo")

SECRET_TOKEN = "my_secret_token_123"


@mcp.tool()
def get_token() -> str:
    """
    获取 token
    """
    return SECRET_TOKEN


@mcp.tool()
def add(a: int, b: int, token: str) -> int:
    """
    需要 token 鉴权
    """

    if token != SECRET_TOKEN:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: invalid token"
        )

    return a + b


if __name__ == "__main__":
    print("MCP Server Running...")
    print("SSE URL: http://127.0.0.1:8000/sse")

    mcp.run(
        transport="sse",
        host="127.0.0.1",
        port=8000
    )