# workspace-artifacts

English | [中文](README.md)

## What it does

Artifacts view: adds an "Artifacts" tab to the web session view that browses the
current session workspace (`session.header.cwd`) and shows file contents:

- File tree: expand / collapse directories (lazy-loaded), with file sizes
- File viewer: syntax highlighting (built-in tokenizer for JS/TS/Python/Go/Rust/
  Java/C-family/Shell/YAML/JSON/SQL/Markup/CSS and more), Markdown rendering
  (headings / lists / code blocks / quotes / links)
- Large-file guard: content over 256KB is truncated automatically

**Architecture** (dual-half plugin):

- **host half** (`lib/index.js`): exposes filesystem capabilities over the
  connection RPC channel (`artifacts/workspace`, `artifacts/list`,
  `artifacts/read` endpoints on the `/rpc` channel)
- **client half** (`lib/client.js`): browser bundle that registers the
  "Artifacts" tab into the `conversation.view` slot and calls the host
  endpoints via `connection.rpc.call`

## Install

Published to npm — install directly:

```sh
dsh plugin --profile web add workspace-artifacts
```

Or install directly from GitHub:

```sh
dsh plugin --profile web add github:birdman1992/dsh-birdman-plugins#path:plugins/workspace-artifacts
```

Restart the profile afterwards:

```sh
dsh --profile web
```

Open any session — the "Artifacts" tab appears in the tab bar at the top of the
session view.
