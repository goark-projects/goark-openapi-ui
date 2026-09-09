<template>
  <a-textarea :value="value" :readonly="readonly" :auto-size="{ minRows: 6, maxRows: 24 }" class="json-editor" @update:value="$emit('change', $event)" aria-label="JSON 内容" />
</template>
<script setup>
// 从 Knife4j EditorShow 保留受控编辑契约，移除远程 Worker 和历史编辑器耦合。
defineProps({ value: { type: String, default: '' }, readonly: Boolean })
defineEmits(['change'])
</script>
