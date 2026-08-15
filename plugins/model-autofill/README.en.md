# model-autofill

English | [中文](README.md)

## What it does

Auto-fills missing model metadata in the `llm-pi-ai` settings namespace
(`$DSH_HOME/settings.yaml`, written by the web Models page). Whenever a model
entry is missing any of these fields, they are filled in:

- display name (`name`) — from the pi-ai built-in model catalog
- context window (`contextWindow`)
- max output tokens (`maxTokens`)
- reasoning efforts (`reasoningEfforts`) — from a built-in rules table (new in v0.2)

Only missing fields are filled — values you set are never overwritten. It fires
whenever the model configuration changes and also runs one idempotent pass at
startup. Model ids with a `provider/` prefix or an OpenRouter-style `:suffix`
(e.g. `openai/gpt-5.6-luna`, `xiaomi/mimo-v2.5-pro:free`) are matched
correctly.

### The reasoningEfforts rules table

Reasoning capability is **not** discoverable the way catalog fields are —
`discoverModels` returns only id/name/contextWindow/maxTokens. So the
completion uses a **declarative rules policy**: model ids are matched against
an ordered rule table, and the first matching rule supplies the value to write.
The per-family effort sets mirror the **locally installed pi-ai provider
catalog** (`node_modules/@earendil-works/pi-ai/dist/providers/data/*.json` —
each model's own `thinkingLevelMap`), cross-checked against public docs:

| Matches | Efforts (keys = pi-ai levels, values = wire spellings) | Evidence |
| --- | --- | --- |
| `claude-` / `claude/` | `off` + `minimal/low/medium/high/xhigh/max` (minimal folds to wire `low`) | pi-ai `anthropic.json` (claude-fable-5 map `{off,xhigh,max}` + base default); [Anthropic skills](https://github.com/anthropics/skills/blob/da20c925/skills/claude-api/SKILL.md) |
| `gpt-5` / `gpt/` / `o1`/`o3`/`o4` | `off` + `minimal/low/medium/high/xhigh/max` (minimal→`low`) | pi-ai `openai-codex.json` (gpt-5.6-* map `{xhigh, max, minimal:"low"}`); [OpenAI reasoning](https://developers.openai.com/api/docs/guides/reasoning) |
| `deepseek-` / `deepseek/` | `off` + `high/max` | pi-ai `deepseek.json` (map `{high:"high", max:"max"}`, low/medium/minimal null); [DeepSeek effort](https://promptgenius.net/prompts/deepseek/thinking-mode/reasoning-effort-control) |
| `glm-` | `off` + `low/medium/high/max`; wire: low/medium/high all send `high` | pi-ai `zai.json` (glm-5.2 map `{low:"high", medium:"high", high:"high", max:"max"}`); [pi#5770 GLM-5.2 High & Max](https://github.com/earendil-works/pi/issues/5770) |
| `kimi-k3` (**must precede the kimi- general rule**) | `off` + `low/high/max` (no medium/minimal/xhigh) | pi-ai `moonshotai.json` (kimi-k3 map `{low:"low", high:"high", max:"max"}`; medium/minimal/xhigh null); [Kimi K3 effort: Max/High/Low](https://kimi-ai.chat/docs/kimi-k3-reasoning-effort/) |
| `kimi-` / `kimi/` / `moonshot` (K2.x etc.) | `off` + `minimal/low/medium/high` | pi-ai `moonshotai.json` (kimi-k2.7-code map is only `{off:null}` → base default) |
| `qwen` | `off` + `minimal/low/medium/high` | pi-ai `opencode-go.json` (qwen3.7-max, no map → base default) |
| `mimo-` | `off` + `minimal/low/medium/high` | pi-ai `xiaomi.json` (mimo-v2.5-pro `reasoning:true`, no map; `:free` is a free tier of the SAME model — it does not disable reasoning) |
| anything else | nothing (keeps pi-ai's "no metadata = provider default only" posture; no Effort row in the switcher) | — |

Key semantics (from the pi-ai implementation):

- Valueless `off:` offers an Off level that sends nothing on the wire
  (`thinking: {type: "disabled"}` in the anthropic dialect).
- **minimal folds to wire `low`**: the anthropic-messages
  `mapThinkingLevelToEffort` collapses minimal→"low" (see
  `pi-ai/dist/api/anthropic-messages.js`), so every table writes `minimal:
  "low"` instead of emitting a wire value that does not exist.
- **Undeclared levels are pinned unsupported**, so each table IS the full offer
  for its family; a level declared but not actually supported (e.g. kimi-k3's
  medium) fails at request time when selected.
- **`:free` is not "non-reasoning"**: `xiaomi/mimo-v2.5-pro:free` is the same
  model on a free tier, so the blanket `:free → false` rule is gone.

> ⚠️ Your gateway (knnns, `anthropic-messages` dialect) translates effort names
> into the underlying model's own vocabulary; **whether a level is accepted is
> gateway/model-dependent**. Declaring efforts tells the gateway "this model can
> think". If a particular model does not actually accept the thinking parameter
> (ignored or erroring), change its rule to `efforts: false` or delete that
> entry's `reasoningEfforts` from settings.yaml. The completion writes into the
> user settings layer, so everything it writes stays editable/removable — no
> lock-in.

You can replace the whole table via the plugin `config` on the model-autofill
row in your profile's `cordis.patch.yml` / `cordis.yml`:

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

> Declaring efforts tells the gateway "this model can think". If a particular
> model does not actually accept the thinking parameter (ignored or erroring),
> change its rule to `efforts: false` or delete that entry's
> `reasoningEfforts` from settings.yaml. The completion writes into the user
> settings layer, so everything it writes stays editable/removable — no lock-in.

## Install

Published to npm — install directly:

```sh
dsh plugin --profile web add @birdman1992/model-autofill
```

Or install directly from GitHub:

```sh
dsh plugin --profile web add github:birdman1992/dsh-birdman-plugins#path:plugins/model-autofill
```

Restart the profile afterwards:

```sh
dsh --profile web
```

> If you previously installed this plugin via a `link:` dependency, first run
> `dsh plugin --profile web remove @birdman1992/model-autofill` and delete the
> manually inserted model-autofill row from `cordis.patch.yml` before running
> the install command above, to avoid inserting the same row id twice.
