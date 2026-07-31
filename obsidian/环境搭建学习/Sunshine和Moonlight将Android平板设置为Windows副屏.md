---
title: Sunshine 和 Moonlight 将 Android 平板设置为 Windows 副屏
created: 2026-07-31
description: 记录通过 Sunshine、Moonlight 和 ParsecVDisplay，在同一局域网内将 Android 平板配置为 Windows 扩展副屏的完整过程，包括串流配对、虚拟显示器创建、输出目标与音频设置。
tags:
  - Sunshine
  - Moonlight
  - ParsecVDisplay
  - Android
  - Windows副屏
---

# 前言

这篇笔记记录如何组合使用 `Sunshine`、`Moonlight` 和 `ParsecVDisplay`，让 Android 平板成为 Windows 电脑的扩展副屏。

整个配置分为两个阶段：先通过 `Sunshine` 和 `Moonlight` 建立基础串流，确认平板可以显示并操作电脑；再使用 `ParsecVDisplay` 创建虚拟显示器，并让 `Sunshine` 只串流该显示器，最终实现扩展屏而不是简单的屏幕复制。

> [!NOTE]
> 本文根据参考仓库中 2025 年 11 月 13 日的教程整理。原教程使用 `Sunshine 2025.924.154138`、`Moonlight v12.1` 和 `ParsecVDisplay v0.45`。如果使用其他版本，界面名称和入口位置可能有所不同。

# 背景介绍

这个方案由三个软件配合完成：

| 软件 | 安装位置 | 作用 |
| --- | --- | --- |
| `Sunshine` | Windows 电脑 | 提供桌面串流服务，并指定需要串流的显示器 |
| `Moonlight` | Android 平板 | 连接电脑并接收桌面画面 |
| `ParsecVDisplay` | Windows 电脑 | 创建一个分辨率可配置的虚拟显示器 |

使用前需要满足以下条件：

- Windows 电脑和 Android 平板连接到同一局域网。
- 两台设备所在的 Wi-Fi 没有启用 `AP 隔离`。
- 电脑已经安装 `Sunshine` 和 `ParsecVDisplay`，平板已经安装 `Moonlight`。

> [!WARNING]
> 启用了 `AP 隔离` 的网络会阻止局域网设备互相发现和连接。原教程因此不适用于存在此类限制的校园网。

# 核心思路

完整的数据流如下：

1. `ParsecVDisplay` 在 Windows 中创建一个虚拟显示器。
2. Windows 使用“扩展这些显示器”模式，将虚拟显示器作为独立桌面空间。
3. `Sunshine` 通过虚拟显示器名称锁定需要串流的画面。
4. Android 平板上的 `Moonlight` 接收该画面，使平板表现为 Windows 的扩展副屏。

其中最重要的是区分下面两种状态：

- 只完成 `Sunshine` 与 `Moonlight` 配对时，平板显示的是电脑桌面的复制画面。
- 创建虚拟显示器并让 `Sunshine` 输出该显示器后，平板才会成为扩展副屏。

# 操作步骤

## 步骤一：下载并安装软件

在 Windows 电脑上安装：

