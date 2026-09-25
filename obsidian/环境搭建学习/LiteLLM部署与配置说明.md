---
title: LiteLLM部署与配置说明
created: 2026-09-25
description: 记录使用 LiteLLM Proxy 统一接入 Ollama、vLLM 和 llama.cpp 模型服务的方法，并结合实际配置说明模型分组、负载均衡、健康检查、重试、成本统计和 Prometheus 监控等功能。
tags:
  - LiteLLM
  - AI网关
  - 模型部署
  - 负载均衡
  - 可观测性
---

# 前言

本地部署多个大模型服务后，不同后端的地址、模型名称和接口形式并不完全一致。客户端如果直接连接每一个服务，不仅需要反复修改配置，也不方便统一进行负载均衡、健康检查和监控。

这篇笔记记录如何使用 `LiteLLM Proxy` 作为统一的 OpenAI 兼容网关，并结合我已经使用的 `config.yaml` 说明各项配置的作用。当前配置接入了 `Ollama`、`vLLM` 和 `llama.cpp` 后端，相关模型服务的部署过程可以参考 [[Ollama初识]]、[[Vllm部署大模型]] 和 [[llama.cpp部署大模型]]。

> [!NOTE]
> 本文示例已经隐藏真实内网地址，并将密钥改为环境变量。配置中的地址和密钥应根据实际环境填写，不要把真实凭据提交到公开仓库。

# 背景介绍

`LiteLLM Proxy` 可以将不同模型提供商或本地推理服务统一封装成 OpenAI 兼容接口。客户端只需要连接 LiteLLM，就可以通过统一的 `/v1/chat/completions`、`/v1/embeddings` 等接口调用后端模型。

当前部署关系可以概括为：

```text
OpenAI 兼容客户端
        |
        v
LiteLLM Proxy :4000
        |
        +-- Ollama
        +-- vLLM
        +-- llama.cpp
        +-- 其他 OpenAI 兼容服务
```

LiteLLM 在这里主要承担以下功能：

- 对外提供统一的模型名称和 API 地址。
- 将同名模型的多个部署组成一个模型组。
- 根据路由策略在同组部署之间分配请求。
- 定期检查后端服务是否健康，并避开不可用的部署。
- 统计 Token 用量、请求耗时和参考成本。
- 通过 Prometheus 暴露监控指标。

# 核心思路

配置文件主要由四部分组成：

| 配置区域 | 作用 |
| --- | --- |
| `model_list` | 定义客户端可调用的模型，以及每个模型对应的实际后端 |
| `router_settings` | 定义同名模型之间的路由和重试策略 |
| `general_settings` | 定义代理级功能，例如后台健康检查 |
| `litellm_settings` | 定义 LiteLLM 的全局行为，例如回调、日志脱敏和参数兼容 |

每一个 `model_list` 条目代表一个实际部署。同一个 `model_name` 可以出现多次，这些条目会组成同一个模型组。例如，配置中 `qwen3.8-27b` 对应两个不同端口的 vLLM 实例，客户端仍然只需要请求一次 `qwen3.8-27b`，LiteLLM 会在两个实例之间选择一个。

# 部署步骤

## 步骤一：准备配置文件

在 LiteLLM 的运行目录中创建 `config.yaml`。为了避免把密钥和内网拓扑写进仓库，建议将敏感信息放在环境变量中，再通过 `os.environ/变量名` 引用。

下面的示例保留了实际配置的结构，但对地址和密钥进行了脱敏：

