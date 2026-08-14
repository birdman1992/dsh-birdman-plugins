# dsh-plugin-model-autofill

[English](README.en.md) | 中文

## 作用

模型信息自动补全。在 `llm-pi-ai` 设置命名空间（`$DSH_HOME/settings.yaml`，
由 Web 的 Models 页面写入）中，每当模型条目缺少以下字段时自动补全：

- 显示名（`name`）— 来自 pi-ai 内置模型目录
- 上下文窗口（`contextWindow`）
- 最大输出 token（`maxTokens`）

只补全缺失字段，绝不覆盖用户已填写的值；用户修改模型配置后自动触发，
启动时也会做一次幂等补全。模型 id 带 `provider/` 前缀或 `:suffix` 后缀
（如 `openai/gpt-5.6-luna`、`xiaomi/mimo-v2.5-pro:free`）时也能正确匹配。

## 安装

```sh
dsh plugin --profile web add github:birdman1992/dsh-birdman-plugins#path:plugins/dsh-plugin-model-autofill
```

安装后重启 profile：

```sh
dsh --profile web
```

> 如果此前已经用 `link:` 方式安装过该插件，请先执行
> `dsh plugin --profile web remove dsh-plugin-model-autofill` 并删除
> `cordis.patch.yml` 中手动插入的 model-autofill 行，再执行上面的安装命令，
> 避免重复插入同一行 id。
