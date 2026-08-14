# dsh-plugin-workspace-artifacts

产物视图（Artifacts）：在 Web 会话视图添加「产物」标签，浏览当前会话工作区
（`session.header.cwd`）的目录树并查看文件内容——代码自动高亮、Markdown
渲染，超过 256KB 的文件自动截断。

- **host 面**（`lib/index.js`）：把文件系统能力暴露为 connection RPC 通道
  （`/rpc` 通道的 `artifacts/workspace|list|read` 端点）。
- **client 面**（`lib/client.js`）：浏览器 bundle，向 `conversation.view`
  槽位注册「产物」标签，通过 `connection.rpc.call` 调用 host 端点。

## 安装

```sh
dsh plugin --profile web add github:birdman1992/dsh-birdman-plugins#path:plugins/dsh-plugin-workspace-artifacts
```

安装后重启 profile：

```sh
dsh --profile web
```

打开任一会话，「产物」标签出现在会话视图顶部标签栏中。
