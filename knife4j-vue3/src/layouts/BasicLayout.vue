<template>
  <a-layout class="BasicLayout">
    <a-layout-sider width="290" class="sider" breakpoint="lg" collapsed-width="0">
      <div class="brand"><strong>Goark</strong><span>API DOCUMENTATION</span></div>
      <div class="menu-controls">
        <a-select v-model:value="group" :options="groups.map(g => ({ value: g.url, label: g.displayName || g.name }))" @change="loadDocument" aria-:label="t('接口分组')" />
        <a-input v-model:value="search" :placeholder="t('搜索接口、路径、标签')" allow-clear aria-:label="t('搜索接口')" />
      </div>
      <a-menu theme="dark" mode="inline" :selected-keys="[selected]" @click="selected = $event.key">
        <a-menu-item key="overview">{{ t('概览与模型') }}</a-menu-item>
        <a-sub-menu v-for="[tag, entries] in menu" :key="tag" :title="tag">
          <a-menu-item v-for="op in entries" :key="op.operationId"><span class="method-small">{{ op.method }}</span>{{ op.summary || op.operationId }}</a-menu-item>
        </a-sub-menu>
      </a-menu>
      <div class="upstream">Based on Knife4j · OpenAPI 3.2</div>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="header">
        <span>{{ doc?.info?.title || 'Goark API 文档' }}</span>
        <a-space><a-tag color="blue">3.2.0</a-tag><a-select v-model:value="language" :options="[{value:'zh-CN',label:'简体中文'},{value:'en-US',label:'English'}]" aria-label="Language" /><a-button @click="credentialsOpen = true">{{ t('文档访问凭据') }}</a-button></a-space>
      </a-layout-header>
      <a-layout-content class="content">
        <a-alert v-if="error" :message="error" type="error" show-icon class="notice" />
        <a-spin :spinning="loading">
          <template v-if="doc">
            <OperationPanel v-if="current" :key="current.operationId" :doc="doc" :operation="current" :base-url="baseURL" :try-it-out="tryItOut" />
            <section v-else class="overview">
              <div class="eyebrow">{{ t('接口工作台') }}</div><h1>{{ doc.info.title }}</h1>
              <p>{{ doc.info.description || '浏览当前应用的接口定义、数据模型和请求示例。' }}</p>
              <a-space><a-tag>{{ doc.info.version }}</a-tag><a-tag>{{ allOperations.length }} 个接口</a-tag><a-tag>{{ Object.keys(doc.components?.schemas || {}).length }} 个模型</a-tag></a-space>
              <div class="downloads"><a-button @click="download(false)">{{ t('下载 JSON') }}</a-button><a-button @click="download(true)">{{ t('下载 YAML') }}</a-button></div>
              <h2>{{ t('数据模型') }}</h2>
              <a-collapse><a-collapse-panel v-for="(schema, name) in doc.components?.schemas" :key="name" :header="schema.title || name"><SchemaView :doc="doc" :schema="schema" /></a-collapse-panel></a-collapse>
            </section>
          </template>
          <a-empty v-else-if="!loading" :description="t('文档尚未加载，请检查访问凭据或服务配置')" />
        </a-spin>
      </a-layout-content>
    </a-layout>
    <a-modal v-model:open="credentialsOpen" title="文档访问凭据" @ok="reload">
      <p>{{ t('凭据仅保存在当前页面内存中，刷新后清除。') }}</p>
      <a-select v-model:value="docAuth.mode" :options="authModes" style="width:100%" />
      <template v-if="docAuth.mode === 'basic'"><a-input v-model:value="docAuth.username" :placeholder="t('用户名')" /><a-input-password v-model:value="docAuth.password" :placeholder="t('密码')" /></template>
      <template v-if="docAuth.mode === 'token'"><a-input v-model:value="docAuth.header" placeholder="Token 请求头名称" /></template>
      <a-input-password v-if="['bearer','token'].includes(docAuth.mode)" v-model:value="docAuth.token" placeholder="Token" />
    </a-modal>
  </a-layout>
