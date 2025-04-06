<template>
  <div class="consultation-detail-page">
    <div class="consultation-header">
      <h1>启明隅在线咨询 - 详情</h1>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>加载咨询详情中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ error }}</p>
      <router-link to="/student/consultations" class="back-button">
        返回咨询列表
      </router-link>
    </div>

    <div v-else class="consultation-content">
      <div class="detail-card">
        <div class="card-header">
          <h2>咨询信息</h2>
          <div :class="['status-badge', getStatusClass(consultation.status)]">
            {{ getStatusBadge(consultation.status) }}
          </div>
        </div>

        <div class="detail-info">
          <div class="info-item">
            <span class="info-label">科目:</span>
            <span class="info-value">{{ consultation.subject }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">主题:</span>
            <span class="info-value">{{ consultation.title }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">描述:</span>
            <p class="info-value description">{{ consultation.description }}</p>
          </div>

          <div class="info-item">
            <span class="info-label">教师:</span>
            <div class="teacher-info">
              <img :src="consultation.teacher.avatar || '/images/default-avatar.jpg'" :alt="consultation.teacher.name"
                class="teacher-avatar" />
              <span class="teacher-name">{{ consultation.teacher.name }}</span>
            </div>
          </div>

          <div class="info-item">
            <span class="info-label">创建时间:</span>
            <span class="info-value">{{ formatDate(consultation.createdAt) }}</span>
          </div>

          <div v-if="consultation.scheduledTime" class="info-item">
            <span class="info-label">预约时间:</span>
            <span class="info-value">{{ formatDate(consultation.scheduledTime) }}</span>
          </div>
        </div>

        <div v-if="consultation.status === 'rejected'" class="rejection-reason">
          <h3>拒绝原因</h3>
          <p>{{ consultation.rejectionReason || '教师未提供拒绝原因' }}</p>
        </div>

        <div class="detail-actions">
          <router-link to="/student/consultations" class="back-link">
            <i class="fas fa-arrow-left"></i> 返回列表
          </router-link>

          <div class="action-buttons">
            <button v-if="consultation.status === 'pending'" @click="handleCancel" class="cancel-btn">
              <i class="fas fa-times"></i> 取消咨询
            </button>

            <router-link v-if="consultation.status === 'accepted'"
              :to="`/student/consultation/room/${consultation._id}`" class="enter-room-btn">
              <i class="fas fa-door-open"></i> 进入咨询室
            </router-link>

            <router-link v-if="consultation.status === 'completed' && !consultation.feedback"
              :to="`/student/consultation/feedback/${consultation._id}`" class="feedback-btn">
              <i class="fas fa-star"></i> 评价咨询
            </router-link>
          </div>
        </div>
      </div>

      <div v-if="consultation.feedback" class="feedback-card">
        <h2>我的评价</h2>
        <div class="feedback-content">
          <div class="rating">
            <span class="rating-label">评分:</span>
            <div class="stars">
              <i v-for="i in 5" :key="i"
                :class="['fas', i <= consultation.feedback.rating ? 'fa-star' : 'fa-star-o']"></i>
            </div>
            <span class="rating-value">{{ consultation.feedback.rating }}/5</span>
          </div>

          <div v-if="consultation.feedback.comment" class="comment">
            <span class="comment-label">评价内容:</span>
            <p class="comment-text">{{ consultation.feedback.comment }}</p>
          </div>

          <div class="feedback-time">
            <i class="far fa-clock"></i>
            <span>评价时间: {{ formatDate(consultation.feedback.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getConsultationById, cancelConsultation } from '../../services/consultationService'

export default {
  name: 'ConsultationDetail',
  setup() {
    const route = useRoute()
    const { id } = route.params

    const consultation = ref(null)
    const loading = ref(true)
    const error = ref('')

    // 加载咨询详情
    onMounted(async () => {
      try {
        loading.value = true
        const consultationData = await getConsultationById(id)
        consultation.value = consultationData
        loading.value = false
      } catch (err) {
        error.value = err.message || '加载咨询详情失败'
        loading.value = false
        console.error('加载咨询详情错误:', err)
      }
    })

    // 取消咨询请求
    const handleCancel = async () => {
      if (!confirm('确定要取消这个咨询请求吗？')) {
        return
      }

      try {
        await cancelConsultation(id)
        consultation.value.status = 'canceled'
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
        case 'pending': return '等待教师接受'
        case 'accepted': return '教师已接受'
        case 'rejected': return '教师已婉拒'
        case 'completed': return '咨询已完成'
        case 'canceled': return '咨询已取消'
        default: return status
      }
    }

    // 获取状态标志
    const getStatusBadge = (status) => {
      switch (status) {
        case 'pending':
          return '等待教师接受'
        case 'accepted':
          return '教师已接受'
        case 'rejected':
          return '教师已婉拒'
        case 'completed':
          return '咨询已完成'
        case 'canceled':
          return '咨询已取消'
        default:
          return status
      }
    }

    // 获取状态类名
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

    return {
      consultation,
      loading,
      error,
      handleCancel,
      formatDate,
      getStatusText,
      getStatusBadge,
      getStatusClass
    }
  }
}
</script>