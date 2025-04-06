<template>
  <div class="chat-page">
    <div class="chat-sidebar">
      <AIChatHistory :chats="chatHistory" :onDeleteChat="handleDeleteChat" />
    </div>

    <div class="chat-main">
      <div v-if="loading" class="loading-overlay">
        <i class="fas fa-spinner fa-spin"></i>
        <span>加载中...</span>
      </div>
      <div v-else-if="error" class="error-overlay">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ error }}</span>
        <router-link to="/student/ai" class="back-btn">返回AI助手</router-link>
      </div>
      <template v-else>
        <div class="chat-header">
          <div v-if="isEditingTitle" class="title-edit-form">
            <div class="title-input-group">
              <input type="text" v-model="newTitle" @keyup.enter="handleTitleUpdate" @blur="handleTitleUpdate"
                class="title-input" ref="titleInput" />
              <div class="title-actions">
                <button @click="handleTitleUpdate" class="save-btn" title="保存">
                  <i class="fas fa-check"></i>
                </button>
                <button @click="cancelTitleEdit" class="cancel-btn" title="取消">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="chat-title" @click="startEditingTitle">
            <h2>{{ chat?.title || '新会话' }}</h2>
            <button class="edit-title-btn" title="编辑标题">
              <i class="fas fa-edit"></i>
            </button>
          </div>

          <div class="chat-meta">
            <span class="chat-subject">
              <i class="fas fa-tag"></i> {{ chat?.subject || '通用' }}
            </span>
          </div>
        </div>

        <div class="chat-content">
          <AIChat :chat="chat" :onChatUpdate="handleChatUpdate" />
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AIChat from '../../components/ai/AIChat.vue'
import AIChatHistory from '../../components/ai/AIChatHistory.vue'
import { getAiChatById, getAiChats, deleteAiChat, updateAiChat } from '../../services/aiService'

export default {
  name: 'AiChatPage',
  components: {
    AIChat,
    AIChatHistory
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const titleInput = ref(null)

    const id = computed(() => route.params.id)
    const isNewChat = computed(() => id.value === 'new')

    const chat = ref(null)
    const chatHistory = ref([])
    const loading = ref(!isNewChat.value)
    const error = ref('')
    const historyLoading = ref(true)
    const isEditingTitle = ref(false)
    const newTitle = ref('')

    // 加载当前会话数据
    onMounted(async () => {
      if (isNewChat.value) {
        loading.value = false
        return
      }

      try {
        loading.value = true
        const chatData = await getAiChatById(id.value)
        chat.value = chatData
        newTitle.value = chatData.title
        loading.value = false
      } catch (err) {
        error.value = err.message || '加载会话失败'
        loading.value = false
        console.error('加载会话错误:', err)
      }

      // 加载会话历史
      try {
        historyLoading.value = true
        const result = await getAiChats()
        chatHistory.value = result.data
        historyLoading.value = false
      } catch (err) {
        console.error('加载会话历史错误:', err)
        historyLoading.value = false
      }
    })

    // 删除会话
    const handleDeleteChat = async (chatId) => {
      if (!confirm('确定要删除这个会话吗？这将无法恢复。')) {
        return
      }

      try {
        await deleteAiChat(chatId)

        // 如果删除的是当前会话，则返回AI助手主页
        if (chatId === id.value) {
          router.push('/student/ai')
          return
        }

        // 更新会话历史列表
        chatHistory.value = chatHistory.value.filter(c => c._id !== chatId)
      } catch (err) {
        alert(`删除会话失败: ${err.message}`)
        console.error('删除会话错误:', err)
      }
    }

    // 更新会话数据
    const handleChatUpdate = (updatedChat) => {
      chat.value = updatedChat

      // 如果是新会话，获取到ID后更新URL
      if (isNewChat.value && updatedChat._id) {
        router.replace(`/student/ai/chat/${updatedChat._id}`)

        // 刷新会话历史
        refreshChatHistory()
      } else {
        // 更新会话历史中的会话标题
        chatHistory.value = chatHistory.value.map(c =>
          c._id === updatedChat._id ? { ...c, title: updatedChat.title } : c
        )
      }
    }

    // 刷新会话历史
    const refreshChatHistory = async () => {
      try {
        const result = await getAiChats()
        chatHistory.value = result.data
      } catch (err) {
        console.error('刷新会话历史错误:', err)
      }
    }

    // 开始编辑标题
    const startEditingTitle = () => {
      if (!chat.value) return

      isEditingTitle.value = true
      newTitle.value = chat.value.title

      // 等待DOM更新后聚焦输入框
      nextTick(() => {
        titleInput.value.focus()
      })
    }

    // 取消编辑标题
    const cancelTitleEdit = () => {
      isEditingTitle.value = false
      newTitle.value = chat.value.title
    }

    // 更新标题
    const handleTitleUpdate = async () => {
      if (!chat.value) return

      try {
        // 只有当标题发生变化时才更新
        if (newTitle.value.trim() !== chat.value.title) {
          const updatedChat = await updateAiChat(chat.value._id, { title: newTitle.value.trim() })
          chat.value = updatedChat

          // 更新会话历史中的会话标题
          chatHistory.value = chatHistory.value.map(c =>
            c._id === updatedChat._id ? { ...c, title: updatedChat.title } : c
          )
        }

        // 退出编辑模式
        isEditingTitle.value = false
      } catch (err) {
        alert(`更新标题失败: ${err.message}`)
        console.error('更新标题错误:', err)
      }
    }

    return {
      id,
      isNewChat,
      chat,
      chatHistory,
      loading,
      error,
      historyLoading,
      isEditingTitle,
      newTitle,
      titleInput,
      handleDeleteChat,
      handleChatUpdate,
      startEditingTitle,
      cancelTitleEdit,
      handleTitleUpdate
    }
  }
}
</script>