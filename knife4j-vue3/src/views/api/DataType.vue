<template>
  <a-tooltip :title="constraints"><code>{{ type }}</code></a-tooltip>
</template>
<script setup>
// 从 Knife4j DataType 组件演进，直接展示 3.2 Schema 的联合类型和约束。
import { computed } from 'vue'
import { schemaType, resolveSchema } from '../../core/openapi32.js'
const props = defineProps({ doc: { type: Object, required: true }, schema: { type: [Object, Boolean], default: () => ({}) } })
const type = computed(() => schemaType(props.doc, props.schema))
const constraints = computed(() => JSON.stringify(resolveSchema(props.doc, props.schema), null, 2))
</script>
