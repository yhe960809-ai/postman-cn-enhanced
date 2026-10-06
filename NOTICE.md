# 来源与授权

本项目是非官方的本地界面汉化工具，与 Postman, Inc. 无隶属关系。Postman 商标及原程序属于其权利人。仓库和发行包不包含 Postman 程序、ASAR、用户工作区或请求数据。

以下模块与相关基础测试改编自 [zipenglu1/postman-cn-modern](https://github.com/zipenglu1/postman-cn-modern)，基于提交 `56915d1e5f599b4c4e619497bbd6d054335a2b74`：`asarAdapter.js`、`dictionary.js`、`fileRules.js`、`patcher.js`、`runtime.js`。保留其 MIT 许可证及版权声明。`patcher.js` 在其基础上增加动态变量、长文本、输入提示和文档标题翻译。

本仓库的独立新增部分包括 CLI、保留旧文件的安装恢复流程、动态翻译模块、增补词条、隐私说明及相应新增测试，同样采用 MIT 许可证。文件扫描已替换为不跟随目录链接的本地遍历，移除了原有 fast-glob 依赖。

上游词库的生成流程包含来自 `hlmd/Postman-cn` 的历史材料；上游 NOTICE 明确说明该历史材料没有清晰的许可证。本仓库不分发上游完整基础词库、PHP 历史词库或其生成脚本。所附词库仅包含本次独立编写的新增/修订中文译文及独立编写的常用界面词条，英文来源为 Postman 界面中的待翻译短语。没有复制界面资源文件或官方文档。

`--base-dictionary` 允许使用者在本地合并自行取得的可信词库。该文件不会进入本项目的发行包，其来源、许可和适用版本需要使用者自行确认。

本工具仅修改本地界面显示，不绕过登录、授权、付费功能或服务限制。
