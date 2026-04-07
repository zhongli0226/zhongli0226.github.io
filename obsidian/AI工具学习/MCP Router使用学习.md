---
title: MCP Router使用学习
---

# 前言

最近在捣鼓使用 codex，由于 claude code 总是封号，就改用 codex 了，但是 codex 对于导入 mcp 有点麻烦，格式方式与之前不太相同，最近发现有个 mcp 集合工具，准备研究一下如何使用。

# 1. 为什么要用 MCP Router

- MCP Router 就像 **网关**：你只要在它这里配置一次，后续 [VSCode](https://so.csdn.net/so/search?q=VSCode&spm=1001.2101.3001.7020) / Codex / Cursor 等客户端都能用，不用重复折腾。
- 支持一键导入 [JSON](https://so.csdn.net/so/search?q=JSON&spm=1001.2101.3001.7020)，大量 MCP 服务一秒生效。
- 还能帮你管理 Key、环境变量，省时省力。

一句话：**MCP Router = 统一 MCP 中台**。

# 2. 安装准备

访问 [mcp-router/mcp-router: A Unified MCP Server Management App](https://github.com/mcp-router/mcp-router "mcp-router/mcp-router: A Unified MCP Server Management App")地址,Releases内下载exe版本。
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20251026134327.png)


# 3. 编辑Codex配置文件

用记事本 / VSCode 打开 config.toml。 把你的 mcp-router 配置写进去

Codex 默认配置文件在：
`C:\Users\{你的用户名}\.codex\config.toml`

文本方式打开，并写入：

```toml
model = "gpt-5-codex"
​
[mcp_servers.mcp-router]
command = "C:\\Node\\node.exe"
args = ["C:\\Users\\{你的名字}\\AppData\\Roaming\\npm\\node_modules\\mcpr-cli\\dist\\mcpr.js", "connect"]
env = { 
  SystemRoot = 'C:\WINDOWS',
  COMSPEC = 'C:\WINDOWS\system32\cmd.exe',
  MCPR_TOKEN = "你的KEY"
}
​
```

你需要确定三样东西：

- Node.js 的路径（command 部分）
- mcpr-cli 的路径（args 部分）
- MCPR_TOKEN 填你在 MCP Router 应用里生成的 Key。

## 🔹 1. 确认 Node.js 的路径

1. 打开 **命令提示符（cmd）** 或 **PowerShell**。
2. 输入：
```bash
where node
```

3. 你会看到类似这样的结果：
```bash
C:\Program Files\nodejs\node.exe
```
这就是 Node 的实际路径，你要把它填到 `command` 里。

👉 比如：
```bash
 command = "C:\\Program Files\\nodejs\\node.exe"
```
## 🔹 2. 确认 mcpr-cli 的路径

1. 仍然在命令提示符里输入：
```bash
  npm list -g mcpr-cli
```
或者
```bash
  npm root -g
```
第二个命令会显示全局 npm 包的安装目录，例如：
```bash
C:\Users\Jack\AppData\Roaming\npm\node_modules
```

2. 在这个目录下找到 `mcpr-cli` 文件夹。 路径应该像这样：
```bash
C:\Users\Jack\AppData\Roaming\npm\node_modules\mcpr-cli\dist\mcpr.js
```
👉 你要把它写到 `args` 里，例如：
```bash
 args = ["C:\\Users\\Jack\\AppData\\Roaming\\npm\\node_modules\\mcpr-cli\\dist\\mcpr.js", "connect"]
```

## 🔹 没装Node和mcpr-cli的看这里

### 1. 装 Node.js

- 去 Node.js 官网 下载 LTS 版本，一路下一步。
- 装好后，打开 CMD 输入：
     where node
    我的是：
     C:\Node\node.exe
    记下来，后面配置要用。
### 2. 装 mcpr-cli
- 在 CMD 里执行：
     npm install -g mcpr-cli
     npm root -g
- 第二个命令会告诉你全局安装目录，比如：
     C:\Users\Jack\AppData\Roaming\npm\node_modules
- 找到：
     mcpr-cli\dist\mcpr.js
    这就是 CLI 的入口文件。

## 🔹3.获取 MCPR_TOKEN
1. 打开下载好的 **MCP Router.exe**。
2. 在 **How To Use** 窗口里，就能看到一串token
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20251026135743.png)

3. 复制下来，这就是你的 **MCPR_TOKEN**（相当于密码）。

# 4. 一键导入 5个常用 MCP

懒人福音：直接写好一个 JSON，丢给 MCP Router 一次性导入。
```json
{
   "mcpServers": {
     "context7": {
       "command": "npx",
       "args": ["-y", "@upstash/context7-mcp"],
       "env": {}
     },
     "mcp-deepwiki": {
       "command": "npx",
       "args": ["-y", "mcp-deepwiki@latest"],
       "env": {}
     },
     "playwright": {
       "command": "npx",
       "args": ["@playwright/mcp@latest"],
       "env": {}
     },
     "sequential-thinking": {
       "command": "npx",
       "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
       "env": {}
     },
     "open-websearch": {
       "command": "npx",
       "args": ["-y", "open-websearch@latest"],
       "env": {
         "MODE": "stdio",
         "DEFAULT_SEARCH_ENGINE": "duckduckgo",
         "ALLOWED_SEARCH_ENGINES": "duckduckgo,bing,brave"
       }
     }
   }
 }
```
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20251026135923.png)

 导入方法：
1. 打开 MCP Router
2. 点击 **Import from JSON**
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20251026140002.png)
搞定后，你能看到 5 个 MCP 服务都进来了：
- Context7
- DeepWiki
- Playwright
- Sequential-Thinking
- Open-Websearch
