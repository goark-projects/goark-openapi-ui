import test from 'node:test'
import assert from 'node:assert/strict'
import { operations, resolveSchema, exampleFor } from '../src/core/openapi32.js'

test('读取 QUERY、自定义方法以及递归模型', () => {
  const doc = { openapi: '3.2.0', paths: { '/items': { query: { operationId: 'query' }, additionalOperations: { REPORT: { operationId: 'report' } } } }, components: { schemas: { Item: { type: 'object', properties: { self: { $ref: '#/components/schemas/Item' } } } } } }
  assert.equal(operations(doc).length, 2)
  assert.equal(resolveSchema(doc, { $ref: '#/components/schemas/Item' }).type, 'object')
  assert.doesNotThrow(() => exampleFor(doc, { $ref: '#/components/schemas/Item' }))
  assert.throws(() => operations({ openapi: '3.0.0' }), /3.2/)
})
