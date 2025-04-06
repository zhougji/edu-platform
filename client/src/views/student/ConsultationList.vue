<template>
  <div class="consultation-list-page">
    <div class="consultation-list-header">
      <h1>启明隅在线咨询</h1>
      <p>与专业教师一对一交流，解决您的学习难题</p>
    </div>

    <div class="page-header">
      <h1>我的咨询</h1>
      <router-link to="/student/consultation/teachers" class="new-consultation-btn">
        <i class="fas fa-plus"></i> 新咨询
      </router-link>
    </div>

    <div class="consultations-container">
      <!-- 分类标签 -->
      <div class="consultation-tabs">
        <button v-for="tab in tabs" :key="tab.value" :class="['tab-button', activeTab === tab.value ? 'active' : '']"
          @click="activeTab = tab.value">
          {{ tab.label }}
        </button>
      </div>

      <div class="consultations-content">
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>加载咨询列表中...</p>
        </div>
        <div v-else-if="error" class="error-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>{{ error }}</p>
          <button @click="loadConsultations" class="retry-btn">
            <i class="fas fa-redo"></i> 重试
          </button>
        </div>
        <div v-else-if="consultations.length === 0" class="empty-consultations">
          <img src="/images/empty-consultation.svg" alt="暂无咨询" />
          <h3>您还没有发起过咨询</h3>
          <p>启明隅在线咨询让您与专业教师一对一交流</p>
          <router-link to="/student/consultation/teachers" class="new-consultation-btn">
            <i class="fas fa-plus-circle"></i> 寻找教师咨询
          </router-link>
        </div>
        <div v-else-if="filteredConsultations.length === 0" class="no-consultations">
          <i class="fas fa-comments"></i>
          <h3>暂无{{ activeTab !== 'all' ? `${getStatusText(activeTab)}的` : '' }}咨询记录</h3>
          <router-link to="/student/consultation/teachers" class="find-teacher-btn">
            寻找教师咨询
          </router-link>
        </div>
        <div v-else class="consultation-list">
          <div v-for="consultation in filteredConsultations" :key="consultation._id" class="consultation-card">
            <div class="card-header">
              <div class="teacher-info">
                <img :src="consultation.teacher.avatar || '/images/default-avatar.jpg'" :alt="consultation.teacher.name"
                  class="teacher-avatar" />
                <span class="teacher-name">{{ consultation.teacher.name }}</span>
              </div>
              <div :class="['status-badge', getStatusClass(consultation.status)]">
                {{ getStatusText(consultation.status) }}
              </div>
            </div>

            <div class="card-body">
              <div class="consultation-subject">
                <i class="fas fa-tag"></i>
                <span>{{ consultation.subject }}</span>
              </div>

              <div class="consultation-description">
                {{ consultation.description }}
              </div>

              <div class="consultation-time">
                <i class="far fa-clock"></i>
                <span>{{ formatDate(consultation.createdAt) }}</span>
              </div>
            </div>

            <div class="card-actions">
              <button v-if="consultation.status === 'pending'" @click="handleCancel(consultation._id)"
                class="cancel-btn">
                <i class="fas fa-times"></i> 取消咨询
              </button>

              <router-link v-if="consultation.status === 'accepted'"
                :to="`/student/consultation/room/${consultation._id}`" class="enter-room-btn">
                <i class="fas fa-door-open"></i> 进入咨询室
              </router-link>

              <router-link v-if="consultation.status === 'completed' && !consultation.studentReviewed"
                :to="`/student/consultation/completed/${consultation._id}`" class="new-request-btn">
                <i class="fas fa-redo"></i> 再次咨询
              </router-link>

              <router-link v-if="consultation.status === 'completed' && !consultation.feedback"
                :to="`/student/consultation/feedback/${consultation._id}`" class="feedback-btn">
                <i class="fas fa-star"></i> 评价咨询
              </router-link>

              <router-link :to="`/student/consultation/detail/${consultation._id}`" class="view-detail-btn">
                <i class="fas fa-eye"></i> 查看详情
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { getConsultations, cancelConsultation } from '../../services/consultationService'
import { initSocket, onConsultationStatus, onConsultationReady } from '../../services/socketService'
import { useRouter } from 'vue-router'

export default {
  name: 'ConsultationList',
  setup() {
    const router = useRouter()
    const consultations = ref([])
    const loading = ref(true)
    const error = ref('')
    const activeTab = ref('all')

    // 标签列表
    const tabs = [
      { label: '全部咨询', value: 'all' },
      { label: '待处理', value: 'pending' },
      { label: '已接受', value: 'accepted' },
      { label: '已完成', value: 'completed' },
      { label: '已取消/拒绝', value: 'canceled,rejected' }
    ]

    // 根据当前选中标签过滤咨询列表
    const filteredConsultations = computed(() => {
      if (activeTab.value === 'all') {
        return consultations.value
      }

      if (activeTab.value.includes(',')) {
        const statuses = activeTab.value.split(',')
        return consultations.value.filter(c => statuses.includes(c.status))
      }

      return consultations.value.filter(c => c.status === activeTab.value)
    })

    // 加载咨询列表
    const loadConsultations = async () => {
      try {
        loading.value = true
        error.value = ''
        const result = await getConsultations()
        consultations.value = result.data
        loading.value = false
      } catch (err) {
        error.value = '加载咨询列表失败'
        loading.value = false
        console.error('加载咨询列表错误:', err)
      }
    }

    // 取消咨询
    const handleCancel = async (id) => {
      if (!confirm('确定要取消这个咨询请求吗？')) {
        return
      }

      try {
        await cancelConsultation(id)
        // 更新列表中的咨询状态
        consultations.value = consultations.value.map(c =>
          c._id === id ? { ...c, status: 'canceled' } : c
        )
      } catch (err) {
        alert(`取消咨询失败: ${err.message}`)
        console.error('取消咨询错误:', err)
      }
    }

    // 格式化日期
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'pending': return '待处理'
        case 'accepted': return '已接受'
        case 'rejected': return '已拒绝'
        case 'completed': return '已完成'
        case 'canceled': return '已取消'
        default: return status
      }
    }

    // 获取状态样式类名
    const getStatusClass = (status) => {
      switch (status) {
        case 'pending': return 'status-pending'
        case 'accepted': return 'status-accepted'
        case 'rejected': return 'status-rejected'
        case 'completed': return 'status-completed'
        case 'canceled': return 'status-canceled'
        default: return ''
      }
    }

    // 初始化WebSocket和加载数据
    onMounted(() => {
      // 初始化Socket
      const socket = initSocket()

      // 监听咨询状态变更
      onConsultationStatus((updatedConsultation) => {
        consultations.value = consultations.value.map(c =>
          c._id === updatedConsultation._id ? updatedConsultation : c
        )
      })

      // 监听咨询准备就绪事件
      onConsultationReady((consultationId) => {
        // 更新状态
        consultations.value = consultations.value.map(c =>
          c._id === consultationId ? { ...c, status: 'accepted' } : c
        )

        // 显示通知
        const notification = new Notification('咨询已准备就绪', {
          body: '您的咨询请求已被接受，点击进入咨询室',
          icon: '/logo.png'
        })

        notification.onclick = () => {
          window.focus()
          router.push(`/student/consultation/room/${consultationId}`)
        }
      })

      // 加载咨询列表
      loadConsultations()

      // 请求通知权限
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission()
      }
    })

    return {
      consultations,
      loading,
      error,
      activeTab,
      tabs,
      filteredConsultations,
      handleCancel,
      loadConsultations,
      formatDate,
      getStatusText,
      getStatusClass
    }
  }
}
</script>