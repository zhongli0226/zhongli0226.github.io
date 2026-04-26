---
title: Linux自启动
created: 2026-04-26
description: 记录 Linux 下使用 systemd 配置服务自启动的完整流程，包括 Unit 文件编写、systemctl 常用命令、用户级与系统级服务区别、日志查看和嵌入式 Linux 自启动方式对比。
tags:
  - 嵌入式Linux
  - Linux
  - systemd
  - 自启动
  - 服务管理
---

# 前言

最近在部署 AI 相关模型或 Web 应用时，经常会遇到一个很现实的问题：电脑或服务器重启后，原来手动启动的服务也跟着关闭了。虽然之前记录过启动命令，但每次重启后都要重新进入目录、激活环境、输入命令，时间久了还是比较麻烦。

所以这篇文章主要记录 Linux 下服务自启动的管理方式，重点介绍 Ubuntu 中常用的 `systemd`。它不仅可以实现开机自动启动，还可以统一管理服务状态、自动重启异常退出的程序、查看日志，非常适合用来托管模型服务、Python Web 服务、后台脚本等长期运行的程序。

# 自启动服务介绍

在 Ubuntu 等现代 Linux 发行版中，系统服务通常由 `systemd` 管理。它的核心特点包括：

- 启动速度快
- 统一管理服务
- 支持服务依赖关系
- 支持异常后自动重启
- 自带日志系统
- 可以管理服务、挂载点、定时器、设备、用户会话等多种对象

早期很多 Linux 系统使用的是 `init` 或 `SysVinit`，启动脚本通常放在：

```bash
/etc/init.d/
```

在一些嵌入式 Linux、BusyBox、Buildroot 系统中，现在仍然能看到这类脚本方式。而在 Ubuntu、Debian、CentOS 7 以后这类系统中，更常见的方式是使用 `systemd`。

在 `systemd` 中，被管理的对象统一称为 **Unit**，也就是“单元”。服务只是 Unit 的一种类型。

# 常见 Unit 类型

| 类型 | 后缀 | 说明 |
| --- | --- | --- |
| Service | `.service` | 最常用，用于管理一个后台服务或程序 |
| Target | `.target` | 一组 Unit 的集合，类似系统运行阶段 |
| Timer | `.timer` | 定时触发任务，可替代部分 `cron` 场景 |
| Mount | `.mount` | 管理文件系统挂载点 |
| Socket | `.socket` | 管理 socket 激活服务 |
| Path | `.path` | 监听文件或目录变化后触发服务 |

平时做自启动时，最常用的是 `.service` 文件。

# systemd 的工作思路

使用 `systemd` 管理服务，一般可以理解成下面几个步骤：

1. 编写一个 Unit 文件，描述服务怎么启动、在哪个目录运行、失败后如何处理。
2. 让 systemd 重新读取配置。
3. 使用 `systemctl` 启动、停止、查看服务。
4. 使用 `enable` 设置开机自启动。

例如创建一个系统级服务：

```bash
sudo vim /etc/systemd/system/demo.service
```

写入服务配置后，重新加载 systemd 配置：

```bash
sudo systemctl daemon-reload
```

启动服务：

```bash
sudo systemctl start demo.service
```

设置开机自启动：

```bash
sudo systemctl enable demo.service
```

如果想立即启动并设置自启动，也可以合并为一条命令：

```bash
sudo systemctl enable --now demo.service
```

# systemd 的几个重要概念

## Unit

Unit 是 `systemd` 管理的基本对象。一个 `.service` 文件就是一个 Unit 文件，它告诉 systemd：

- 这个服务叫什么
- 什么时候启动
- 启动命令是什么
- 工作目录在哪里
- 是否失败后自动重启
- 日志如何处理

## Dependency 依赖关系

依赖关系用于描述服务之间的启动顺序和关联关系。常见字段有：

| 字段 | 说明 |
| --- | --- |
| `After=` | 表示当前服务在某个 Unit 之后启动，只控制顺序 |
| `Before=` | 表示当前服务在某个 Unit 之前启动 |
| `Wants=` | 表示希望同时启动某个 Unit，但对方失败不影响当前服务 |
| `Requires=` | 表示强依赖某个 Unit，对方失败会影响当前服务 |

例如网络服务一般会写：

```ini
After=network-online.target
Wants=network-online.target
```

`After=` 只表示顺序，不代表它会主动拉起网络；`Wants=` 才表示希望把对应目标一起拉起。

## Target

Target 可以理解为一组服务的集合，用来表示系统启动到某个阶段。

常见的 Target 有：

