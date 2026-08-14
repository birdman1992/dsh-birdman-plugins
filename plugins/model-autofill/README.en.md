# model-autofill

English | [中文](README.md)

## What it does

Auto-fills missing model metadata in the `llm-pi-ai` settings namespace
(`$DSH_HOME/settings.yaml`, written by the web Models page). Whenever a model
entry is missing any of these fields, they are filled in from the pi-ai built-in
model catalog:

- display name (`name`)
- context window (`contextWindow`)
- max output tokens (`maxTokens`)

Only missing fields are filled — values you set are never overwritten. It fires
whenever the model configuration changes and also runs one idempotent pass at
startup. Model ids with a `provider/` prefix or an OpenRouter-style `:suffix`
(e.g. `openai/gpt-5.6-luna`, `xiaomi/mimo-v2.5-pro:free`) are matched
correctly.

## Install

Published to npm — install directly:

```sh
dsh plugin --profile web add model-autofill
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
> `dsh plugin --profile web remove model-autofill` and delete the
> manually inserted model-autofill row from `cordis.patch.yml` before running
> the install command above, to avoid inserting the same row id twice.