```yaml
model_list:
  - model_name: qwen3.6-35b-a3b
    litellm_params:
      model: openai/qwen3.6-35b-a3b
      api_base: os.environ/QWEN36_OPENAI_BASE
      api_key: os.environ/UPSTREAM_API_KEY
    model_info:
      health_check_timeout: 5
      health_check_max_tokens: 1
      mode: chat
      max_input_tokens: 262144
      supports_vision: true
      supports_reasoning: true
      supports_function_calling: true
      supports_tool_choice: true
      supports_parallel_function_calling: true
      supports_system_messages: true
      supports_native_streaming: true
      input_cost_per_token: 0.00000005
      output_cost_per_token: 0.00000070

  - model_name: qwen3.6-35b-a3b
    litellm_params:
      model: ollama/qwen3.6:35b-mlx
      api_base: os.environ/QWEN36_OLLAMA_BASE
      api_key: os.environ/UPSTREAM_API_KEY
    model_info:
      health_check_timeout: 5
      health_check_max_tokens: 1
      mode: chat
      max_input_tokens: 262144
      supports_vision: true
      supports_reasoning: true
      supports_function_calling: true
      supports_tool_choice: true
      supports_parallel_function_calling: true
      supports_system_messages: true
      supports_native_streaming: true
      input_cost_per_token: 0.00000005
      output_cost_per_token: 0.00000070

  - model_name: qwen3.8-27b
    litellm_params:
      model: hosted_vllm/qwen3.8-27b
      api_base: os.environ/QWEN38_VLLM_BASE_1
      api_key: os.environ/UPSTREAM_API_KEY
    model_info:
      health_check_timeout: 5
      health_check_max_tokens: 1
      mode: chat
      max_input_tokens: 262144
      supports_vision: true
      supports_reasoning: true
      supports_function_calling: true
      supports_tool_choice: true
      supports_parallel_function_calling: true
      supports_system_messages: true
      supports_native_streaming: true
      input_cost_per_token: 0.00000015
      output_cost_per_token: 0.000001875

  - model_name: qwen3.8-27b
    litellm_params:
      model: hosted_vllm/qwen3.8-27b
      api_base: os.environ/QWEN38_VLLM_BASE_2
      api_key: os.environ/UPSTREAM_API_KEY
    model_info:
      health_check_timeout: 5
      health_check_max_tokens: 1
      mode: chat
      max_input_tokens: 262144
      supports_vision: true
      supports_reasoning: true
      supports_function_calling: true
      supports_tool_choice: true
      supports_parallel_function_calling: true
      supports_system_messages: true
      supports_native_streaming: true
      input_cost_per_token: 0.00000015
      output_cost_per_token: 0.000001875

  - model_name: deepseek-v4-flash-vision-exp
    litellm_params:
      model: hosted_vllm/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp
      api_base: os.environ/DEEPSEEK_VLLM_BASE
      api_key: os.environ/UPSTREAM_API_KEY
    model_info:
      health_check_timeout: 5
      health_check_max_tokens: 1
      mode: chat
      max_input_tokens: 1048576
      supports_vision: true
      supports_reasoning: true
      supports_function_calling: true
      supports_tool_choice: true
      supports_parallel_function_calling: true
      supports_system_messages: true
      supports_native_streaming: true
      input_cost_per_token: 0.0000002156
      output_cost_per_token: 0.0000006468

  - model_name: qwen3-embedding
    litellm_params:
      model: openai/qwen3-embedding
      api_base: os.environ/QWEN3_EMBEDDING_BASE
      api_key: os.environ/UPSTREAM_API_KEY
    model_info:
      health_check_timeout: 5
      health_check_max_tokens: 1
      mode: embedding
      max_input_tokens: 8192
      input_cost_per_token: 0.00000001
      output_cost_per_token: 0

router_settings:
  routing_strategy: least-busy
  num_retries: 2

general_settings:
  background_health_checks: true
  health_check_interval: 300
  enable_health_check_routing: true
  health_check_ignore_transient_errors: true

litellm_settings:
  callbacks:
    - prometheus
  turn_off_message_logging: true
  drop_params: true
```

对应的 `.env` 可以按照下面的形式准备：

```dotenv
UPSTREAM_API_KEY=替换为上游服务密钥
QWEN36_OPENAI_BASE=http://<主机地址>:11434/v1
QWEN36_OLLAMA_BASE=http://<主机地址>:11434
QWEN38_VLLM_BASE_1=http://<主机地址>:8000/v1
QWEN38_VLLM_BASE_2=http://<主机地址>:8001/v1
DEEPSEEK_VLLM_BASE=http://<主机地址>:8000/v1
QWEN3_EMBEDDING_BASE=http://<主机地址>:9997/v1
```

## 步骤二：启动 LiteLLM Proxy

可以直接安装 LiteLLM Proxy：

```bash
uv tool install "litellm[proxy]"
litellm --config ./config.yaml --port 4000
```

也可以使用 Docker。下面以当前目录中的 `config.yaml` 为例：

```bash
docker run --rm \
  -p 4000:4000 \
  -v "$(pwd)/config.yaml:/app/config.yaml" \
  --env-file .env \
  docker.litellm.ai/berriai/litellm:latest \
  --config /app/config.yaml
```

