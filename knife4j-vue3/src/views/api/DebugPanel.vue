<template>
  <div class="debug-panel">
    <a-form layout="vertical">
      <a-form-item v-for="p in operation.parameters" :key="p.in + ':' + p.name" :label="p.name + ' · ' + p.in" :required="p.required">
        <a-input v-model:value="values[p.in + ':' + p.name]" :placeholder="p.description || p.name" :disabled="p.in === 'cookie'" />
        <small v-if="p.in === 'cookie'">Cookie 使用当前浏览器会话，业务登录后自动携带。</small>
      </a-form-item>
      <template v-if="mediaTypes.length">
        <a-form-item :label="t('请求媒体类型')"><a-select v-model:value="media" :options="mediaTypes.map(value => ({ value }))" @change="resetBody" /></a-form-item>
        <a-form-item v-if="exampleOptions.length" :label="t('请求示例')"><a-select v-model:value="exampleName" :options="exampleOptions" @change="selectExample" /></a-form-item>
        <template v-if="media.includes('form')"><a-form-item v-for="(field, name) in formProperties" :key="name" :label="name">
          <input v-if="isFile(field)" type="file" :aria-label="name" @change="files[name] = $event.target.files[0]" />
          <a-input v-else v-model:value="formValues[name]" :aria-label="name" />
        </a-form-item></template>
        <EditorShow v-else :value="body" @change="body = $event" />
      </template>
      <a-collapse class="credentials"><a-collapse-panel key="auth" :header="t('业务接口认证（与文档访问凭据独立）')">
        <a-select v-model:value="auth.mode" :options="authModes" style="width:100%" />
        <template v-if="auth.mode === 'basic'"><a-input v-model:value="auth.username" :placeholder="t('用户名')" /><a-input-password v-model:value="auth.password" :placeholder="t('密码')" /></template>
        <a-input v-if="auth.mode === 'token'" v-model:value="auth.header" :placeholder="t('请求头名称')" />
        <a-input-password v-if="['bearer','token'].includes(auth.mode)" v-model:value="auth.token" placeholder="Token" />
      </a-collapse-panel></a-collapse>
      <a-space><a-button type="primary" :loading="sending" @click="send">{{ t('发送请求') }}</a-button><a-button v-if="sending" @click="controller?.abort()">{{ t('取消') }}</a-button><a-button @click="copyCurl">{{ t('复制 cURL') }}</a-button><a-checkbox v-model:checked="includeCredentials">{{ t('包含认证头') }}</a-checkbox></a-space>
    </a-form>
    <a-alert v-if="error" :message="error" type="error" show-icon class="notice" />
    <section v-if="result" class="response"><h2>{{ t('响应 ') }}<a-tag :color="result.ok ? 'green' : 'red'">{{ result.status }}</a-tag><small>{{ result.elapsed }} ms</small></h2>
      <a-tabs><a-tab-pane key="body" :tab="t('响应体')"><EditorShow :value="result.body" readonly /><a-button v-if="downloadURL" :href="downloadURL" download="response.bin">{{ t('保存响应文件') }}</a-button></a-tab-pane><a-tab-pane key="headers" :tab="t('响应头')"><pre>{{ result.headers }}</pre></a-tab-pane></a-tabs>
    </section>
  </div>