</template>
<script setup>
import { t, language } from '../core/locale.js'
// 基于 Knife4j BasicLayout 的侧栏、分组和文档区域重构，移除跨服务与旧版规范启动器。
import { ref, reactive, computed, onMounted } from 'vue'
import OperationPanel from '../views/api/OperationPanel.vue'
import SchemaView from '../views/api/SchemaView.vue'
import { operations } from '../core/openapi32.js'
const doc = ref(null), groups = ref([]), group = ref(''), selected = ref('overview'), search = ref('')
const error = ref(''), loading = ref(false), credentialsOpen = ref(false)
const tryItOut = ref(true)
const docAuth = reactive({ mode: 'none', username: '', password: '', token: '', header: 'X-Doc-Token' })
const authModes = [{ value: 'none', label: '无需凭据' }, { value: 'basic', label: 'Basic' }, { value: 'bearer', label: 'Bearer Token' }, { value: 'token', label: '自定义 Token 请求头' }]
const contextPath = document.querySelector('meta[name="goark-context"]')?.content ?? window.location.pathname.replace(/\/[^/]*$/, '')
const baseURL = contextPath || '/'
const configURL = document.querySelector('meta[name="goark-config"]')?.content || contextPath + '/v3/api-docs/goark-config'
const allOperations = computed(() => doc.value ? operations(doc.value) : [])
const current = computed(() => allOperations.value.find(op => op.operationId === selected.value))
const menu = computed(() => {
  const map = new Map()
  for (const op of allOperations.value) {
    if (!JSON.stringify([op.path, op.summary, op.tags]).toLowerCase().includes(search.value.toLowerCase())) continue
    for (const tag of op.tags?.length ? op.tags : ['未分组']) {
      const chain = [tag], seen = new Set(chain)
      let parent = doc.value.tags?.find(t => t.name === tag)?.parent
      while (parent && !seen.has(parent)) { chain.unshift(parent); seen.add(parent); parent = doc.value.tags?.find(t => t.name === parent)?.parent }
      const label = chain.join(' / ')
      if (!map.has(label)) map.set(label, []); map.get(label).push(op)
    }
  }
  return [...map]
})
function headers() {
  const h = {}
  if (docAuth.mode === 'basic') h.Authorization = 'Basic ' + btoa(String.fromCharCode(...new TextEncoder().encode(docAuth.username + ':' + docAuth.password)))
  if (docAuth.mode === 'bearer') h.Authorization = 'Bearer ' + docAuth.token
  if (docAuth.mode === 'token') h[docAuth.header] = docAuth.token
  return h
}
function localAddress(address) {
  const url = new URL(address, location.origin)
  if (url.origin !== location.origin) throw new Error('不允许加载远程应用文档')
  return contextPath && !url.pathname.startsWith(contextPath + '/') ? contextPath + url.pathname : url.pathname
}
async function fetchDocument(url) {
  const response = await fetch(localAddress(url), { headers: headers(), credentials: 'same-origin' })
  if (!response.ok) throw new Error(response.status === 401 ? '文档需要认证，请填写文档访问凭据' : '加载文档失败：' + response.status)
  return response
}
async function loadDocument() {
  loading.value = true; error.value = ''
  try { const value = await (await fetchDocument(group.value)).json(); operations(value); doc.value = value; selected.value = 'overview' }
  catch (e) { error.value = e.message; doc.value = null } finally { loading.value = false }
}
async function reload() {
  credentialsOpen.value = false; loading.value = true; error.value = ''
  try { const config = await (await fetchDocument(configURL)).json(); if (config.protocolVersion !== 1) throw new Error('不兼容的 UI 初始化协议'); language.value = config.language || 'zh-CN'; tryItOut.value = config.tryItOutEnabled; groups.value = config.urls; group.value = groups.value[0]?.url; await loadDocument() }
  catch (e) { error.value = e.message } finally { loading.value = false }
}
async function download(yaml) {
  try {
    const data = await (await fetchDocument(group.value + (yaml ? '.yaml' : ''))).blob()
    const url = URL.createObjectURL(data), a = document.createElement('a')
    a.href = url; a.download = yaml ? 'openapi.yaml' : 'openapi.json'; a.click(); URL.revokeObjectURL(url)
  } catch (e) { error.value = e.message }
}
onMounted(reload)
</script>