生产环境不建议长期使用浮动的 `latest` 标签，应根据测试结果固定 LiteLLM 镜像版本，避免升级后配置行为发生变化。

## 步骤三：验证模型列表

LiteLLM 默认监听 `4000` 端口。启动后可以查看模型列表：

```bash
curl http://localhost:4000/v1/models
```

返回结果中的模型名称来自 `model_list` 的 `model_name`，而不是后端服务的原始模型名称。

## 步骤四：测试对话模型

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3.8-27b",
    "messages": [
      {"role": "user", "content": "你好，请介绍一下你自己。"}
    ]
  }'
```

虽然 `qwen3.8-27b` 在配置中出现了两次，但客户端只使用同一个公开名称。LiteLLM 会按照 `least-busy` 策略选择当前负载较低的部署。

## 步骤五：测试 Embedding 模型

```bash
curl http://localhost:4000/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-embedding",
    "input": "LiteLLM 统一模型网关"
  }'
```

`qwen3-embedding` 的 `mode` 被设置为 `embedding`，因此 LiteLLM 在调用和健康检查时会使用 Embedding 接口，而不是聊天接口。

## 步骤六：检查健康状态和监控指标

手动检查所有模型的健康状态：

```bash
curl http://localhost:4000/health
```

启用 Prometheus 回调后，可以查看指标端点：

```bash
curl http://localhost:4000/metrics
```

如果后续配置了 `master_key`，访问这些端点时需要根据接口要求携带 LiteLLM 的认证信息。

# 配置项说明

## `model_name`：对外公开的模型名称

`model_name` 是客户端调用 LiteLLM 时使用的名称，也可以理解为模型组名称。

配置中有两个同名模型组：

| `model_name` | 部署数量 | 实际作用 |
| --- | ---: | --- |
| `qwen3.6-35b-a3b` | 2 | 在 OpenAI 兼容接口和 Ollama 接口之间进行路由 |
| `qwen3.8-27b` | 2 | 在两个 vLLM 服务实例之间进行路由 |

`deepseek-v4-flash-vision-exp` 和 `qwen3-embedding` 各自只有一个部署，因此没有同组实例可以分担流量。即使设置了 `least-busy`，单实例模型仍然只能发送到唯一的后端。

原配置还保留了一个被完整注释的 `qwen3.8-flash-next` 条目。YAML 注释不会被 LiteLLM 加载，因此它目前只是备用配置模板，不会出现在 `/v1/models` 中，也不会参与路由。

> [!WARNING]
> 原配置中第二组注释写的是“Qwen3.5”，但它的 `model_name` 和后端模型实际都是 `qwen3.6`。如果原意是接入 Qwen3.5，需要修改真实模型名称；如果原意是为 Qwen3.6 增加第二个部署，则应把注释同步改为 Qwen3.6。

## `litellm_params`：实际请求参数

`litellm_params` 中的内容决定 LiteLLM 如何连接上游模型服务。

| 配置项 | 作用 |
| --- | --- |
| `model` | 指定提供商和真实模型名称，通常使用 `提供商/模型名` 格式 |
| `api_base` | 上游推理服务的 API 根地址 |
| `api_key` | LiteLLM 访问上游服务时使用的密钥 |

当前配置使用了三种提供商前缀：

- `openai/`：将后端当作 OpenAI 兼容服务访问，地址一般包含 `/v1`。
- `ollama/`：使用 LiteLLM 的 Ollama 适配方式，`api_base` 通常指向 Ollama 服务根地址。
- `hosted_vllm/`：将后端标记为自托管 vLLM 服务，地址指向 vLLM 的 OpenAI 兼容接口。

配置中的 `api_key` 是访问上游模型服务的凭据，不等同于客户端访问 LiteLLM 的网关密钥。部分本地 OpenAI 兼容服务不验证密钥，但客户端或适配层仍可能要求传入一个非空值。

## `model_info`：模型元数据

`model_info` 用于描述模型能力、上下文限制、健康检查方式和参考成本。

| 配置项 | 作用 |
| --- | --- |
| `mode` | 指定模型类型；`chat` 使用对话接口，`embedding` 使用向量接口 |
| `max_input_tokens` | 声明最大输入 Token 数，供模型信息和相关预检查使用 |
| `health_check_timeout` | 单次模型健康检查的超时时间，当前设置为 `5` 秒 |
| `health_check_max_tokens` | 健康检查最多生成的 Token 数，当前设置为 `1` |
| `supports_vision` | 声明模型是否支持图片输入 |
| `supports_reasoning` | 声明模型是否属于推理模型 |
| `supports_function_calling` | 声明是否支持函数或工具调用 |
| `supports_tool_choice` | 声明是否支持选择工具调用策略 |
| `supports_parallel_function_calling` | 声明是否支持并行调用多个工具 |
| `supports_system_messages` | 声明是否支持系统消息 |
| `supports_native_streaming` | 声明是否支持原生流式输出 |

这些 `supports_*` 字段是能力声明，不会自动让后端获得对应能力。只有模型、推理框架和接口实现本身确实支持时，才应该设置为 `true`。

同样，`max_input_tokens` 只是向 LiteLLM 描述限制，不会修改 vLLM、Ollama 或 llama.cpp 启动时设置的真实上下文长度。两边配置不一致时，最终仍以上游服务实际能够处理的长度为准。

## 参考成本配置

`input_cost_per_token` 和 `output_cost_per_token` 用于估算请求成本。即使模型部署在本地，也可以填写一个参考价格，用于统一统计资源消耗。

根据当前配置换算，每百万 Token 的参考价格如下：

| 模型 | 输入成本 | 输出成本 |
| --- | ---: | ---: |
| `qwen3.6-35b-a3b` | `$0.05 / 1M tokens` | `$0.70 / 1M tokens` |
| `qwen3.8-27b` | `$0.15 / 1M tokens` | `$1.875 / 1M tokens` |
| `deepseek-v4-flash-vision-exp` | `$0.2156 / 1M tokens` | `$0.6468 / 1M tokens` |
| `qwen3-embedding` | `$0.01 / 1M tokens` | `$0` |

`qwen3-embedding` 没有输出 Token，因此将 `output_cost_per_token` 设置为 `0`。

> [!NOTE]
> 当前配置把自定义价格放在 `model_info` 中，部分 LiteLLM 功能可以从模型元数据读取这些值。不过，当前官方路由文档在“自定义输入/输出价格”示例中将它们放在 `litellm_params` 下。如果后续要依赖成本路由、预算控制或严格的费用统计，应该结合所使用的 LiteLLM 版本进行验证，必要时把价格字段移动到 `litellm_params`。

## `routing_strategy: least-busy`

`least-busy` 会在同一个 `model_name` 对应的多个健康部署中，优先选择当前较空闲的实例。

这项配置对 `qwen3.6-35b-a3b` 和 `qwen3.8-27b` 有实际作用，因为它们各自都有两个部署。它适合后端实例性能接近、希望根据当前并发动态分流的场景。

## `num_retries: 2`

当上游请求失败时，LiteLLM 最多再重试两次。一次原始请求加两次重试，最多可能产生三次上游尝试。

重试可以缓解临时网络故障或短暂服务异常，但也会增加失败请求的最终等待时间，并可能在后端过载时进一步增加压力。

## 后台健康检查

健康检查相关配置如下：

```yaml
general_settings:
  background_health_checks: true
  health_check_interval: 300
  enable_health_check_routing: true
  health_check_ignore_transient_errors: true
