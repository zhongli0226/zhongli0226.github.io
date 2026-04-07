---
title: llama.cpp部署大模型
---

# llama.cpp 部署本地大模型

之前我也用过 `ollama`、`vllm` 之类的方式部署大模型。最近折腾下来，感觉 `llama.cpp` 在本地部署这件事上确实很实用，尤其是对消费级 PC 来说，运行效率和可控性都不错，所以这里单独记一篇。

这篇笔记主要记录我自己实际跑通 `llama.cpp` 的过程，重点放在 `Windows 10` 和 `Linux` 两套环境。内容不追求面面俱到，主要是方便后面自己回看时能快速复现。

## 1. 为什么这次换成 llama.cpp

我这次最大的感受有两个：

- `llama.cpp` 的本地推理效率确实高，尤其适合消费级硬件
- 它更像一个比较“底层”的推理工具，自己编译、自己控制参数，调起来比纯封装方案更灵活

另外，`llama.cpp` 本身也是很多本地推理方案的重要基础组件，`ollama` 底层就会用到它这一套能力。所以如果想更细地控制模型加载、显存分配、启动方式，直接上 `llama.cpp` 会更顺手。

我自己的测试里，`llama.cpp` 跑 `MoE` 模型时表现也比较好。`MoE` 中文一般叫“专家混合模型”，简单理解就是：

- 不是每次都让整个大模型的全部参数一起工作
- 而是按输入内容，动态调用其中一部分“专家”来处理

这样做的好处是：模型总参数可以很大，但单次推理未必需要把所有参数都拉满，对本地硬件会友好一些。

## 2. 我这次用到的环境

我这里主要记录两套环境：

- `Windows 10`
- `Linux`

两边都需要先准备好基础工具：

- `git`
- `cmake`
- `CUDA`（如果要编译 GPU 版）

其中 `Windows 10` 对工具链版本会更敏感一些，我这次能正常跑通的组合是：

- `CUDA 12.9`
- `CMake 3.28`
- `Git`

在 `Windows 10` 下，除了装 `NVIDIA CUDA Toolkit 12.9`，还需要确保装上这些组件：

- `CUDA Compiler (nvcc)`
- `Visual Studio Integration`
- `CUDA Development`

另外还要安装 `Visual Studio 2022`，安装时勾选：

- `使用 C++ 的桌面开发`

`Linux` 相对简单一些，只要 `cmake`、`git`、`cuda` 这些基础环境都已经就绪，后面基本就能直接编译。

安装完后，先验证下面几个命令是否可用：

```shell
cmake --version
nvcc --version
git --version
```

## 3. 编译 llama.cpp

### 3.1 拉仓库

先把仓库拉下来：

```shell
git clone https://github.com/ggml-org/llama.cpp.git
cd llama.cpp
```

### 3.2 配置构建

这里分成 `CPU` 版和 `CUDA` 版，两者主要区别在配置阶段。

`CPU` 版：

```shell
cmake -B build
```

`CUDA` 版：

```shell
cmake -B build -DGGML_CUDA=ON
```

### 3.3 编译 Release

```shell
cmake --build build --config Release -j 12
```

`-j` 后面的数字表示编译时使用的 CPU 线程数，按自己机器性能改就行，不一定非要是 `12`。

编译完成后，生成文件一般在下面这些位置：

- `Windows`：`build\bin\Release\`
- `Linux`：`build/bin/`

## 4. 启动 llama-server

我这里主要用的是 `llama-server`，这样可以直接把模型作为本地服务跑起来，后面接别的工具也方便。

### 4.1 Windows 启动脚本

这个脚本适合先快速把服务跑起来。后面如果换模型，通常改一下 `MODEL` 和 `--alias` 就够了。

```bat
@echo off
setlocal

REM ===========================
REM 用户可修改区
REM ===========================
set "MODEL=C:\models\Qwen3.5-35B-A3B-Q4_K_M.gguf"
set "HOST=0.0.0.0"
set "PORT=11434"
set "CTX=131072"

REM ===========================
REM 自动查找 llama-server.exe
REM ===========================
set "SERVER_EXE="
if exist "C:\llama.cpp\build\bin\Release\llama-server.exe" set "SERVER_EXE=C:\llama.cpp\build\bin\Release\llama-server.exe"
if not defined SERVER_EXE if exist ".\build\bin\Release\llama-server.exe" set "SERVER_EXE=.\build\bin\Release\llama-server.exe"
if not defined SERVER_EXE if exist ".\build\bin\llama-server.exe" set "SERVER_EXE=.\build\bin\llama-server.exe"
if not defined SERVER_EXE if exist ".\llama-server.exe" set "SERVER_EXE=.\llama-server.exe"

if not defined SERVER_EXE (
    echo [ERROR] 找不到 llama-server.exe
    pause
    exit /b 1
)

if not exist "%MODEL%" (
    echo [ERROR] 找不到模型文件: %MODEL%
    pause
    exit /b 1
)

echo =========================================
echo llama-server Quick Start
echo -----------------------------------------
echo Server : %SERVER_EXE%
echo Model  : %MODEL%
echo Host   : %HOST%
echo Port   : %PORT%
echo Ctx    : %CTX%
echo =========================================
echo.

REM 在 cmd 里设置环境变量要用 set
set "LLAMA_CHAT_TEMPLATE_KWARGS={"enable_thinking":false}"

"%SERVER_EXE%" ^
  -m "%MODEL%" ^
  --host %HOST% ^
  --port %PORT% ^
  --ctx-size %CTX% ^
  --alias "qwen3.5-35b-a3b" ^
  --cache-type-k q8_0 ^
  --cache-type-v q8_0

