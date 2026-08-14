# workspace-artifacts

[English](README.en.md) | 中文

## 作用

产物视图（Artifacts）：在 Web 会话视图中添加「产物」标签，浏览当前会话
工作区（`session.header.cwd`）的目录树并查看文件内容：

- 文件树：目录可展开 / 折叠（懒加载），显示文件大小
- 文件查看：代码自动高亮（内置分词器，支持 JS/TS/Python/Go/Rust/Java/C 系/
  Shell/YAML/JSON/SQL/Markup/CSS 等）、Markdown 渲染（标题 / 列表 / 代码块 /
  引用 / 链接）
- 大文件保护：超过 256KB 自动截断

**架构**（双面插件）：

- **host 面**（`lib/index.js`）：通过 connection RPC 通道（`/rpc` 通道的
  `artifacts/workspace`、`artifacts/list`、`artifacts/read` 端点）暴露
  文件系统能力
- **client 面**（`lib/client.js`）：浏览器 bundle，向 `conversation.view`
  槽位注册「产物」标签，通过 `connection.rpc.call` 调用 host 端点

## 安装

已发布到 npm，直接安装：

```sh
dsh plugin --profile web add @birdman1992/workspace-artifacts
```

也可以从 GitHub 直装：

```sh
dsh plugin --profile web add github:birdman1992/dsh-birdman-plugins#path:plugins/workspace-artifacts
```

安装后重启 profile：

```sh
dsh --profile web
```

打开任一会话，「产物」标签出现在会话视图顶部标签栏中。
