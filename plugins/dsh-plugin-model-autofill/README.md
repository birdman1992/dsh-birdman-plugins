# dsh-plugin-model-autofill

在 `llm-pi-ai` 设置命名空间（`$DSH_HOME/settings.yaml`，由 Web 的 Models 页面写入）中自动补全缺失的模型显示名（`name`）、上下文窗口（`contextWindow`）和最大输出 token（`maxTokens`），数据来自 pi-ai 内置模型目录。

## 安装

```sh
dsh plugin --profile web add github:birdman1992/dsh-birdman-plugins#path:plugins/dsh-plugin-model-autofill
```

安装后重启 profile：

```sh
dsh --profile web
```