</template>
<script setup>
import { t, language } from '../../core/locale.js'
import { computed, reactive, ref, onBeforeUnmount } from 'vue'
import EditorShow from './EditorShow.vue'
import { resolveSchema, exampleFor } from '../../core/openapi32.js'
import { buildRequest } from '../../core/request32.js'
const props = defineProps({ doc: Object, operation: Object, baseUrl: String })
const values = reactive({}), files = reactive({}), formValues = reactive({}), body = ref('')
const includeCredentials = ref(false)
const error = ref(''), sending = ref(false), result = ref(null), downloadURL = ref('')
let controller
const auth = reactive({ mode: 'none', username: '', password: '', token: '', header: 'X-Token' })
const authModes = [{ value: 'none', label: '无认证 / 浏览器会话' }, { value: 'basic', label: 'Basic' }, { value: 'bearer', label: 'Bearer Token' }, { value: 'token', label: '自定义 Token 请求头' }]
const requestBody = resolveSchema(props.doc, props.operation.requestBody)
const mediaTypes = Object.keys(requestBody.content || {})
const media = ref(mediaTypes[0] || '')
const exampleName = ref('')
const exampleOptions = computed(() => Object.entries(requestBody.content?.[media.value]?.examples || {}).map(([value, example]) => ({ value, label: example.summary || value })))
const formProperties = computed(() => resolveSchema(props.doc, requestBody.content?.[media.value]?.schema).properties || {})
function isFile(s) { const value = resolveSchema(props.doc, s); return value['x-goark-file'] || value.format === 'binary' }
function resetBody() { const content = requestBody.content?.[media.value]; body.value = content ? JSON.stringify(content.example ?? exampleFor(props.doc, content.schema), null, 2) : '' }
function selectExample() {
  const example = resolveSchema(props.doc, requestBody.content?.[media.value]?.examples?.[exampleName.value])
  if (example.serializedValue !== undefined) body.value = String(example.serializedValue)
  else body.value = JSON.stringify(example.dataValue ?? example.value, null, 2)
}
for (const p of props.operation.parameters || []) if (p.schema?.default !== undefined) values[p.in + ':' + p.name] = String(p.schema.default)
resetBody()
function request() {
  let data
  if (media.value.includes('multipart')) {
    data = new FormData()
    for (const [k, v] of Object.entries(formValues)) {
      const encoding = requestBody.content?.[media.value]?.encoding?.[k]
      if (encoding?.contentType?.includes('json')) { JSON.parse(v); data.append(k, new Blob([v], { type: encoding.contentType })) }
      else data.append(k, v)
    }
    for (const [k, v] of Object.entries(files)) if (v) data.append(k, v)
  }
  else if (media.value.includes('x-www-form-urlencoded')) data = new URLSearchParams(formValues).toString()
  else if (media.value) { if (media.value.includes('json') && body.value) JSON.parse(body.value); data = body.value }
  return buildRequest(props.operation, values, data, media.value, auth, props.baseUrl)
}
async function send() {
  error.value = ''; sending.value = true; controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const { url, options } = request(), started = performance.now()
    const response = await fetch(url, { ...options, signal: controller.signal })
    const blob = await response.blob(); if (downloadURL.value) URL.revokeObjectURL(downloadURL.value)
    downloadURL.value = URL.createObjectURL(blob)
    let text = blob.size > 2 * 1024 * 1024 ? '响应大于 2 MiB，请下载查看。' : await blob.text()
    try { text = JSON.stringify(JSON.parse(text), null, 2) } catch { /* 非 JSON 响应保持原始文本。 */ }
    result.value = { status: response.status, ok: response.ok, elapsed: Math.round(performance.now() - started), body: text, headers: [...response.headers].map(([k, v]) => k + ': ' + v).join('\n') }
  } catch (e) { error.value = e.name === 'AbortError' ? '请求已取消或超时' : e.message } finally { clearTimeout(timeout); sending.value = false }
}
async function copyCurl() {
  try {
    const { url, options } = request(); const quote = s => "'" + String(s).replaceAll("'", "'\\''") + "'"
    const parts = ['curl', '-X', options.method, quote(url)]
    for (const [name, value] of options.headers) { const secret = name.toLowerCase() === 'authorization' || name.toLowerCase() === auth.header.toLowerCase(); parts.push('-H', quote(name + ': ' + (secret && !includeCredentials.value ? '<REDACTED>' : value))) }
    if (options.body instanceof FormData) { for (const [k, v] of options.body) parts.push('-F', quote(k + '=' + (v instanceof File ? '@' + v.name : v))) }
    else if (options.body) parts.push('--data-raw', quote(options.body))
    await navigator.clipboard.writeText(parts.join(' '))
  } catch (e) { error.value = e.message }
}
onBeforeUnmount(() => { controller?.abort(); if (downloadURL.value) URL.revokeObjectURL(downloadURL.value) })
</script>
