Docker 部署自定义 MCP 服务实验

========================
一、实验目的
========================

使用 Dockerfile 和 Docker Compose 部署自定义 MCP（Model Context Protocol）服务，
并通过 FastMCP 框架实现工具注册与服务发布。

本实验实现了一个自定义 MCP Server，提供以下工具：

1. add(a,b)
   计算两个整数之和

2. multiply(a,b)
   计算两个整数乘积

3. system_info()
   返回服务器系统信息

最终通过 Docker 容器运行 MCP 服务，并以 Streamable HTTP 方式对外提供服务。


========================
二、实验环境
========================

操作系统：
Windows 11

容器平台：
Docker Desktop

编程语言：
Python 3.12

MCP框架：
FastMCP 3.4.2

部署方式：
Dockerfile
Docker Compose


========================
三、项目结构
========================

mcp-homework
│
├── server.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.txt


========================
四、关键代码说明
========================

server.py

实现自定义 MCP 服务：

- add()
- multiply()
- system_info()

使用 FastMCP 创建 MCP Server：

mcp = FastMCP("LinuxHomeworkMCP")

采用 Streamable HTTP 方式运行：

mcp.run(
    transport="streamable-http",
    host="0.0.0.0",
    port=8000
)


========================
五、Dockerfile
========================

FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

CMD ["python", "server.py"]


========================
六、docker-compose.yml
========================

services:
  mcp:
    build: .
    container_name: my-mcp-server

    ports:
      - "8000:8000"

    restart: unless-stopped


========================
七、实验步骤
========================

1. 编写 server.py

实现 MCP Server 和自定义工具。

2. 编写 requirements.txt

安装 FastMCP。

3. 编写 Dockerfile

构建 Python 运行环境。

4. 编写 docker-compose.yml

实现容器编排。

5. 构建镜像

docker compose build

6. 启动容器

docker compose up -d

7. 查看容器状态

docker ps

8. 查看服务日志

docker logs my-mcp-server

9. 验证 MCP 服务

curl http://localhost:8000/mcp


========================
八、实验结果
========================

Docker 容器成功运行：

my-mcp-server

MCP 服务成功启动：

LinuxHomeworkMCP

服务地址：

http://localhost:8000/mcp

日志显示：

Starting MCP server
with transport 'streamable-http'

Uvicorn running on
http://0.0.0.0:8000

使用 curl 访问：

curl http://localhost:8000/mcp

返回：

Client must accept text/event-stream

说明 MCP 服务已正常运行并等待标准 MCP 客户端连接。


========================
九、实验总结
========================

本实验利用 Docker 和 Docker Compose 完成了自定义 MCP 服务的容器化部署，
通过 FastMCP 框架实现了工具注册与服务发布。

实验过程中掌握了：

1. Dockerfile 镜像构建
2. Docker Compose 容器编排
3. FastMCP 服务开发
4. Streamable HTTP MCP 服务部署
5. MCP 服务验证与调试

最终成功实现了基于 Docker 的自定义 MCP 服务部署。