<template>
  <div class="ai-chat-container">
    <div class="chat-messages" ref="messagesContainer">
      <!-- 欢迎消息 -->
      <div v-if="(!chat || !chat.messages || chat.messages.length === 0) && !isLoading" class="welcome-message">
        <div class="ai-avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="welcome-content">
          <h2>欢迎使用启明隅AI学习助手</h2>
          <p>您可以向我提问任何学习相关的问题，例如：</p>
          <div class="example-questions">
            <div class="example-question" @click="setExampleQuestion('请解释一下牛顿第二定律')">
              请解释一下牛顿第二定律
            </div>
            <div class="example-question" @click="setExampleQuestion('如何解二元一次方程组？')">
              如何解二元一次方程组？
            </div>
            <div class="example-question" @click="setExampleQuestion('帮我准备一下关于光合作用的复习提纲')">
              帮我准备一下关于光合作用的复习提纲
            </div>
          </div>
        </div>
      </div>

      <!-- 对话消息 -->
      <template v-if="chat && chat.messages">
        <div
          v-for="(msg, index) in chat.messages"
          :key="index"
          :class="['message', msg.role === 'assistant' ? 'ai-message' : 'user-message']"
        >
          <div v-if="msg.role === 'assistant'" class="ai-avatar">
            <i class="fas fa-robot"></i>
          </div>
          <div v-else class="user-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-sender">{{ msg.role === 'assistant' ? '启明助手' : '我' }}</span>
            </div>
            <div class="message-text">
              <div v-if="msg.role === 'assistant'" class="markdown-content">
                <VueMarkdown>{{ msg.content }}</VueMarkdown>
              </div>
              <div v-else>{{ msg.content }}</div>
            </div>
          </div>
        </div>
      </template>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="message ai-message">
        <div class="ai-avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-sender">启明助手</span>
          </div>
          <div class="message-text">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 错误消息 -->
      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ error }}</span>
      </div>

      <div ref="messagesEnd"></div>
    </div>

    <form class="chat-input-form" @submit.prevent="handleSubmit">
      <textarea
        ref="inputElement"
        v-model="message"
        placeholder="向启明助手提问..."
        class="chat-input"
        :disabled="isLoading"
        @keydown="handleKeyDown"
      ></textarea>
      <button
        type="submit"
        class="send-button"
        :disabled="isLoading || !message.trim()"
      >
        <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-paper-plane"></i>
        发送
      </button>
    </form>

    <div class="input-tips">
      按Enter键发送，Shift+Enter换行
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick, onMounted } from 'vue'
import { VueMarkdown } from 'vue-markdown-render'
import { sendMessage } from '../../services/aiService'

export default {
  name: 'AIChat',
  components: {
    VueMarkdown
  },
  props: {
    chat: {
      type: Object,
      default: null
    },
    onChatUpdate: {
      type: Function,
      required: true
    }
  },
  setup(props) {
    const message = ref('')
    const isLoading = ref(false)
    const error = ref('')
    const messagesEnd = ref(null)
    const inputElement = ref(null)
    const messagesContainer = ref(null)

    // 滚动到底部
    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesEnd.value) {
          messagesEnd.value.scrollIntoView({ behavior: 'smooth' })
        }
      })
    }

    // 监听消息变化，自动滚动
    watch(() => props.chat?.messages, () => {
      scrollToBottom()
    }, { deep: true })

    // 组件挂载时滚动到底部并聚焦输入框
    onMounted(() => {
      scrollToBottom()
      if (inputElement.value) {
        inputElement.value.focus()
      }
    })

    // 处理键盘事件
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    }

    // 设置示例问题
    const setExampleQuestion = (question) => {
      message.value = question
      nextTick(() => {
        if (inputElement.value) {
          inputElement.value.focus()
        }
      })
    }

    // 发送消息
    const handleSubmit = async () => {
      if (!message.value.trim() || isLoading.value) return

      const messageText = message.value.trim()
      message.value = ''
      error.value = ''

      try {
        isLoading.value = true

        // 如果有现有对话，则将消息添加到该对话
        // 否则创建新对话
        const updatedChat = await sendMessage(
          messageText,
          props.chat?._id,
          props.chat?.subject
        )

        // 通知父组件更新
        props.onChatUpdate(updatedChat)

        // 重置加载状态
        isLoading.value = false

        // 聚焦输入框
        nextTick(() => {
          if (inputElement.value) {
            inputElement.value.focus()
          }
        })
      } catch (err) {
        error.value = err.message || '发送消息失败，请重试'
        isLoading.value = false
        console.error('发送消息错误:', err)
      }
    }

    return {
      message,
      isLoading,
      error,
      messagesEnd,
      inputElement,
      messagesContainer,
      handleSubmit,
      handleKeyDown,
      setExampleQuestion
    }
  }
}
</script> 