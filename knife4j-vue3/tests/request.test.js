import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRequest } from '../src/core/request32.js'

globalThis.window = { location: { href: 'http://localhost/app/doc.html', origin: 'http://localhost' } }
test('数组使用重复查询参数，Cookie 使用浏览器会话', () => {
  const op = { method: 'GET', path: '/users/{id}', parameters: [
    { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
    { in: 'query', name: 'ids', schema: { type: 'array', items: { type: 'integer' } } },
    { in: 'cookie', name: 'session', required: true }
  ] }
  const result = buildRequest(op, { 'path:id': '1', 'query:ids': '[1,2]' }, undefined, '', { mode: 'none' }, '/app')
  assert.equal(result.url.pathname, '/app/users/1')
  assert.deepEqual(result.url.searchParams.getAll('ids'), ['1', '2'])
})