- [Sunshine 服务端](https://github.com/LizardByte/Sunshine/releases)
- [ParsecVDisplay 虚拟显示器驱动](https://github.com/nomi-san/parsec-vdd/releases)

在 Android 平板上安装：

- [Moonlight 客户端](https://github.com/moonlight-stream/moonlight-android/releases)

## 步骤二：初始化 Sunshine

安装完成后，双击运行 `Sunshine`。首次启动时，程序会自动使用浏览器打开本机 `localhost` 地址下的 Web 管理后台。

如果误关了管理页面，可以在 Windows 系统托盘中右键单击 `Sunshine` 图标，然后选择 `Open Sunshine` 重新打开。

第一次进入后台时，需要设置登录使用的账户名和密码，随后使用刚才设置的信息登录。进入后台后，可以按需要切换本地化语言，并保存、应用设置。

![Sunshine Web 管理后台](https://github.com/user-attachments/assets/3c424c60-db8d-4a92-82dc-73c62c476687)

## 步骤三：在 Moonlight 中发现并连接电脑

确认平板和电脑处于同一 Wi-Fi 后，在平板上打开 `Moonlight`。

正常情况下，客户端会自动发现已经运行 `Sunshine` 的电脑。如果没有发现设备，可以点击加号，手动输入电脑的 IP 地址进行连接。

![Moonlight 发现电脑](https://github.com/user-attachments/assets/8133c256-8fdf-474a-8f95-7521ecdc823f)

点击检测到的电脑，再点击列表中的第一个 `Desktop`。首次连接时，根据界面提示完成 `PIN` 码配对。

连接成功后，平板和电脑会显示相同画面，同时可以在平板上操作电脑。到这里仅完成了基础串流，当前效果仍然是复制屏幕。

## 步骤四：设置虚拟显示器的分辨率

打开 `ParsecVDisplay`，进入 `Custom Display Modes`，根据 Android 平板的分辨率设置 `slot 1` 的参数。

完成后点击 `Apply`，关闭并重新启动程序，使自定义显示模式生效。

![ParsecVDisplay 自定义显示模式](https://github.com/user-attachments/assets/b2ab99b4-b4d4-4a4b-9ff1-9e540f8601b9)

## 步骤五：创建虚拟显示器

继续在 `ParsecVDisplay` 中新建对应的虚拟显示器。创建完成后，记录程序显示的虚拟显示器名称。

原教程中的名称示例为：

```text
\\.\DISPLAY8
```

![ParsecVDisplay 创建虚拟显示器](https://github.com/user-attachments/assets/0eb3e38b-a808-491a-8a60-40951b163b2a)

![查看虚拟显示器名称](https://github.com/user-attachments/assets/6e950973-2eec-4835-a4a3-6b3420c02e6b)

> [!NOTE]
> `\\.\DISPLAY8` 只是原教程中的示例。实际配置时，应使用自己电脑上 `ParsecVDisplay` 显示的名称。

## 步骤六：让 Sunshine 串流虚拟显示器

回到 `Sunshine` 的 Web 管理后台，进入 `配置` → `Audio/Video`，找到 `config.output_name_windows`，填入上一步记录的虚拟显示器名称。

为了让声音继续从电脑端播放，原教程还要求取消勾选以下两项：

- `安装 Steam 音频驱动程序`
- `流音频`

修改完成后保存并应用配置。

![Sunshine 输出显示器与音频设置](https://github.com/user-attachments/assets/71340c01-5e97-4f67-b6c2-a58fa90413e0)

## 步骤七：配置 Windows 显示模式

打开 Windows 的显示设置，完成以下配置：

1. 将新建的虚拟显示器设置为主显示器。
2. 将多显示器模式设置为 `扩展这些显示器`。

![Windows 扩展显示器设置](https://github.com/user-attachments/assets/f2d8d544-c6ee-4c7a-a197-83f824878b63)

> [!WARNING]
> 按照原教程，虚拟显示器必须设置为主显示器，显示模式必须选择“扩展这些显示器”。如果仍使用复制模式，平板不会得到独立的扩展桌面。

## 步骤八：调整 Moonlight 串流参数

打开 `Moonlight` 首页左侧栏中的设置，根据前面创建的虚拟显示器调整串流参数：

| 配置项 | 原教程建议 |
| --- | --- |
| 视频分辨率 | 设置为 `本地` 分辨率 |
| 帧数 | 例如 `60 帧`，与先前设置的刷新率保持一致 |
| 码率 | 调到最高 |
| 帧速调节 | 设置为 `优先最低延迟` |

![Moonlight 视频参数设置](https://github.com/user-attachments/assets/aec32fae-7679-4408-a22c-61acf65a9f72)

完成设置后，返回 `Moonlight` 的电脑列表，再次选择目标电脑并点击 `Desktop`。此时平板接收的是虚拟显示器画面，可以作为 Windows 的扩展副屏使用。

# 常见问题

## Moonlight 找不到电脑

首先确认电脑和平板连接的是同一个 Wi-Fi，并检查当前网络是否启用了 `AP 隔离`。

如果两台设备处于同一局域网但仍未自动发现，可以点击 `Moonlight` 中的加号，手动输入运行 `Sunshine` 的电脑 IP 地址。

## 平板只能复制电脑画面

完成 `Sunshine` 与 `Moonlight` 配对，只代表基础串流已经建立。要实现扩展副屏，还需要继续完成以下配置：

- 使用 `ParsecVDisplay` 创建虚拟显示器。
- 将虚拟显示器名称填入 `config.output_name_windows`。
- 在 Windows 中选择 `扩展这些显示器`。
- 将虚拟显示器设置为主显示器。

## Sunshine 串流的不是虚拟显示器

检查 `Sunshine` 中 `config.output_name_windows` 的内容，确保它与 `ParsecVDisplay` 显示的虚拟显示器名称一致，不要直接照抄示例中的 `\\.\DISPLAY8`。

## 希望声音继续从电脑播放

在 `Sunshine` 的 `Audio/Video` 配置中，取消勾选 `安装 Steam 音频驱动程序` 和 `流音频`，然后保存并应用设置。

# 总结

使用 Android 平板作为 Windows 副屏的关键，不只是建立 `Sunshine` 与 `Moonlight` 串流，还要通过 `ParsecVDisplay` 创建一个独立的虚拟显示器。

实际配置时，可以先完成 `Moonlight` 配对并确认复制画面正常，再配置虚拟显示器、指定 `Sunshine` 输出目标，最后切换 Windows 的扩展显示模式。这样更容易判断问题出在基础网络连接，还是虚拟显示器配置。

# 参考链接

- [Applications_of_Sunshine_and_Moonlight 仓库](https://github.com/AASWEETBOY/Applications_of_Sunshine_and_Moonlight)
- [Sunshine Releases](https://github.com/LizardByte/Sunshine/releases)
- [Moonlight Android Releases](https://github.com/moonlight-stream/moonlight-android/releases)
- [ParsecVDisplay Releases](https://github.com/nomi-san/parsec-vdd/releases)
- [原仓库引用的参考教程](https://blog.csdn.net/wwiyou/article/details/147354084)
