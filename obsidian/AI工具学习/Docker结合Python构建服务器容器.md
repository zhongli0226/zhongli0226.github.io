# 前言
最近在使用一些 MCP 制作工具的时候，需要设计一些 python 创建的服务器用于本地大模型来调用接口，若直接用用 python 启动服务的话，并不方便管理，但最近使用 docker 部署一些服务的时候发现 docker 管理这些服务独立且可便于观察各个服务的状态。于是就有突发奇想，用 python 编译的服务是否也可以用 docker 来管理。最近刚好在 GitHub 上找到一个简单实例，这里拿来学习使用一下。

参考链接：[kangarooking/fastgpt-dify-adapter: dify外接fastgpt知识库的工具](https://github.com/kangarooking/fastgpt-dify-adapter)
# Docker 介绍
Docker 是一个工具和平台，允许开发者将应用程序及其所有依赖（如库、系统工具、代码等）打包到一个**轻量级容器**中。这个容器可以在任何支持 Docker 的环境中运行，无需担心环境差异导致的问题。
## 基本概念

### **（1）镜像（Image）**
- **定义**：Docker 镜像是一个**静态模板**，包含运行应用所需的所有文件、依赖和配置。
 - **特点**：
 - 由 Dockerfile 构建而成。
 - 例如：`python:3.10-slim` 是一个 Python 3.10 的基础镜像。
 - **作用**：镜像是容器的“蓝图”，容器是镜像的运行实例。
### **（2）容器（Container）**
- **定义**：容器是镜像的**运行实例**，是一个独立的、可执行的进程。
 - **特点**：
 - 容器是轻量级的，启动速度快（秒级）。
 - 每个容器相互隔离，互不影响。
 - **作用**：运行应用，例如启动一个 Web 服务。
### **（3）Dockerfile**
- **定义**：一个文本文件，包含一系列指令，用于**构建镜像**。
 - **示例**：
 ```dockerfile
 FROM python:3.10-slim
 WORKDIR /app
 COPY requirements.txt .
 RUN pip install -r requirements.txt
 COPY . .
 CMD ["python", "app.py"]
 ```
 - **作用**：自动化构建镜像，确保环境一致性。
### **（4）Docker Hub**
- **定义**：Docker 的**公共仓库**，存储和分享镜像。
 - **特点**：
 - 提供官方镜像（如 `nginx`、`mysql`）。
 - 支持私有镜像仓库。
 - **作用**：开发者可以拉取他人镜像或上传自己的镜像。
## 常见命令
| 命令 | 说明 |
 | -------------------------- | ------------------ |
 | `docker images` | 列出本地所有镜像 |
 | `docker ps` | 列出正在运行的容器 |
 | `docker ps -a` | 列出所有容器（包括已停止的） |
 | `docker build -t <name> .` | 根据 Dockerfile 构建镜像 |
 | `docker run <image>` | 运行一个容器 |
 | `docker stop <container>` | 停止指定容器 |
 | `docker rm <container>` | 删除指定容器 |
 
# 项目分析

项目十分简单主要包含一下文件：
 - `app.py`
 - `docker-compose.yml`
 - `docker-compose-aliyun.yml`
 - `Dockerfile`
 - `README.md`
 - `requirements.txt`
 Python 源代码是 `app.py` ，`requirements.txt` 为该 Python 代码所项目依赖的 Python 包列表。Dockerfile 主要用于构建本地镜像，`docker-compose.yml` 用来启动 docker 服务 `docker-compose-aliyun.yml` 是使用云端镜像进行部署。
## 如何构建本地镜像
分析一下 `Dockerfile` 文件，文件主要内容如下:
 ```dockerfile
 FROM python:3.10-slim
 WORKDIR /app
 COPY requirements.txt .
 RUN pip install --no-cache-dir -r requirements.txt
 COPY . .
 EXPOSE 5000
 CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--access-logfile", "-", "--error-logfile", "-", "app:app"]
 ```
### 1. `FROM python:3.10-slim`
- **作用**：指定基础镜像。
 - **解释**：
 - `python:3.10-slim` 是一个轻量级的 Python 3.10 镜像（`slim` 表示精简版，去除了部分开发工具和依赖，体积更小）。
 - 所有后续指令都基于这个基础镜像构建。
### 2. `WORKDIR /app`
- **作用**：设置工作目录。
 - **解释**：
 - 将容器内的工作目录设置为 `/app`。
 - 后续的 `COPY`、`RUN` 等指令都会基于此路径执行（例如 `COPY requirements.txt .` 会将文件复制到 `/app` 目录下）。
### 3. `COPY requirements.txt .`
- **作用**：复制文件到容器中。
 - **解释**：
 - 将本地的 `requirements.txt` 文件复制到容器的当前工作目录（即 `/app`）。
 - `requirements.txt` 通常包含项目依赖的 Python 包列表（如 `flask`、`gunicorn` 等）。
### 4. `RUN pip install --no-cache-dir -r requirements.txt`
- **作用**：安装依赖。
 - **解释**：
 - `RUN` 指令在镜像构建阶段执行命令。
 - `pip install` 安装 `requirements.txt` 中列出的所有依赖。
 - `--no-cache-dir` 禁用 pip 缓存，减少镜像体积。
 - `-r requirements.txt` 表示从文件中读取依赖列表。
### 5. `COPY . .`
- **作用**：复制当前目录下的所有文件到容器中。
 - **解释**：
 - 将本地当前目录（Dockerfile 所在目录）下的所有文件和子目录复制到容器的 `/app` 目录。
 - 注意：这会包含项目源代码、配置文件等（需确保 `.dockerignore` 文件排除不必要的内容，如 `.git`、`__pycache__` 等）。
### 6. `EXPOSE 5000`
- **作用**：声明容器运行时监听的端口。
 - **解释**：
 - 告诉 Docker 容器在运行时会使用 `5000` 端口（例如 Web 服务的端口）。
 - **注意**：`EXPOSE` 只是文档作用，实际运行时需通过 `docker run -p 5000:5000` 映射端口。
### 7. `CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--access-logfile", "-", "--error-logfile", "-", "app:app"]`
- **作用**：指定容器启动时默认执行的命令。
 - **解释**：
 - 使用 `gunicorn`（一个 WSGI 服务器）启动 Python Web 应用。
 - 参数说明：
 - `--bind 0.0.0.0:5000`：将服务绑定到所有网络接口的 `5000` 端口（允许外部访问）。
 - `--access-logfile "-"`：将访问日志输出到标准输出（便于 Docker 日志系统捕获）。
 - `--error-logfile "-"`：将错误日志输出到标准输出。
 - `app:app`：指定 WSGI 应用入口（`app` 是 Python 模块名，`app` 是应用实例名，例如 `app.py` 中的 `app = Flask(__name__)`）。
## 建立 docker 服务
建立 docker 的服务虽然可以通过 docker 的命令直接开启一个服务，但是有时开启 docker 需要伴随一些环境变量，还有部分 docker 的设置，所以就个人而言，我更倾向于利用 docker-compose 来开启服务。Docker Compose 是一个用于**定义和运行多容器 Docker 应用**的工具。它通过一个 YAML 文件（`docker-compose.yml`）来配置服务、网络、卷等，简化了多容器应用的管理。
```yaml
version: '3'
services:
 fastgpt-dify-adapter:
 build: .
 ports:
 - "5000:5000"
 environment:
 - FASTGPT_BASE_URL=http://host.docker.internal:3000
 # 问题优化配置
 - DATASET_SEARCH_USING_EXTENSION=true
 - DATASET_SEARCH_EXTENSION_MODEL=Deepseek-chat
 - DATASET_SEARCH_EXTENSION_BG=
 # 重排序配置
 - DATASET_SEARCH_USING_RERANK=true
 restart: unless-stopped
 ```
 `build: .` 就可以一键将该路径下的 docker 打包完成并部署。
部署完成后就可以在 docker 界面中看到了。
