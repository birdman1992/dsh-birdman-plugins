# dsh-birdman-plugins

[English](README.en.md) | 中文

Birdman 的 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) 插件集合。

## 插件一览

| 插件 | 类型 | 作用 |
| --- | --- | --- |
| [dsh-plugin-model-autofill](plugins/dsh-plugin-model-autofill) | host | 模型信息自动补全：在 `llm-pi-ai` 设置命名空间中自动补全缺失的模型显示名、上下文窗口和最大输出 token（数据来自 pi-ai 内置模型目录） |
| [dsh-plugin-workspace-artifacts](plugins/dsh-plugin-workspace-artifacts) | host + client | 产物视图：在 Web 会话视图中添加「产物」标签，浏览当前工作区文件树并查看文件内容（代码高亮 / Markdown 渲染） |

## 安装

两个插件都已发布到 npm，推荐直接通过 npm 安装：

```sh
# 安装 model-autofill（模型信息自动补全）
dsh plugin --profile web add dsh-plugin-model-autofill

# 安装 workspace-artifacts（产物视图）
dsh plugin --profile web add dsh-plugin-workspace-artifacts
```

安装后重启 profile 生效：

```sh
dsh --profile web
```

### 备选：从 GitHub 直装（无需 npm registry）

本仓库是 pnpm workspace monorepo，两个插件位于 `plugins/` 子目录。DSH 的
`dsh plugin` 命令会转发给 profile 目录里的 pnpm，因此也可以直接从 git 仓库的
子目录安装：

```sh
# 安装 model-autofill（模型信息自动补全）
dsh plugin --profile web add github:birdman1992/dsh-birdman-plugins#path:plugins/dsh-plugin-model-autofill

# 安装 workspace-artifacts（产物视图）
dsh plugin --profile web add github:birdman1992/dsh-birdman-plugins#path:plugins/dsh-plugin-workspace-artifacts
```

> git 安装拉取的是源码而非构建产物。这两个插件都是纯 JS、无 `build` 步骤，
> 因此不需要 `prepare` 脚本；若 pnpm ≥10 要求 `allowBuilds` 白名单（仅当包
> 声明了 `prepare` 脚本时），在 profile 的 `pnpm-workspace.yaml` 中放行对应
> 包名即可。

## 卸载 / 本地开发

```sh
# 从本地目录安装（调试）
dsh plugin --profile web add ./plugins/dsh-plugin-model-autofill

# 卸载
dsh plugin --profile web remove dsh-plugin-model-autofill
dsh plugin --profile web remove dsh-plugin-workspace-artifacts
```

## 插件清单要点（写给插件作者）

每个插件都是标准的 npm 包（bundle），需要：

- `package.json` 声明 `dsh.bundle.patch`（指向 `cordis.patch.yml`），
  有浏览器面的还要声明 `dsh.client` 与 `exports["./client"]`；
- `cordis.patch.yml` 把插件行插入组合树（`insert` + `name: <包名>`）。

详见官方文档：
[Package and install a plugin](https://github.com/deepseek-ai/deepseek-harness/blob/HEAD/docs/user/develop/basic/publish.md)。
