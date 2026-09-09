<template>
  <article>
    <div class="eyebrow">{{ operation.tags?.join(' / ') }}</div>
    <h1>{{ operation.summary || operation.operationId }} <a-tag v-if="operation.deprecated" color="orange">{{ t('已废弃') }}</a-tag></h1>
    <div class="endpoint"><a-tag :color="operation.method === 'GET' ? 'blue' : 'green'">{{ operation.method }}</a-tag><code>{{ operation.path }}</code></div>
    <p class="description">{{ operation.description }}</p>
    <a-tabs v-model:active-key="tab">
      <a-tab-pane key="document" :tab="t('接口文档')">
        <h2>{{ t('请求参数') }}</h2>
        <a-table :columns="parameterColumns" :data-source="parameters" :pagination="false" size="small" :row-key="p => p.in + ':' + p.name">
          <template #bodyCell="{ column, record }"><DataType v-if="column.key === 'schema'" :doc="doc" :schema="record.schema" /><a-tag v-else-if="column.key === 'required'">{{ record.required ? '是' : '否' }}</a-tag></template>
        </a-table>
        <template v-if="bodyMedia.length"><h2>{{ t('请求体') }}</h2><a-tabs><a-tab-pane v-for="media in bodyMedia" :key="media" :tab="media"><SchemaView :doc="doc" :schema="requestBody.content[media].schema" /></a-tab-pane></a-tabs></template>
        <h2>{{ t('响应') }}</h2>
        <a-collapse><a-collapse-panel v-for="(response, status) in operation.responses" :key="status" :header="status + ' · ' + (response.description || '')">
          <div v-for="(content, media) in response.content" :key="media"><a-tag>{{ media }}</a-tag><SchemaView :doc="doc" :schema="content.schema || content.itemSchema" /></div>
          <pre v-if="response.headers">{{ JSON.stringify(response.headers, null, 2) }}</pre>
        </a-collapse-panel></a-collapse>
      </a-tab-pane>
      <a-tab-pane v-if="tryItOut" key="debug" :tab="t('在线调试')"><DebugPanel :doc="doc" :operation="{ ...operation, parameters }" :base-url="baseUrl" /></a-tab-pane>
      <a-tab-pane key="source" :tab="t('原始定义')"><pre>{{ JSON.stringify(operation, null, 2) }}</pre></a-tab-pane>
    </a-tabs>
  </article>
</template>
<script setup>
import { t, language } from '../../core/locale.js'
import { computed, ref } from 'vue'
import DataType from './DataType.vue'
import SchemaView from './SchemaView.vue'
import DebugPanel from './DebugPanel.vue'
import { resolveSchema } from '../../core/openapi32.js'
const props = defineProps({ doc: Object, operation: Object, baseUrl: String, tryItOut: Boolean })
const tab = ref('document')
const parameters = computed(() => (props.operation.parameters || []).map(p => { const value = resolveSchema(props.doc, p); return { ...value, schema: resolveSchema(props.doc, value.schema) } }))
const requestBody = computed(() => resolveSchema(props.doc, props.operation.requestBody))
const bodyMedia = computed(() => Object.keys(requestBody.value.content || {}))
const parameterColumns = [{ title: '参数', dataIndex: 'name' }, { title: '位置', dataIndex: 'in' }, { title: '必填', key: 'required' }, { title: '类型', key: 'schema' }, { title: '说明', dataIndex: 'description' }]
</script>
