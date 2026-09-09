# Goark OpenAPI UI

基于 Knife4j 的独立前端仓库，只展示当前应用及其本地分组，原生对齐 OpenAPI 3.2.0。

- 活跃工程：`knife4j-vue3`，Vue 3 + Ant Design Vue。
- 源码基线：Knife4j v4.5.0；具体 fork 提交和派生文件见 [NOTICE](NOTICE)。
- 历史 Java、Vue 2 和旧启动器只用于保留上游历史，不参与 Goark 构建和分发。
- 使用者只导入 Go 依赖，由 `goark-openapi` 内嵌固定编译产物，无需 npm。

## 开发与发布

Node.js 24 环境下执行：

```sh
cd knife4j-vue3
npm ci
npm test
npm run build
npm run package
```

需要代理时为 npm 临时追加 `--proxy=http://172.16.8.171:9444 --https-proxy=http://172.16.8.171:9444`。

发布资源包含版本、源码提交、上游 v4.5.0 基线、UI 协议版本、3.2.0 支持声明、逐文件 SHA-256 和许可证。Go 模块升级页面需要显式更新产物，不会在线拉取上游资源。

## 使用行为

支持中英文控件、分组与层级标签、搜索、Schema 展开、联合与可空类型、元组、请求示例切换、表单与文件上传、JSON part、Basic/Bearer/自定义 Header、响应查看和文档下载。

文档访问凭据与业务调试凭据分离，默认只保存在页面内存；复制 cURL 默认脱敏认证头，可明确选择包含。浏览器 Cookie 使用已有业务会话，不能通过 JavaScript 任意设置 Cookie 请求头。

页面初始化使用 `/openapi-ui/config`，协议版本为 1。仅允许当前应用的文档和同源业务地址。规范中可表达但浏览器或宿主不支持的 HTTP 方法会返回明确错误，不降级为旧规范。
