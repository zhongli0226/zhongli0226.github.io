---
title: Python脚本与window命令脚本结合
---

# 前言

经常制作各种python脚本处理文件夹里的各种数据数据，但是每次更换一次文件夹就要改一次脚本里的文件路径，这样感觉效率并不高，偶然的一个机会，看到了利用window命令脚本和Python结合，可以搞出类似界面拖拽式输入的方式。

# 操作方式

1. 创建一个.cmd window命令脚本
2. 编写如下代码：

```
@echo off
chcp 65001 > nul
:start
set filePath=
set /p filePath=Please input path:
python "(你需要运行python脚本).py" %filePath%
goto start
```

3. Python增加代码

```python
import sys

if len(sys.argv) == 1:
    print('请输入正确的路径')
    exit(-1)
    
path = sys.argv[1:][0]  # 路径
```
4. 运行window命令脚本,并将需要输入的文件或文件夹拖入，按回车即可运行

![Python命令脚本使用展示](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/Python命令脚本使用展示.png)