| Target | 说明 |
| --- | --- |
| `multi-user.target` | 多用户命令行环境，适合大多数后台服务 |
| `graphical.target` | 图形界面环境 |
| `network.target` | 基础网络已启动 |
| `network-online.target` | 网络已经尽量达到可用状态 |
| `default.target` | 当前系统默认启动目标 |

在系统级服务中，常见写法是：

```ini
WantedBy=multi-user.target
```

用户级服务中，常见写法是：

```ini
WantedBy=default.target
```

## Journal 日志

`systemd` 自带日志系统 `journald`。服务输出到标准输出或标准错误的内容，可以通过 `journalctl` 查看。

查看某个服务日志：

```bash
journalctl -u demo.service
```

实时跟踪日志：

```bash
journalctl -u demo.service -f
```

查看本次启动后的日志：

```bash
journalctl -u demo.service -b
```

# 常用 systemctl 命令

| 命令 | 说明 |
| --- | --- |
| `systemctl start demo.service` | 启动服务 |
| `systemctl stop demo.service` | 停止服务 |
| `systemctl restart demo.service` | 重启服务 |
| `systemctl reload demo.service` | 重新加载服务配置，前提是服务支持 reload |
| `systemctl status demo.service` | 查看服务状态 |
| `systemctl enable demo.service` | 设置开机自启动 |
| `systemctl disable demo.service` | 取消开机自启动 |
| `systemctl enable --now demo.service` | 设置自启动并立即启动 |
| `systemctl is-enabled demo.service` | 查看是否已设置自启动 |
| `systemctl daemon-reload` | 重新加载 Unit 文件 |
| `systemctl list-units --type=service` | 查看当前加载的服务 |
| `systemctl list-unit-files --type=service` | 查看所有服务文件及启用状态 |

> [!NOTE]
> 修改 `.service` 文件后，一定要执行 `systemctl daemon-reload`，否则 systemd 可能仍然使用旧配置。

# Service 文件结构

一个典型的 `.service` 文件主要由三部分组成：

```ini
[Unit]
Description=服务说明
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/path/to/project
ExecStart=/path/to/program --option value
Restart=on-failure
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

## Unit 段

`[Unit]` 主要描述服务的基本信息和依赖关系。

```ini
[Unit]
Description=llama.cpp server
After=network-online.target
Wants=network-online.target
```

- `Description`：服务说明，方便在 `systemctl status` 中识别。
- `After`：指定启动顺序。
- `Wants`：指定希望一起启动的依赖目标。

## Service 段

`[Service]` 是服务的核心配置。

| 字段 | 说明 |
| --- | --- |
| `Type=simple` | 默认类型，启动命令运行后即认为服务已启动 |
| `WorkingDirectory` | 服务运行目录 |
| `ExecStart` | 服务启动命令 |
| `Environment` | 设置环境变量 |
| `Restart` | 退出后的重启策略 |
| `RestartSec` | 重启前等待时间 |
| `User` | 指定服务以哪个用户运行 |
| `Group` | 指定服务以哪个用户组运行 |
| `StandardOutput` | 标准输出处理方式 |
| `StandardError` | 标准错误处理方式 |
| `LimitNOFILE` | 文件句柄数量限制 |

常见的 `Restart` 策略：

| 策略 | 说明 |
| --- | --- |
| `no` | 不自动重启，默认值 |
| `always` | 无论如何退出都重启 |
| `on-failure` | 只有异常失败时重启 |
| `on-abnormal` | 信号、中断、超时等异常情况重启 |

对于模型服务和 Web 服务，一般可以使用：

```ini
Restart=on-failure
RestartSec=5
```

如果是必须长期运行的守护服务，可以使用：

```ini
Restart=always
RestartSec=3
```

## Install 段

`[Install]` 用于描述 `enable` 时服务挂载到哪个 Target 下。

系统级服务常用：

```ini
[Install]
WantedBy=multi-user.target
```

用户级服务常用：

```ini
[Install]
WantedBy=default.target
```

# 系统级 systemd 和用户级 systemd

`systemd` 服务可以分成系统级和用户级两类。

## 系统级服务

系统级 Unit 文件一般放在：

```bash
/etc/systemd/system/
```

管理命令需要加 `sudo`：

```bash
sudo systemctl start demo.service
sudo systemctl enable demo.service
```

适合场景：

- 系统启动后必须启动的服务
- 所有用户都可能使用的服务
- 需要绑定系统端口或访问系统资源的服务
- 需要 root 权限管理的服务

## 用户级服务

用户级 Unit 文件一般放在：

```bash
~/.config/systemd/user/
```

管理命令使用 `--user`：

```bash
systemctl --user start demo.service
systemctl --user enable demo.service
```

适合场景：

- 某个用户自己的程序
- 不想使用 root 管理
- 自己的模型服务、脚本、Web UI
- 依赖当前用户 conda、Python、Node 环境的服务

如果希望用户级服务在系统启动后、不登录桌面也能运行，需要开启 linger：

```bash
sudo loginctl enable-linger 用户名
```

例如：

```bash
sudo loginctl enable-linger tangwc
```

> [!NOTE]
> 如果没有开启 linger，用户级服务通常会依赖用户会话。也就是说，用户退出登录后，服务可能会被一起停止。

# 示例一：llama.cpp 服务

下面以 `llama.cpp` 的 `llama-server` 为例，创建一个系统级服务。

创建服务文件：

```bash
sudo vim /etc/systemd/system/llama-server.service
```

写入以下内容：

```ini
[Unit]
Description=llama.cpp server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/home/hupingbo/llama.cpp
ExecStart=/home/hupingbo/llama.cpp/build/bin/llama-server -m /home/hupingbo/Models/Qwen3.5-35B-A3B-Q4_K_M.gguf --alias qwen3.5-35b-a3b --host 0.0.0.0 --port 11434 --ctx-size 262144 --cache-type-k q8_0 --cache-type-v q8_0 --chat-template-kwargs '{"enable_thinking": false}'
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

