# GitHub 汉化

将 GitHub 网页端界面翻译为简体中文的 Edge 浏览器扩展（Manifest V3）。

## 安装

1. 解压 `github-zh-edge.zip`，得到 `github-zh` 文件夹。
2. 打开 Edge，访问 `edge://extensions`。
3. 开启左下角的「开发人员模式」。
4. 点击「加载解压缩的扩展」，选择 `github-zh` 文件夹。
5. 打开 github.com，刷新页面即可。

## 使用

- 点击工具栏中的扩展图标，可开启或关闭汉化，切换后页面自动刷新。

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `manifest.json` | 扩展配置 |
| `dict.js` | 词典与正则规则 |
| `content.js` | 页面扫描与替换逻辑 |
| `popup.html` / `popup.js` | 工具栏弹窗 |

## 补充词条

在 `dict.js` 的 `GH_DICT` 中添加一行：

```js
"English text": "中文",
```

保存后在 `edge://extensions` 中点击该扩展的「重新加载」，再刷新 GitHub 即可生效。

## 注意事项

- 代码、README 正文、议题标题、提交说明等用户内容不会被翻译。
- 目前为精确匹配，未收录的文本保持英文。
- GitHub 改版后部分词条可能失效，欢迎补充。
