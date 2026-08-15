# model-autofill

[English](README.en.md) | 中文

## 作用

模型信息自动补全。在 `llm-pi-ai` 设置命名空间（`$DSH_HOME/settings.yaml`，
由 Web 的 Models 页面写入）中，每当模型条目缺少以下字段时自动补全：

- 显示名（`name`）— 来自 pi-ai 内置模型目录
- 上下文窗口（`contextWindow`）
- 最大输出 token（`maxTokens`）
- 推理档位（`reasoningEfforts`）— 来自内置规则表（v0.2 新增）

只补全缺失字段，绝不覆盖用户已填写的值；用户修改模型配置后自动触发，
启动时也会做一次幂等补全。模型 id 带 `provider/` 前缀或 `:suffix` 后缀
（如 `openai/gpt-5.6-luna`、`xiaomi/mimo-v2.5-pro:free`）时也能正确匹配。

### reasoningEfforts 规则表

推理能力**不能**像目录字段那样从 `discoverModels` 查出——它只返回
id/name/contextWindow/maxTokens。因此补全采用**声明式规则策略**：按顺序
匹配 id 子串，命中即写入对应档位表。档位表以**本机安装的 pi-ai 官方
catalog**（`node_modules/@earendil-works/pi-ai/dist/providers/data/*.json`
中各模型自己的 `thinkingLevelMap`）为准，公开文档交叉验证：

| 匹配 | 档位（键 = pi-ai 档位，值 = 发给网关的 wire 拼写） | 依据 |
| --- | --- | --- |
| `claude-` / `claude/` | `off` + `minimal/low/medium/high/xhigh/max`（minimal 的 wire 折叠为 `low`） | pi-ai `anthropic.json`（claude-fable-5 map 为 `{off,xhigh,max}` + 基础档默认支持）；[Anthropic skills](https://github.com/anthropics/skills/blob/da20c925/skills/claude-api/SKILL.md) |
| `gpt-5` / `gpt/` / `o1`/`o3`/`o4` | `off` + `minimal/low/medium/high/xhigh/max`（minimal→`low`） | pi-ai `openai-codex.json`（gpt-5.6-* map 为 `{xhigh, max, minimal:"low"}`）；[OpenAI reasoning](https://developers.openai.com/api/docs/guides/reasoning) |
| `deepseek-` / `deepseek/` | `off` + `high/max` | pi-ai `deepseek.json`（map 为 `{high:"high", max:"max"}`，low/medium/minimal 均 null）；[DeepSeek reasoning effort](https://promptgenius.net/prompts/deepseek/thinking-mode/reasoning-effort-control) |
| `glm-` | `off` + `low/medium/high/max`，wire：low/medium/high 全发 `high` | pi-ai `zai.json`（glm-5.2 map 为 `{low:"high", medium:"high", high:"high", max:"max"}`）；[pi#5770 GLM-5.2 High & Max](https://github.com/earendil-works/pi/issues/5770) |
| `kimi-k3`（**必须先于 kimi- 通用规则**） | `off` + `low/high/max`（无 medium/minimal/xhigh） | pi-ai `moonshotai.json`（kimi-k3 map 为 `{low:"low", high:"high", max:"max"}`，medium/minimal/xhigh null）；[Kimi K3 effort: Max/High/Low](https://kimi-ai.chat/docs/kimi-k3-reasoning-effort/) |
| `kimi-` / `kimi/` / `moonshot`（K2.x 等） | `off` + `minimal/low/medium/high` | pi-ai `moonshotai.json`（kimi-k2.7-code map 仅 `{off:null}` → 基础档默认支持） |
| `qwen` | `off` + `minimal/low/medium/high` | pi-ai `opencode-go.json`（qwen3.7-max 无 map → 基础档默认支持） |
| `mimo-` | `off` + `minimal/low/medium/high` | pi-ai `xiaomi.json`（mimo-v2.5-pro `reasoning:true`、无 map；`:free` 只是免费档，不关闭推理） |
| 其余未命中 | 不写（保持 pi-ai 的"无元数据 = 仅提供方默认"，选择器不显示 Effort 行） | — |

关键语义（来自 pi-ai 实现）：

- **`off:` 留空** = 提供 Off 档，anthropic 方言下发 `thinking: {type: "disabled"}`。
- **minimal 的 wire 折叠为 `low`**：anthropic-messages 的
  `mapThinkingLevelToEffort` 把 minimal 折叠到 low（见
  `pi-ai/dist/api/anthropic-messages.js`），所以任何表里 minimal 的值都写
  `low`，避免发出不存在的 wire 值。
- **未声明的档位被固定为不支持**：所以每张表就是该模型族对外提供的全部
  档位；表里多写一个实际不支持的档位（如 kimi-k3 的 medium）会让用户选中
  后请求失败。
- **`:free` 不等于不支持推理**：`xiaomi/mimo-v2.5-pro:free` 是同一模型的
  免费档，推理能力不变，因此不再有 `:free → false` 的规则。

> ⚠️ 你的网关（knnns，`anthropic-messages` 方言）会把 effort 名翻译成底层
> 模型自己的词汇，**某档位能否被接受取决于网关与该模型**。声明档位等于向
> 网关声明"该模型支持思考"：若某个模型实际不接受 thinking 参数（网关忽略或
> 报错），把它的规则改为 `efforts: false`，或在 settings.yaml 里删除该条目
> 的 `reasoningEfforts` 即可。补全写进的是用户 settings 层，随时可编辑/删除，
> 没有锁定。

规则表可用插件 `config` 整体替换（在 profile 的 `cordis.patch.yml` 或
`cordis.yml` 的 model-autofill 行上加）：

```yaml
- id: model-autofill
  name: "@birdman1992/model-autofill"
  config:
    reasoning:
      rules:
        - match: ["claude-", "claude/"]
          efforts: { off: null, minimal: low, low: low, medium: medium, high: high, xhigh: xhigh, max: max }
        - match: ["deepseek-", "deepseek/"]
          efforts: { off: null, high: high, max: max }
```

> 注意：写档位等于向网关声明"该模型支持思考"。如果某个模型实际不接受
> thinking 参数（网关忽略或报错），把它的规则改为 `efforts: false` 或在
> settings.yaml 里直接删除该条目的 `reasoningEfforts` 即可。补全写进的是
> 用户 settings 层，随时可编辑/删除，没有锁定。

## 安装

已发布到 npm，直接安装：

```sh
dsh plugin --profile web add @birdman1992/model-autofill
```

也可以从 GitHub 直装：

```sh
dsh plugin --profile web add github:birdman1992/dsh-birdman-plugins#path:plugins/model-autofill
```

安装后重启 profile：

```sh
dsh --profile web
```

> 如果此前已经用 `link:` 方式安装过该插件，请先执行
> `dsh plugin --profile web remove @birdman1992/model-autofill` 并删除
> `cordis.patch.yml` 中手动插入的 model-autofill 行，再执行上面的安装命令，
> 避免重复插入同一行 id。