加载并启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now llama-server.service
```

查看状态：

```bash
sudo systemctl status llama-server.service
```

查看日志：

```bash
journalctl -u llama-server.service -f
```

# 示例二：Python Web UI 服务

如果程序依赖 conda 环境，建议在 `ExecStart` 中直接使用虚拟环境里的 Python 绝对路径，而不是先 `conda activate`。

创建用户级服务目录：

```bash
mkdir -p ~/.config/systemd/user
```

创建服务文件：

```bash
vim ~/.config/systemd/user/wework-web.service
```

写入以下内容：

```ini
[Unit]
Description=WeWork Web UI Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/home/hupingbo/tangwc/WeWork_SDK
ExecStart=/home/hupingbo/miniconda3/envs/wework-web/bin/python /home/hupingbo/tangwc/WeWork_SDK/web/app.py
Environment=PYTHONUNBUFFERED=1
Environment=PATH=/home/hupingbo/miniconda3/envs/wework-web/bin:/home/hupingbo/miniconda3/bin:/usr/local/bin:/usr/bin:/bin
Environment=LD_LIBRARY_PATH=/home/hupingbo/tangwc/WeWork_SDK/lib:/usr/local/lib:/usr/lib
Restart=always
RestartSec=3
LimitNOFILE=65535
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
```

启动用户级服务：

```bash
systemctl --user daemon-reload
systemctl --user enable --now wework-web.service
```

查看状态：

```bash
systemctl --user status wework-web.service
```

查看日志：

```bash
journalctl --user -u wework-web.service -f
```

如果希望它开机后自动运行，并且不依赖用户登录：

```bash
sudo loginctl enable-linger hupingbo
```

# 示例三：vLLM 服务

模型服务通常启动命令比较长，可以使用反斜杠换行，让配置文件更易读。

创建用户级服务文件：

```bash
vim ~/.config/systemd/user/vllm-qwen35.service
```

写入以下内容：

```ini
[Unit]
Description=vLLM Qwen3.5 Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/home/hupingbo
Environment=PATH=/home/hupingbo/miniconda3/envs/vllm/bin:/usr/local/cuda/bin:/usr/local/bin:/usr/bin:/bin
Environment=PYTHONUNBUFFERED=1
ExecStart=/home/hupingbo/miniconda3/envs/vllm/bin/vllm serve /home/hupingbo/Models/Qwen3.5-27B-FP8 \
  --served-model-name qwen3.5-27b \
  --host 0.0.0.0 \
  --port 11434 \
  --tensor-parallel-size 2 \
  --max-model-len 262144 \
  --kv-cache-dtype fp8 \
  --max-num-seqs 3 \
  --max-num-batched-tokens 4096 \
  --gpu-memory-utilization 0.92 \
  --enable-auto-tool-choice \
  --tool-call-parser qwen3_coder \
  --reasoning-parser qwen3 \
  --default-chat-template-kwargs '{"enable_thinking": false}'
Restart=on-failure
RestartSec=10
LimitNOFILE=1048576
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
```

启动服务：

```bash
systemctl --user daemon-reload
systemctl --user enable --now vllm-qwen35.service
```

查看 GPU 和服务状态：

```bash
nvidia-smi
systemctl --user status vllm-qwen35.service
```

# 脚本启动方式

有时启动命令比较复杂，例如需要设置很多环境变量、创建日志目录、执行多条命令。此时可以把复杂逻辑放进脚本，再让 systemd 调用脚本。

创建启动脚本：

```bash
vim /home/hupingbo/start_demo.sh
```

示例内容：

```bash
#!/bin/bash
set -e