```

各项配置的作用：

- `background_health_checks: true`：在后台定期探测各个模型部署。
- `health_check_interval: 300`：每 `300` 秒，也就是每 `5` 分钟执行一轮检查。
- `enable_health_check_routing: true`：路由时避开被健康检查判定为异常的部署。
- `health_check_ignore_transient_errors: true`：忽略健康检查中的 HTTP `408` 和 `429`，避免因为临时超时或限流直接摘除部署。

这套设置的目标是只对较明确的故障进行隔离，同时容忍短暂的过载。代价是发生 `408` 或 `429` 时，该部署仍可能继续接收业务请求。

## Prometheus 回调

```yaml
litellm_settings:
  callbacks:
    - prometheus
```

启用后，LiteLLM 会提供 `/metrics` 端点，Prometheus 可以从这里采集请求量、Token 使用量、延迟和错误等指标。

如果 LiteLLM 使用多个 Worker，官方文档要求配置 `PROMETHEUS_MULTIPROC_DIR`，用于聚合不同进程产生的指标文件。

## `turn_off_message_logging: true`

该配置会阻止 LiteLLM 将 Prompt 和模型响应正文发送给日志回调，但模型名称、Token 数量、耗时和费用等元数据仍然可以保留。

这适合处理隐私内容的场景，但它并不等于关闭所有访问日志或错误日志。

## `drop_params: true`

不同模型后端支持的 OpenAI 参数并不完全相同。开启 `drop_params` 后，LiteLLM 遇到上游不支持的可选参数时，会尝试丢弃该参数，而不是直接抛出 `UnsupportedParamsError`。

这样可以提高多后端统一接入时的兼容性，但也可能让某个参数没有真正生效。排查生成效果差异时，需要确认参数是否被 LiteLLM 丢弃。

# 常见问题

## 健康检查把正常的推理模型标记为异常

当前配置将所有模型的 `health_check_max_tokens` 设置为 `1`。这样可以减少健康检查的生成开销，但对推理模型来说，`1` 个 Token 可能不足以完成一次有效响应，最终导致健康检查失败。

当前 LiteLLM 官方文档给出的默认值是 `16`，并特别说明推理模型可能需要更高的健康检查 Token 上限。如果出现误判，可以先改为：

```yaml
model_info:
  health_check_max_tokens: 16