echo.
echo [INFO] llama-server 已退出，按任意键关闭窗口...
pause >nul
endlocal
```

### 4.2 Linux 用 systemd 托管

如果是在 `Linux` 上长期跑，直接挂成 `systemd` 服务会省事很多。下面分别记一下管理员权限和用户权限两种方式。

管理员权限部署：

```shell
sudo tee /etc/systemd/system/llama-server.service >/dev/null <<'EOF'
[Unit]
Description=llama.cpp server
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/hupingbo/llama.cpp
ExecStart=/home/hupingbo/llama.cpp/build/bin/llama-server -m /home/hupingbo/Models/Qwen3.5-35B-A3B-Q4_K_M.gguf --alias "qwen3.5-35b-a3b" --host 0.0.0.0 --port 11434 --ctx-size 262144 --cache-type-k q8_0 --cache-type-v q8_0 --chat-template-kwargs '{"enable_thinking": false}'
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl stop llama-server
sudo systemctl daemon-reload
sudo systemctl restart llama-server
sudo systemctl enable --now llama-server
sudo systemctl status llama-server
journalctl -u llama-server.service -f
```

用户权限部署：

```shell
tee ~/.config/systemd/user/llama-server.service >/dev/null <<'EOF'
[Unit]
Description=llama.cpp server
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/hupingbo/llama.cpp
ExecStart=/home/hupingbo/llama.cpp/build/bin/llama-server -m /home/hupingbo/Models/Qwen3.5-35B-A3B-Q4_K_M.gguf --alias "qwen3.5-35b-a3b" --host 0.0.0.0 --port 11434 --ctx-size 262144 --cache-type-k q8_0 --cache-type-v q8_0 --chat-template-kwargs '{"enable_thinking": false}'
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
EOF

systemctl --user stop llama-server
systemctl --user daemon-reload
systemctl --user restart llama-server
systemctl --user enable --now llama-server
systemctl --user status llama-server
journalctl --user -u llama-server.service -f
```

## 5. 一个我遇到过的问题

### 5.1 Windows 下脚本异常退出后不会自动重启

这个问题我确实遇到过。简单说就是：`llama-server` 一旦异常退出，普通启动脚本就直接结束了，不会自己拉起来。

如果想简单做一个“守护循环”，可以把脚本改成下面这样：

```bat
@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ===========================
REM 用户可修改区
REM ===========================
set "MODEL=C:\models\Qwen3.5-35B-A3B-Q4_K_M.gguf"
set "HOST=0.0.0.0"
set "PORT=11434"
set "CTX=131072"
set "RESTART_DELAY=5"

REM ===========================
REM 自动查找 llama-server.exe
REM ===========================
set "SERVER_EXE="

if exist "C:\llama.cpp\build\bin\Release\llama-server.exe" set "SERVER_EXE=C:\llama.cpp\build\bin\Release\llama-server.exe"
if not defined SERVER_EXE if exist ".\build\bin\Release\llama-server.exe" set "SERVER_EXE=.\build\bin\Release\llama-server.exe"
if not defined SERVER_EXE if exist ".\build\bin\llama-server.exe" set "SERVER_EXE=.\build\bin\llama-server.exe"
if not defined SERVER_EXE if exist ".\llama-server.exe" set "SERVER_EXE=.\llama-server.exe"

if not defined SERVER_EXE (
    echo [ERROR] 找不到 llama-server.exe
    pause
    exit /b 1
)

if not exist "%MODEL%" (
    echo [ERROR] 找不到模型文件: %MODEL%
    pause
    exit /b 1
)

echo =========================================
echo llama-server Quick Start
echo -----------------------------------------
echo Server : %SERVER_EXE%
echo Model  : %MODEL%
echo Host   : %HOST%
echo Port   : %PORT%
echo Ctx    : %CTX%
echo =========================================
echo.

set "LLAMA_CHAT_TEMPLATE_KWARGS={"enable_thinking":false}"
set /a RESTART_COUNT=0

:RUN_SERVER
set /a RESTART_COUNT+=1
echo.
echo [INFO] 第 !RESTART_COUNT! 次启动 llama-server...
echo [INFO] 按 Ctrl+C 可手动退出脚本
echo [INFO] 启动时间: %date% %time%
echo.

"%SERVER_EXE%" ^
  -m "%MODEL%" ^
  --host %HOST% ^
  --port %PORT% ^
  --ctx-size %CTX% ^
  --alias "qwen3.5-35b-a3b" ^
  --cache-type-k q8_0 ^
  --cache-type-v q8_0

set "EXITCODE=%ERRORLEVEL%"
echo.
echo [WARN] llama-server 已退出，退出码: !EXITCODE!

if "!EXITCODE!"=="0" (
    echo [INFO] 检测到正常退出，脚本结束。
    goto END
)

echo [WARN] 检测到异常退出，%RESTART_DELAY% 秒后自动重启...
timeout /t %RESTART_DELAY% /nobreak >nul
goto RUN_SERVER

:END
echo.
echo [INFO] 脚本已结束，按任意键关闭窗口...
pause >nul
endlocal
exit /b
```

## 6. 最后补几句

整体用下来，我对 `llama.cpp` 的评价还是比较高的：

- 编译稍微麻烦一点，但一旦跑通，后面会很顺
- 本地控制力比很多封装型方案更强
- 如果本来就想长期折腾本地模型，这套很值得熟悉

后面如果我继续补这篇笔记，大概率会再单独加两部分：

- 不同量化模型的实际运行体验
- `llama-server` 常用参数整理
