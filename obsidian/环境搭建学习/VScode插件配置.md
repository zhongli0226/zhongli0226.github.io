---
title: VScode插件配置
---

# 前言

统计，并记录一下自己的VScode的相关配置，便于更换电脑的时候能够快速配置好开发环境。虽然VScode可以同步账号配置，但是如果电脑相关环境地址不同的化，还是需要重新配置一下。所以这里记录一下如何配置。

# ① koroFileHeader插件配置

## 插件介绍

1. VSCode插件: 用于一键生成文件头部注释并自动更新最后编辑人和编辑时间、函数注释自动生成和参数提取。
2. 插件可以帮助用户养成良好的编码习惯，规范整个团队风格。
3. 从2018年5月维护至今, 关闭issue 500+ ，拥有39.7w+的用户，VSCode图表统计日均安装200-500
4. 经过多版迭代后，插件支持所有主流语言,灵活方便，文档齐全，食用简单！

## 配置参考

```json
    "fileheader.customMade": {
        "Description": "",
        "Version": "",
        "Autor": "tangwc",
        "Date": "Do not edit",
        "LastEditors": "tangwc",
        "LastEditTime": "Do not edit",
        "FilePath":"Do not edit",
        "custom_string_obkoro1": "",
        "custom_string_obkoro1_copyright": " Copyright (c) ${now_year} by tangwc, All Rights Reserved. ",
    },
    "fileheader.cursorMode": {
        "description": "", // 函数注释生成之后，光标移动到这里
        "param": "", // param 开启函数参数自动提取 需要将光标放在函数行或者函数上方的空白行
        "return": "",
    },
    "fileheader.configObj": {
        "createFileTime": true,
        "language": {
            "languagetest": {
                "head": "/$$",
                "middle": " $ @",
                "end": " $/",
                "functionSymbol": {
                    "head": "/** ",
                    "middle": " * @",
                    "end": " */"
                },
                "functionParams": "js"
            }
        },
        "autoAdd": true,
        "autoAddLine": 100,
        "autoAlready": true,
        "annotationStr": {
            "head": "/*",
            "middle": " * @",
            "end": " */",
            "use": false
        },
        "headInsertLine": {
            "php": 2,
            "sh": 2
        },
        "beforeAnnotation": {
            "文件后缀": "该文件后缀的头部注释之前添加某些内容"
        },
        "afterAnnotation": {
            "文件后缀": "该文件后缀的头部注释之后添加某些内容"
        },
        "specialOptions": {
            "特殊字段": "自定义比如LastEditTime/LastEditors"
        },
        "switch": {
            "newlineAddAnnotation": true
        },
        "supportAutoLanguage": [],
        "prohibitAutoAdd": [
            "json"
        ],
        "folderBlacklist": [
            "node_modules",
            "文件夹禁止自动添加头部注释"
        ],
        "prohibitItemAutoAdd": [
            "项目的全称, 整个项目禁止自动添加头部注释, 可以使用快捷键添加"
        ],
        "moveCursor": true,
        "dateFormat": "YYYY-MM-DD HH:mm:ss",
        "atSymbol": [
            "@",
            "@"
        ],
        "atSymbolObj": {
            "文件后缀": [
                "头部注释@符号",
                "函数注释@符号"
            ]
        },
        "colon": [
            ": ",
            ": "
        ],
        "colonObj": {
            "文件后缀": [
                "头部注释冒号",
                "函数注释冒号"
            ]
        },
        "filePathColon": "路径分隔符替换",
        "showErrorMessage": false,
        "writeLog": false,
        "wideSame": false,
        "wideNum": 13,
        "functionWideNum": 0,
        "CheckFileChange": false,
        "createHeader": false,
        "useWorker": false,
        "designAddHead": false,
        "headDesignName": "random",
        "headDesign": false,
        "cursorModeInternalAll": {},
        "openFunctionParamsCheck": true,
        "functionParamsShape": [
            "{",
            "}"
        ],
        "functionBlankSpaceAll": {},
        "functionTypeSymbol": "*",
        "typeParamOrder": "type param",
        "customHasHeadEnd": {},
        "throttleTime": 60000,
        "functionParamAddStr": "",
        "NoMatchParams": "no show param"
    },
```

# ② Better Comments插件配置

## 插件介绍

Better Comments扩展将帮助您在代码中创建更加人性化的注释。
使用此扩展，您将能够将注释分类为：

