// OpenAPI 3.2 原生适配，不将输入降级成旧版 Swagger 模型。
export function operations(doc) {
  if (!/^3\.2\./.test(doc.openapi || '')) throw new Error('仅支持 OpenAPI 3.2 文档')
  const out = []
  const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace', 'query'])
  for (const [path, item] of Object.entries(doc.paths || {})) {
    for (const [method, value] of Object.entries(item)) {
      if (methods.has(method)) out.push({ ...value, path, method: method.toUpperCase(), parameters: [...(item.parameters || []), ...(value.parameters || [])] })
    }
    for (const [method, value] of Object.entries(item.additionalOperations || {})) out.push({ ...value, path, method, parameters: [...(item.parameters || []), ...(value.parameters || [])] })
  }
  return out
}

export function resolveSchema(doc, schema, visited = new Set()) {
  if (!schema || typeof schema !== 'object' || !schema.$ref) return schema ?? {}
  if (visited.has(schema.$ref)) return { title: schema.$ref.split('/').at(-1), 'x-recursive': true }
  if (!schema.$ref.startsWith('#/')) throw new Error('文档含未打包的外部引用')
  visited.add(schema.$ref)
  let value = doc
  for (const part of schema.$ref.slice(2).split('/')) value = value?.[part.replace(/~1/g, '/').replace(/~0/g, '~')]
  if (value === undefined) throw new Error(`模型引用不存在：${schema.$ref}`)
  const { $ref, ...siblings } = schema
  return { ...resolveSchema(doc, value, visited), ...siblings }
}

export function exampleFor(doc, schema, visited = new Set(), depth = 0) {
  if (depth > 12 || schema === false) return null
  if (schema?.$ref) { if (visited.has(schema.$ref)) return null; visited = new Set(visited).add(schema.$ref) }
  const s = resolveSchema(doc, schema)
  if (s.example !== undefined) return s.example
  if (s.examples?.length) return s.examples[0]
  if (s.default !== undefined) return s.default
  if (s.const !== undefined) return s.const
  if (s.enum?.length) return s.enum[0]
  if (s.oneOf || s.anyOf) return exampleFor(doc, (s.oneOf || s.anyOf).find(x => x.type !== 'null'), visited, depth + 1)
  if (s.allOf) return Object.assign({}, ...s.allOf.map(x => exampleFor(doc, x, visited, depth + 1)))
  const type = Array.isArray(s.type) ? s.type.find(x => x !== 'null') : s.type
  if (type === 'object' || s.properties) return Object.fromEntries(Object.entries(s.properties || {}).filter(([, v]) => !v.readOnly).map(([k, v]) => [k, exampleFor(doc, v, visited, depth + 1)]))
  if (type === 'array') return [exampleFor(doc, s.items, visited, depth + 1)]
  if (type === 'integer' || type === 'number') return s.minimum ?? 0
  if (type === 'boolean') return false
  if (type === 'null') return null
  return s.format === 'date-time' ? new Date().toISOString() : ''
}

export function schemaType(doc, schema) {
  const s = resolveSchema(doc, schema)
  if (s === false) return '不允许任何值'
  if (s.oneOf || s.anyOf) return (s.oneOf || s.anyOf).map(x => schemaType(doc, x)).join(' | ')
  if (s.allOf) return s.allOf.map(x => schemaType(doc, x)).join(' & ')
  return [s.title || (Array.isArray(s.type) ? s.type.join(' | ') : s.type) || 'any', s.format].filter(Boolean).join(' / ')
}
