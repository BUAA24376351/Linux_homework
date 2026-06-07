使用 Dockerfile 和 Docker Compose 部署 Ollama 运行 Qwen3:0.6B 模型实验报告
实验环境
Windows 11、Docker Desktop、Docker Compose、Ollama、Cherry Studio


实验目的
使用 Dockerfile 和 Docker Compose 部署 Ollama 容器，在容器内运行 Qwen3:0.6B 模型，并通过 Cherry Studio 调用本地 API 服务。

一、项目文件
Dockerfile

FROM ollama/ollama:latest

EXPOSE 11434

CMD ["serve"]

docker-compose.yml

services:
  ollama:
    build: .
    container_name: ollama-qwen
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

volumes:
  ollama_data:

二、实验过程
1. 安装并启动 Docker Desktop，验证 Docker 环境可用（docker run hello-world）。
2. 创建项目目录，编写 Dockerfile 和 docker-compose.yml。
3. 执行 docker compose build 构建镜像。
4. 首次构建过程中自动下载 ollama/ollama 基础镜像。
5. 修正 Dockerfile 启动命令，将 CMD ["ollama", "serve"] 修改为 CMD ["serve"]。
6. 执行 docker compose up -d 启动容器。
7. 通过 docker ps 验证容器 ollama-qwen 正常运行。
8. 进入容器执行 ollama pull qwen3:0.6b 下载模型。
9. 使用 ollama run qwen3:0.6b 测试模型运行。
10. 通过 curl http://localhost:11434/api/tags 验证 API 服务。
11. 在 Cherry Studio 中添加 Ollama 服务并成功识别 qwen3:0.6b 模型。
三、关键验证结果
1. Docker 容器状态正常：
docker ps 显示 ollama-qwen 处于 Up 状态。

2. 模型下载成功：
qwen3:0.6b 已成功安装至 Ollama。

3. API 测试成功：
访问 http://localhost:11434/api/tags 返回模型列表，其中包含 qwen3:0.6b。

4. Cherry Studio 成功调用模型：
成功读取并使用 qwen3:0.6b 进行对话。

四、实验总结
本实验采用 Dockerfile 构建基于 Ollama 的镜像，并使用 Docker Compose 完成容器编排与部署。在容器中成功部署并运行 Qwen3:0.6B 大语言模型，通过开放的 API 接口实现与 Cherry Studio 的连接和调用。实验过程中掌握了 Docker 镜像构建、容器管理、模型部署以及本地 AI 服务调用等关键技术。