---
title: WSL安装与配置
---

# 前言

最近由于我电脑硬盘更新，导致换盘符号之前忘记将之前的虚拟机进行备份，导致原来VirtualBox 安装的虚拟机损坏无法正常导入了，恰好最近做 Claude code 了解到 WSL2 的虚拟机，于是准备用 WSL2 重新部署一个与 Win 生态兼容的的虚拟机。
 两者进行对比如下：

| 特性             | WSL2                  | VirtualBox        |
| -------------- | --------------------- | ----------------- |
| **性能**         | 高（轻量级虚拟化）             | 中等（完整虚拟化）         |
| **Windows 集成** | 无缝（文件、端口、命令行）         | 有限（需共享文件夹、网络配置）   |
| **GUI 支持**     | 原生支持（Windows 11 WSLg） | 需要额外配置 X 服务器或图形界面 |
| **开发工具集成**     | 优秀（VS Code、Docker 等）  | 一般（需手动配置）         |
| **管理复杂度**      | 低（一键安装、自动更新）          | 高（手动配置、更新）        |
| **存储占用**       | 动态扩展（小）               | 固定分配（较大）          |

# 前置条件
## 1. 确认操作系统支持性
在安装 WSL2 之前，需确保你的 Windows 系统满足最低要求。
### Windows 11
- 默认支持 WSL2，无需额外检查。
- 推荐版本：22H2 或更高，以支持 systemd 和 WSLg（GUI 应用支持）。
### Windows 10
- 最低要求：**1903 版本（Build 18362）** 或更高。
- 推荐版本：20H2 或更高，以获得更好的性能和功能支持。
### 查看系统版本
1. 按 `Win + R`，输入 `winver`，回车。
2. 弹窗将显示 Windows 版本和 Build 号。
## 2. 开启电脑虚拟化
在开启关闭 Windows 功能界面中，开启 **Hyper-V** ，**适用于 Linux 的 Windows 子系统**，**虚拟机平台**，等待安装完成后重启电脑。
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250803174101.png)



> [!NOTE] **注意**:
> 若有些选项无法勾选，可能是电脑没有开启虚拟化，需要进入电脑 BIOS 系统开启电脑虚拟化，电脑虚拟化是否开启可以在任务管理器中查看
> ![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250803173807.png)

# WSL 常用命令
| 命令                               | 说明                 |
| -------------------------------- | ------------------ |
| `wsl --list` / `-l`              | 列出所有已安装的发行版        |
| `wsl --list --verbose` / `-l -v` | 显示详细信息（包括版本和默认发行版） |
| `wsl --set-version <发行版名> 2`     | 将指定发行版切换到 WSL2     |
| `wsl --set-default <发行版名>`       | 设置默认运行的发行版         |
| `wsl --set-default-version 2`    | 设置新安装的发行版默认使用 WSL2 |
| `wsl --shutdown`                 | 关闭所有运行中的 WSL 实例    |
| `wsl --terminate <发行版名>`         | 强制终止指定发行版          |
| `wsl --unregister <发行版名>`        | 注销并删除指定发行版         |
| `wsl --export <发行版名> <文件路径>`     | 导出发行版到指定路径         |
| `wsl --import <发行版名> <路径> <文件>`  | 导入发行版到指定位置         |
# 安装 Ubuntu 环境
## 1. 设置 WSL 默认版本
将默认 WSL 版本设置为 2。例如：
```bash
wsl --set-default-version 2
```
 ## 2. 更新 WSL 到最新
```bash
wsl --update
```
## 3. 安装 Ubuntu
```bash
 wsl --install -d Ubuntu-22.04
```
安装完成后，WSL 将自动启动 Ubuntu 并提示设置用户名和密码。
## 4. 迁移默认位置（可忽略）
WSL2 的虚拟硬盘文件（`.vhdx`）默认占用系统盘空间，可能导致 C 盘空间不足。以下介绍如何查看默认存储位置并迁移到其他磁盘。
Ubuntu 22.04 的文件默认位于：
 ```makefile
 C:\Users\<用户名>\AppData\Local\Packages\CanonicalGroupLimited...UbuntuonWindows_...
 ```
- 包含一个扩展名为 `.vhdx` 的虚拟硬盘文件，存储 Ubuntu 的完整文件系统。
- 默认占用空间约为 1-2GB，随使用逐渐增长。
### 导出系统
```bash
wsl --export Ubuntu-22.04 D:\WSL\Ubuntu2204_backup.tar
```
- 将 Ubuntu 22.04 导出为 `.tar` 文件，存储在 `D:\WSL` 目录。
### 注销旧系统
```bash
wsl --unregister Ubuntu-22.04
```
- 删除旧的 Ubuntu 发行版，释放 C 盘空间。
### 安装在新位置
```bash
wsl --import Ubuntu-22.04 D:\WSL\Ubuntu2204 D:\WSL\Ubuntu2204_backup.tar --version 2
```
- 将 Ubuntu 导入到 `D:\WSL\Ubuntu2204` 目录，确保使用 WSL2。
> [!NOTE] **提示**：
> - 迁移后，建议定期备份 `.tar` 文件以便恢复。
> - 若需调整虚拟硬盘大小，可使用 `wsl --manage` 命令（Windows 11 24H2 及以上支持）。


# 配置 WSL 代理

WSL 设置自动代理
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250803175508.png)
在wsl中打开shell的配置文件。

```shell
# 打开配置文件
vim .bashrc
```

在文件中添加以下命令（7897是端口号）：

```text
host_ip=$(ip route | awk '/default/ {print $3}')
export http_proxy="http://$host_ip:7897"
export https_proxy="http://$host_ip:7897"
```

保存并退出即可，可以在终端使用curl命令测试：

```vim
curl www.google.com
```
测试成功如图：
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250803175734.png)
