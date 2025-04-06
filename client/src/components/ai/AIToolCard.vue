<template>
  <router-link :to="tool.path" class="ai-tool-card" :style="{ backgroundColor: tool.color }">
    <div class="tool-icon">
      <i :class="tool.icon"></i>
    </div>
    <div class="tool-info">
      <h3 class="tool-title">{{ tool.title }}</h3>
      <p class="tool-description">{{ tool.description }}</p>
    </div>
  </router-link>
</template>

<script>
export default {
  name: 'AIToolCard',
  props: {
    tool: {
      type: Object,
      required: true
    }
  }
}
</script> 