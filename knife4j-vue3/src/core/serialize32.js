// 根据 OpenAPI 参数 style/explode 构造序列化值。
export function parameterValue(parameter, input) {
  const schema = parameter.schema || {}
  const variant = schema.anyOf?.find(s => s.type !== 'null') || schema
  const type = Array.isArray(variant.type) ? variant.type.find(s => s !== 'null') : variant.type
  let value = input
  if (['array', 'object'].includes(type)) {
    try { value = JSON.parse(input) } catch { throw new Error(`${parameter.name} 需要有效的 JSON ${type}`) }
    if (type === 'array' && !Array.isArray(value)) throw new Error(`${parameter.name} 需要数组`)
    if (type === 'object' && (value === null || Array.isArray(value) || typeof value !== 'object')) throw new Error(`${parameter.name} 需要对象`)
  }
  if (type === 'integer' || type === 'number') {
    const number = Number(input)
    if (!Number.isFinite(number) || (type === 'integer' && !Number.isInteger(number))) throw new Error(`${parameter.name} 需要有效数字`)
    if ((variant.minimum !== undefined && number < variant.minimum) || (variant.exclusiveMinimum !== undefined && number <= variant.exclusiveMinimum) || (variant.maximum !== undefined && number > variant.maximum) || (variant.exclusiveMaximum !== undefined && number >= variant.exclusiveMaximum)) throw new Error(`${parameter.name} 超出允许范围`)
  }
  if (type === 'boolean' && !['true', 'false'].includes(String(input))) throw new Error(`${parameter.name} 只能为 true 或 false`)
  return value
}

export function queryPairs(p, value) {
  const style = p.style || 'form', explode = p.explode ?? (style === 'form')
  if (p.content) return [[p.name, typeof value === 'string' ? value : JSON.stringify(value)]]
  if (Array.isArray(value)) return explode ? value.map(v => [p.name, String(v)]) : [[p.name, value.join(style === 'spaceDelimited' ? ' ' : style === 'pipeDelimited' ? '|' : ',')]]
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
    if (style === 'deepObject') return entries.map(([k, v]) => [`${p.name}[${k}]`, String(v)])
    return explode ? entries.map(([k, v]) => [k, String(v)]) : [[p.name, entries.flat().join(',')]]
  }
  return [[p.name, String(value)]]
}

export function pathValue(p, value) {
  const style = p.style || 'simple', encode = encodeURIComponent
  let pieces
  if (Array.isArray(value)) pieces = value.map(v => encode(v))
  else if (value && typeof value === 'object') pieces = Object.entries(value).flatMap(([k, v]) => p.explode ? [`${encode(k)}=${encode(v)}`] : [encode(k), encode(v)])
  else pieces = [encode(value)]
  if (style === 'label') return '.' + pieces.join(p.explode ? '.' : ',')
  if (style === 'matrix') return ';' + (p.explode && Array.isArray(value) ? pieces.map(v => encode(p.name) + '=' + v).join(';') : encode(p.name) + '=' + pieces.join(','))
  return pieces.join(',')
}
