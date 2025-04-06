<template>
  <div class="ai-assistant-page">
    <div class="page-header">
      <h1>启明隅AI学习助手</h1>
      <p class="page-description">
        智能学习伙伴，为您提供个性化的学习支持和解答
      </p>
    </div>

    <div class="ai-tools-section">
      <div class="section-header">
        <h2>AI学习工具</h2>
        <p>选择合适的工具开始你的学习之旅</p>
      </div>

      <div class="ai-tools-grid">
        <AIToolCard v-for="tool in aiTools" :key="tool.id" :tool="tool" />
      </div>
    </div>

    <div class="recent-chats-section">
      <div class="section-header">
        <h2>最近会话</h2>
        <router-link to="/student/ai/history" class="view-all-link">
          查看全部 <i class="fas fa-chevron-right"></i>
        </router-link>
      </div>

      <div class="recent-chats-list">
        <div v-if="loading" class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>加载最近会话...</span>
        </div>
        <div v-else-if="error" class="error">
          <i class="fas fa-exclamation-circle"></i>
          <span>{{ error }}</span>
        </div>
        <div v-else-if="recentChats.length === 0" class="no-chats">
          <i class="fas fa-comment-slash"></i>
          <p>暂无历史会话</p>
          <router-link to="/student/ai/new" class="start-chat-btn">
            开始第一次对话
          </router-link>
        </div>
        <div v-else class="chats-grid">
          <router-link
            v-for="chat in recentChats"
            :key="chat._id"
            :to="`/student/ai/chat/${chat._id}`"
            class="chat-card"
          >
            <div class="chat-card-header">
              <div class="chat-title">{{ chat.title }}</div>
              <div class="chat-subject">{{ chat.subject }}</div>
            </div>
            <div class="chat-card-footer">
              <div class="chat-time">
                <i class="far fa-clock"></i>
                {{ formatDate(chat.updatedAt) }}
              </div>
              <div class="chat-action">
                <span>继续对话</span>
                <i class="fas fa-arrow-right"></i>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>

    <div class="ai-features-section">
      <div class="section-header">
        <h2>启明助手能做什么？</h2>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-question-circle"></i>
          </div>
          <h3>解答问题</h3>
          <p>启明助手能提供各学科知识问题的准确答案和详细解释</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-chalkboard-teacher"></i>
          </div>
          <h3>知识讲解</h3>
          <p>以通俗易懂的方式解释复杂概念和原理</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-edit"></i>
          </div>
          <h3>作业辅导</h3>
          <p>提供解题思路和方法，帮助完成作业</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-book"></i>
          </div>
          <h3>学习资料</h3>
          <p>根据需求生成个性化学习资料和复习提纲</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import AIToolCard from '../../components/ai/AIToolCard.vue'
import { getAiChats } from '../../services/aiService'

export default {
  name: 'AiAssistant',
  components: {
    AIToolCard
  },
  setup() {
    const recentChats = ref([])
    const loading = ref(true)
    const error = ref('')

    // AI学习工具列表
    const aiTools = [
      {
        id: 'ai-chat',
        title: '启明助手对话',
        description: '向启明助手提问，获取学习帮助和知识解答',
        icon: 'fas fa-comments',
        path: '/student/ai/new',
        color: '#4285f4'
      },
      {
        id: 'exercise-generator',
        title: '启明练习生成器',
        description: '根据需求生成各科目练习题和答案',
        icon: 'fas fa-tasks',
        path: '/student/ai/tools/exercises',
        color: '#ea4335'
      },
      {
        id: 'study-planner',
        title: '学习计划制定',
        description: '根据目标和时间生成个性化学习计划',
        icon: 'fas fa-calendar-alt',
        path: '/student/ai/tools/planner',
        color: '#34a853'
      },
      {
        id: 'concept-explainer',
        title: '概念解析器',
        description: '深入浅出地解释复杂学术概念',
        icon: 'fas fa-lightbulb',
        path: '/student/ai/tools/concepts',
        color: '#fbbc05'
      },
      {
        id: 'essay-helper',
        title: '作文助手',
        description: '获取写作思路、大纲和修改建议',
        icon: 'fas fa-pen-fancy',
        path: '/student/ai/tools/essay',
        color: '#673ab7'
      },
      {
        id: 'translation-helper',
        title: '翻译助手',
        description: '准确翻译并解释语言知识点',
        icon: 'fas fa-language',
        path: '/student/ai/tools/translation',
        color: '#009688'
      }
    ]

    // 加载最近的会话
    onMounted(async () => {
      try {
        loading.value = true
        const result = await getAiChats(1, 5) // 只获取最近5条
        recentChats.value = result.data
        loading.value = false
      } catch (err) {
        error.value = '加载最近会话失败'
        loading.value = false
        console.error('获取最近会话错误:', err)
      }
    })

    // 格式化日期
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return {
      recentChats,
      loading,
      error,
      aiTools,
      formatDate
    }
  }
}
</script> 