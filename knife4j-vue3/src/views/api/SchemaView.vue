<template>
  <div class="schema-view">
    <DataType :doc="doc" :schema="schema" />
    <p v-if="resolved.description">{{ resolved.description }}</p>
    <a-table v-if="rows.length" :data-source="rows" :columns="columns" size="small" :pagination="false" row-key="name">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'"><DataType :doc="doc" :schema="record.schema" /></template>
        <template v-else-if="column.key === 'name'"><code>{{ record.name }}</code><a-tag v-if="record.required" color="red">{{ t('必填') }}</a-tag><a-tag v-if="record.schema.readOnly">{{ t('只读') }}</a-tag><a-tag v-if="record.schema.writeOnly">{{ t('只写') }}</a-tag></template>
      </template>
      <template #expandedRowRender="{ record }"><SchemaView v-if="depth < 8" :doc="doc" :schema="record.schema" :depth="depth + 1" /></template>
    </a-table>
    <a-collapse v-if="variants.length"><a-collapse-panel v-for="(variant, i) in variants" :key="i" :header="'分支 ' + (i + 1)"><SchemaView v-if="depth < 8" :doc="doc" :schema="variant" :depth="depth + 1" /></a-collapse-panel></a-collapse>
    <details><summary>{{ t('完整 Schema') }}</summary><pre>{{ JSON.stringify(resolved, null, 2) }}</pre></details>
  </div>
</template>
<script setup>
import { t, language } from '../../core/locale.js'
import { computed } from 'vue'
import DataType from './DataType.vue'
import { resolveSchema } from '../../core/openapi32.js'
const props = defineProps({ doc: { type: Object, required: true }, schema: { type: [Object, Boolean], default: () => ({}) }, depth: { type: Number, default: 0 } })
const resolved = computed(() => resolveSchema(props.doc, props.schema))
const rows = computed(() => Object.entries(resolved.value.properties || {}).map(([name, schema]) => ({ name, schema, description: schema.description, required: resolved.value.required?.includes(name) })))
const variants = computed(() => resolved.value.anyOf || resolved.value.oneOf || resolved.value.allOf || resolved.value.prefixItems || (resolved.value.items ? [resolved.value.items] : []))
const columns = [{ title: '字段', key: 'name', dataIndex: 'name' }, { title: '类型', key: 'type' }, { title: '说明', dataIndex: 'description' }]
</script>