* 警报
* 查询
* todo
* 亮点
* 您想要的任何其他注释样式都可以在设置中指定

## 配置参考

```json
    "better-comments.tags": [
        {
            "tag": "!",
            "color": "#FF2D00",
            "strikethrough": false,
            "underline": false,
            "backgroundColor": "transparent",
            "bold": false,
            "italic": false
        },
        {
            "tag": "?",
            "color": "#3498DB",
            "strikethrough": false,
            "underline": false,
            "backgroundColor": "transparent",
            "bold": false,
            "italic": false
        },
        {
            "tag": "//",
            "color": "#474747",
            "strikethrough": true,
            "underline": false,
            "backgroundColor": "transparent",
            "bold": false,
            "italic": false
        },
        {
            "tag": "todo",
            "color": "#FF8C00",
            "strikethrough": false,
            "underline": false,
            "backgroundColor": "transparent",
            "bold": false,
            "italic": false
        },
        {
            "tag": "坑",
            "color": "#FFFFCC",
            "strikethrough": false,
            "underline": false,
            "backgroundColor": "transparent",
            "bold": false,
            "italic": false
        },
        {
            "tag": "可以删除",
            "color": "#FFFFCC",
            "strikethrough": false,
            "underline": false,
            "backgroundColor": "transparent",
            "bold": false,
            "italic": false
        },
        {
            "tag": "未完成",
            "color": "#FFFFCC",
            "strikethrough": false,
            "underline": false,
            "backgroundColor": "transparent",
            "bold": false,
            "italic": false
        },
        {
            "tag": "test",
            "color": "#FFFFCC",
            "strikethrough": false,
            "underline": false,
            "backgroundColor": "transparent",
            "bold": false,
            "italic": false
        },
        {
            "tag": "tip",
            "color": "#CCFFFF",
            "strikethrough": false,
            "underline": false,
            "backgroundColor": "transparent",
            "bold": false,
            "italic": false
          },
        {
            "tag": "*",
            "color": "#98C379",
            "strikethrough": false,
            "underline": false,
            "backgroundColor": "transparent",
            "bold": false,
            "italic": false
        }
    ],
    "better-comments.highlightPlainText": true,
```

# ③ 内部终端输出中文

## 问题描述

内部终端有时在使用的时候打印中文会乱码，这是因为文本直接编码方式不同导致的，这里提供设置能够解决此类问题。

## 解决方法

```json
    "terminal.integrated.profiles.windows": {
        "PowerShell": {
            "source": "PowerShell",
            "icon": "terminal-powershell",
            "args": [
                "-NoExit",
                "chcp 65001"
            ]
        },
        "Command Prompt": {
            "path": [
                "${env:windir}\\Sysnative\\cmd.exe",
                "${env:windir}\\System32\\cmd.exe"
            ],
            "args": [
                "/K",
                "chcp 65001"
            ],
            "icon": "terminal-cmd"
        },
        "Git Bash": {
            "source": "Git Bash"
        }
    },
```

# ④ 索引函数不自动打开此目录

## 问题描述

在有时索引跳转某个函数的时候，资源管理器总会自动打开相关文件夹，在工程目录较为繁多的时候，会导致目录混乱，这里调整设置即可解决此类问题

## 解决方法

设置：

```json
	"explorer.autoReveal": false,
```

# ⑤ 彩色括号

## 使用说明

**软件版本**vscode 1.67（2022年4月更新的版本）

## 设置方法

设置界面代码：

```json
    "workbench.colorCustomizations": {
        "editorBracketHighlight.foreground1": "#00ff00",
        "editorBracketHighlight.foreground2": "#70aada",
        "editorBracketHighlight.foreground3": "#fffb17",
        "editorBracketHighlight.foreground4": "#00d696",
        "editorBracketHighlight.foreground5": "#d88c00",
        "editorBracketHighlight.foreground6": "#da02ee"
    },
```

# 2024年5月26日
## 格式化插件推荐

由于 vscode自带的格式化工具在格式化define定义的时候和部分变量地方，总是对其的不尽如人意。所以这里提供两个比较方便的插件用于局部的格式化。
1. define 格式化插件
参考链接
[c-define-align: vscode 插件 用户宏定义对齐 (gitee.com)](https://gitee.com/brand_zhou/c-define-align)
2. better-align
一个根据`: = += -= *= /= =>`来进行对齐的插件