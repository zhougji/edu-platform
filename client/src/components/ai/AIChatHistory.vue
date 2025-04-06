<template>
  <div v-if="!chats || chats.length === 0" class="no-chats">
    <i class="fas fa-comment-slash"></i>
    <p>暂无历史会话</p>
    <router-link to="/student/ai/new" class="new-chat-btn">
      <i class="fas fa-plus"></i> 开始新会话
    </router-link>
  </div>
  <div v-else class="ai-chat-history">
    <div class="history-header">
      <h3>历史会话</h3>
      <router-link to="/student/ai/new" class="new-chat-btn">
        <i class="fas fa-plus"></i> 新会话
      </router-link>
    </div>

    <div class="chat-list">
      <div v-for="chat in chats" :key="chat._id" :class="['chat-item', currentPath.includes(chat._id) ? 'active' : '']">
        <router-link :to="`/student/ai/chat/${chat._id}`" class="chat-link">
          <div class="chat-icon">
            <i :class="getSubjectIcon(chat.subject)"></i>
          </div>
          <div class="chat-info">
            <div class="chat-title">{{ chat.title }}</div>
            <div class="chat-meta">
              <span class="chat-subject">{{ chat.subject }}</span>
              <span class="chat-time">{{ formatDate(chat.updatedAt) }}</span>
            </div>
          </div>
        </router-link>
        <button class="delete-chat-btn" @click="onDeleteChat(chat._id)" title="删除会话">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default {
  name: 'AIChatHistory',
  props: {
    chats: {
      type: Array,
      default: () => []
    },
    onDeleteChat: {
      type: Function,
      required: true
    }
  },
  setup() {
    const route = useRoute()

    // 获取当前路径
    const currentPath = computed(() => route.path)

    // 格式化日期：显示为"x分钟前"、"x小时前"等
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
    }

    // 获取主题图标
    const getSubjectIcon = (subject) => {
      switch (subject) {
        case '数学': return 'fas fa-calculator'
        case '语文': return 'fas fa-book'
        case '英语': return 'fas fa-language'
        case '物理': return 'fas fa-atom'
        case '化学': return 'fas fa-flask'
        case '生物': return 'fas fa-dna'
        case '历史': return 'fas fa-history'
        case '地理': return 'fas fa-globe-asia'
        case '政治': return 'fas fa-balance-scale'
        default: return 'fas fa-brain'
      }
    }

    return {
      currentPath,
      formatDate,
      getSubjectIcon
    }
  }
}
</script>