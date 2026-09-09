import { ref } from 'vue'

// 仅翻译页面控件，业务文档原文保持应用提供的内容。
export const language = ref('zh-CN')
const english = {
  '概览与模型': 'Overview & models', '接口工作台': 'API workspace', '数据模型': 'Data models',
  '下载 JSON': 'Download JSON', '下载 YAML': 'Download YAML', '文档访问凭据': 'Documentation credentials',
  '搜索接口、路径、标签': 'Search operations, paths and tags', '用户名': 'Username', '密码': 'Password',
  'Token 请求头名称': 'Token header name', '请求头名称': 'Header name', '接口文档': 'Documentation',
  '在线调试': 'Try it out', '原始定义': 'Definition', '请求参数': 'Parameters', '请求体': 'Request body',
  '响应': 'Response', '响应体': 'Response body', '响应头': 'Response headers', '发送请求': 'Send request',
  '取消': 'Cancel', '复制 cURL': 'Copy cURL', '保存响应文件': 'Save response', '完整 Schema': 'Full schema',
  '必填': 'Required', '只读': 'Read only', '只写': 'Write only', '已废弃': 'Deprecated',
  '请求媒体类型': 'Request media type', '业务接口认证（与文档访问凭据独立）': 'API credentials (separate from documentation)',
  '凭据仅保存在当前页面内存中，刷新后清除。': 'Credentials stay in page memory and are cleared on refresh.',
  'Cookie 使用当前浏览器会话，业务登录后自动携带。': 'Cookies use the current browser session after signing in to the application.',
  '文档尚未加载，请检查访问凭据或服务配置': 'Documentation is not loaded. Check credentials or service configuration.',
  '参数': 'Parameter', '位置': 'Location', '类型': 'Type', '说明': 'Description', '字段': 'Field',
  '无需凭据': 'No credentials', '无认证 / 浏览器会话': 'None / browser session', '自定义 Token 请求头': 'Custom token header',
  '包含认证头': 'Include credentials', '请求示例': 'Request example', '默认示例': 'Default example'
}
export function t(text) { return language.value === 'en-US' ? (english[text] || text) : text }
