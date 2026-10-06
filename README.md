# Postman 中文扩充版

用于 Windows Postman Desktop **12.31.2** 的本地中文界面扩充工具。包含 2,244 条独立编写的新增、修订与常用翻译，支持动态版本/日期提示、输入框提示和较长说明。

只支持已验证的 12.31.2。其他版本会拒绝安装。界面覆盖受 Postman 远程页面变化影响，仍可能有英文；不承诺全部页面 100% 中文。

## 安装

需要 Node.js 20 或更新版本。下载本仓库源码并解压后，在项目目录运行：

```powershell
npm ci --ignore-scripts
npm test
```

找到 Postman 实际安装目录中的 `app-12.31.2` 文件夹：它应包含 `resources`。通常在 `%LOCALAPPDATA%\Postman`，某些安装在 `%ProgramData%` 下。将下面的示例路径改成自己的实际目录。

```powershell
$postmanDir = 'D:\Apps\Postman\app-12.31.2'
node bin/postman-cn.js check --install-dir "$postmanDir"
```

确认检查通过，保存正在编辑的请求并完全退出 Postman，然后安装：

```powershell
node bin/postman-cn.js install --install-dir "$postmanDir"
```

安装后手动打开该版本的 `Postman.exe`。工具不自动结束进程，也不禁用官方更新。若安装目录需要管理员权限，请用有该目录写入权限的终端运行。

## 配合已有基础词库

本仓库不分发授权不清的历史基础词库。独立使用可以翻译增补和常用文字；如已自行取得可信、兼容且可合法使用的基础词库，可在本地合并以增加覆盖范围：

```powershell
$baseDictionary = 'D:\Dictionaries\local-core.zh-CN.json'
node bin/postman-cn.js check --install-dir "$postmanDir" --base-dictionary "$baseDictionary"
node bin/postman-cn.js install --install-dir "$postmanDir" --base-dictionary "$baseDictionary"
```

基础词库需采用 `{"versionRange":"…","entries":[{"source":"Send","target":"发送","match":"literal"}]}` 格式。本项目增补优先；外部词库只用于本地界面文字匹配，不执行正则或修改应用 JavaScript。旧基础词库的来源见 [NOTICE.md](NOTICE.md)。

## 恢复英文

完全退出 Postman 后：

```powershell
node bin/postman-cn.js restore --install-dir "$postmanDir"
```

安装会保留原始 `app.asar` 备份并记录 SHA-256。恢复前验证备份；备份损坏、缺失或原文件冲突时会停止。升级/恢复的旧汉化目录也会保留，便于人工恢复，因此可能额外占用数百 MB。此工具只能直接恢复自己安装的覆盖；其他汉化工具请先使用其恢复功能。

官方更新后先确认版本；不强行套用此包，不支持修改检查来安装未验证版本。

## 隐私和授权

工具没有遥测和上传功能，仓库不包含个人账户、工作区、截图或 Postman 原程序。详见 [PRIVACY.md](PRIVACY.md)。代码和本仓库独立增补译文采用 MIT，保留上游代码署名；完整来源与词库边界见 [NOTICE.md](NOTICE.md) 和 [LICENSE](LICENSE)。