cd /home/hupingbo/demo
export PYTHONUNBUFFERED=1
/home/hupingbo/miniconda3/envs/demo/bin/python app.py
```

增加可执行权限：

```bash
chmod +x /home/hupingbo/start_demo.sh
```

service 文件中使用：

```ini
[Service]
Type=simple
ExecStart=/home/hupingbo/start_demo.sh
Restart=on-failure
RestartSec=5
```

> [!NOTE]
> `ExecStart` 默认不会像普通 shell 那样解析复杂命令。如果需要使用管道、重定向、`source`、`&&` 等 shell 语法，可以写进脚本，或者使用 `/bin/bash -lc '命令'`。

# 常见问题排查

## 修改服务文件后没有生效

修改 `.service` 文件后，需要重新加载：

```bash
sudo systemctl daemon-reload
```

用户级服务则使用：

```bash
systemctl --user daemon-reload
```

然后再重启服务：

```bash
sudo systemctl restart demo.service
```

或：

```bash
systemctl --user restart demo.service
```

## 手动启动正常，systemd 启动失败

这种情况通常是环境变量不同导致的。可以重点检查：

- 是否使用了绝对路径
- `WorkingDirectory` 是否正确
- Python、conda、node、cuda 等路径是否加入 `Environment=PATH=...`
- 服务运行用户是否有文件访问权限
- 是否依赖当前终端中的临时环境变量

systemd 中最好少依赖“当前终端环境”，尽量把路径写清楚。

## 查看失败原因

查看服务状态：

```bash
systemctl status demo.service
```

查看详细日志：

```bash
journalctl -u demo.service -xe
```

用户级服务：

```bash
systemctl --user status demo.service
journalctl --user -u demo.service -xe
```

## 服务频繁自动重启

如果服务启动后立刻退出，systemd 可能会不断重启。可以查看日志确认原因：

```bash
journalctl -u demo.service -f
```

如果想限制重启频率，可以增加：

```ini
StartLimitIntervalSec=60
StartLimitBurst=5
```

表示 60 秒内最多重启 5 次。

# 嵌入式 Linux 中的自启动

如果是在完整 Ubuntu 系统中，优先使用 `systemd`。但在一些嵌入式 Linux 系统中，尤其是 BusyBox、Buildroot 裁剪系统，可能并没有 systemd，这时常见方式仍然是 init 脚本。

例如 Buildroot 系统中，常见自启动脚本目录为：

```bash
/etc/init.d/
```

脚本命名通常类似：

```bash
S99demo
```

`S` 表示启动时执行，后面的数字用于控制启动顺序，数字越小越早执行。

一个简单示例：

```bash
#!/bin/sh

case "$1" in
  start)
    echo "start demo service"
    /usr/bin/demo_app &
    ;;
  stop)
    echo "stop demo service"
    killall demo_app
    ;;
  restart)
    $0 stop
    $0 start
    ;;
  *)
    echo "Usage: $0 {start|stop|restart}"
    exit 1
    ;;
esac

exit 0
```

添加执行权限：

```bash
chmod +x /etc/init.d/S99demo
```

这类方式更接近传统嵌入式系统中的“启动时执行某个初始化脚本”，而 systemd 更适合较完整的 Linux 发行版，可以提供更好的依赖管理、日志管理和服务恢复能力。

# 总结

对于日常 Linux 服务部署来说，`systemd` 是非常实用的服务管理工具。它解决的不只是“开机自启动”这一个问题，还包括服务状态查看、失败自动恢复、日志集中管理、依赖顺序控制等一整套后台服务管理问题。

个人使用时可以优先考虑用户级 systemd，适合管理自己的 Python、Node、模型服务；如果服务需要系统级权限，或者希望所有用户都能访问，则可以使用系统级 systemd。

简单来说：

- 完整 Linux 发行版：优先使用 `systemd`
- 个人模型服务或 Web UI：优先使用用户级 systemd
- 系统服务或需要 root 权限：使用系统级 systemd
- BusyBox/Buildroot 等嵌入式系统：根据系统实际情况使用 `/etc/init.d/` 脚本

# 参考链接

- [systemd.service 中文手册](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html)
- [systemctl 中文手册](https://www.freedesktop.org/software/systemd/man/latest/systemctl.html)
- [journalctl 中文手册](https://www.freedesktop.org/software/systemd/man/latest/journalctl.html)