```

也可以根据模型特点分别设置推理模型和非推理模型的健康检查上限。

## 两个同名模型是否会互相覆盖

不会。LiteLLM 会把同一个 `model_name` 下的多个条目视为多个部署，并由 Router 进行选择。只有一个条目时才不存在同组负载均衡。

## `api_base` 是否需要包含 `/v1`

这取决于提供商适配方式和上游服务的接口格式：

- 使用 `openai/` 或 `hosted_vllm/` 接入 OpenAI 兼容服务时，通常使用带 `/v1` 的 API 地址。
- 使用 `ollama/` 适配器时，通常填写 Ollama 的服务根地址，不额外添加 `/v1`。

如果路径配置错误，常见现象是返回 `404`，或者实际请求路径中出现重复的 `/v1/v1`。

## 能看到模型，但请求仍然失败

`/v1/models` 展示的是 LiteLLM 已加载的配置，不代表每个上游部署一定可用。应继续检查：

1. 使用 `/health` 查看模型健康状态。
2. 确认 LiteLLM 所在主机能够访问对应的内网地址和端口。
3. 确认提供商前缀与上游接口类型匹配。
4. 确认真实模型名称与上游服务启动时的模型名称一致。
5. 使用 `--detailed_debug` 临时启动 LiteLLM，观察完整的路由和错误信息。

## 网关是否可以直接暴露到公网

当前参考配置没有设置 `master_key`，因此不应直接将 `4000` 端口暴露到公网。如果需要跨主机或公网访问，至少应增加 LiteLLM 认证，并配合防火墙、反向代理和 TLS。

可以通过环境变量引用网关主密钥：

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

这里的 `master_key` 用于客户端访问 LiteLLM，与各个 `litellm_params.api_key` 中的上游服务密钥是两套不同的认证关系。

# 总结

这份配置的核心作用，是将多个 Ollama、vLLM 和 llama.cpp 模型服务统一接入 LiteLLM，并通过同名 `model_name` 形成模型组。客户端只需要记住 LiteLLM 的地址和公开模型名称，不需要了解每个后端的真实地址。

其中，`least-busy` 负责在同组部署之间分配流量，后台健康检查负责提前识别异常实例，`num_retries` 用于处理临时失败，Prometheus 回调用于监控，`turn_off_message_logging` 和 `drop_params` 则分别兼顾隐私与接口兼容性。

实际使用时需要重点关注三个问题：能力字段必须与真实后端一致、推理模型的健康检查 Token 上限不能过低、对外提供服务前必须补充网关认证。

# 参考链接

- [LiteLLM 官方文档](https://docs.litellm.ai/)
- [LiteLLM 路由与负载均衡](https://docs.litellm.ai/docs/routing)
- [LiteLLM 健康检查](https://docs.litellm.ai/docs/proxy/health)
- [LiteLLM 健康检查驱动路由](https://docs.litellm.ai/docs/proxy/health_check_routing)
- [LiteLLM Prometheus 指标](https://docs.litellm.ai/docs/proxy/prometheus)
- [LiteLLM 日志配置](https://docs.litellm.ai/docs/proxy/logging)
- [LiteLLM 丢弃不支持的参数](https://docs.litellm.ai/docs/completion/drop_params)
- 相关笔记：[[Ollama初识]]、[[Vllm部署大模型]]、[[llama.cpp部署大模型]]
