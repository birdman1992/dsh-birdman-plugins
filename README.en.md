# dsh-birdman-plugins

English | [中文](README.md)

A collection of [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) plugins by Birdman.

## Plugins

| Plugin | Kind | What it does |
| --- | --- | --- |
| [model-autofill](plugins/model-autofill) | host | Auto-fills missing model metadata: display name, context window, and max output tokens in the `llm-pi-ai` settings namespace (data sourced from the pi-ai built-in model catalog) |
| [workspace-artifacts](plugins/workspace-artifacts) | host + client | Artifacts view: adds an "Artifacts" tab to the web session view to browse the current workspace file tree and view file contents (syntax highlighting / Markdown rendering) |

## Install

Both plugins are published to npm; the recommended way is to install via npm:

```sh
# Install model-autofill
dsh plugin --profile web add model-autofill

# Install workspace-artifacts (artifacts view)
dsh plugin --profile web add workspace-artifacts
```

Restart the profile after installing:

```sh
dsh --profile web
```

### Alternative: install directly from GitHub (no npm registry needed)

This repository is a pnpm workspace monorepo; both plugins live under `plugins/`.
The `dsh plugin` command forwards to pnpm inside the profile directory, so you
can also install straight from a git repository subdirectory:

```sh
# Install model-autofill
dsh plugin --profile web add github:birdman1992/dsh-birdman-plugins#path:plugins/model-autofill

# Install workspace-artifacts (artifacts view)
dsh plugin --profile web add github:birdman1992/dsh-birdman-plugins#path:plugins/workspace-artifacts
```

> A git install fetches sources, not built artifacts. Both plugins are plain
> JavaScript with no `build` step, so no `prepare` script is needed. If
> pnpm >= 10 asks for an `allowBuilds` allowlist (only when a package declares
> a `prepare` script), allow the package name in the profile's
> `pnpm-workspace.yaml`.

## Uninstall / local development

```sh
# Install from a local checkout (debugging)
dsh plugin --profile web add ./plugins/model-autofill

# Uninstall
dsh plugin --profile web remove model-autofill
dsh plugin --profile web remove workspace-artifacts
```

## Bundle manifest essentials (for plugin authors)

Each plugin is a standard npm package (a "bundle") that needs:

- `package.json` declaring `dsh.bundle.patch` (pointing to `cordis.patch.yml`),
  plus `dsh.client` and `exports["./client"]` when it has a browser half;
- `cordis.patch.yml` inserting the plugin row into the composition tree
  (`insert` + `name: <package-name>`).

See the official docs:
[Package and install a plugin](https://github.com/deepseek-ai/deepseek-harness/blob/HEAD/docs/user/develop/basic/publish.md).
