// 调试请求只发往当前应用，不提供网关代理或远程服务聚合。
import { parameterValue, queryPairs, pathValue } from './serialize32.js'
export function buildRequest(operation, values, body, mediaType, auth, baseURL) {
  let path = operation.path
  const headers = new Headers()
  const query = new URLSearchParams()
  for (const p of operation.parameters || []) {
    if (p.in === 'cookie') continue
    const input = values[`${p.in}:${p.name}`]
    const value = input === undefined || input === '' ? input : parameterValue(p, input)
    if (p.required && (value === undefined || value === '')) throw new Error(`请填写必填参数 ${p.name}`)
    if (value === undefined || value === '') continue
    if (p.in === 'path') path = path.replace(`{${p.name}}`, pathValue(p, value))
    else if (p.in === 'query') for (const [k, v] of queryPairs(p, value)) query.append(k, v)
    else if (p.in === 'header') headers.set(p.name, Array.isArray(value) ? value.join(',') : typeof value === 'object' ? Object.entries(value).flat().join(',') : value)
    else if (p.in === 'querystring') for (const [k, v] of new URLSearchParams(value)) query.append(k, v)
    else if (p.in === 'cookie') throw new Error('浏览器不允许直接设置 Cookie 请求头，请先通过业务登录获取 Cookie')
  }
  if (/\{[^}]+\}/.test(path)) throw new Error('路径参数未填完整')
  const base = new URL(baseURL, window.location.href)
  const url = new URL(base.pathname.replace(/\/$/, '') + path, base.origin)
  if (url.origin !== window.location.origin) throw new Error('当前版本只允许调试本应用接口')
  url.search = query.toString()
  if (auth.mode === 'basic') headers.set('Authorization', `Basic ${btoa(String.fromCharCode(...new TextEncoder().encode(`${auth.username}:${auth.password}`)))}`)
  if (auth.mode === 'bearer' && auth.token) headers.set('Authorization', `Bearer ${auth.token}`)
  if (auth.mode === 'token' && auth.token) headers.set(auth.header, auth.token)
  const options = { method: operation.method, headers, credentials: 'same-origin' }
  if (body !== undefined && !['GET', 'HEAD'].includes(operation.method)) {
    if (body instanceof FormData) options.body = body
    else { headers.set('Content-Type', mediaType); options.body = body }
  }
  return { url, options }
}
