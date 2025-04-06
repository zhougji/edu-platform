<template>
    <div class="consultation-feedback-page">
        <div class="feedback-header">
            <h1>启明隅在线咨询 - 评价反馈</h1>
            <p>您的反馈将帮助我们提供更好的服务</p>
        </div>

        <div v-if="loading" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>加载中...</p>
        </div>

        <div v-else-if="error" class="feedback-error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ error }}</span>
            <router-link to="/student/consultations" class="back-button">
                返回咨询列表
            </router-link>
        </div>

        <div v-else class="feedback-content">
            <div class="consultant-info">
                <img :src="consultation.teacher.avatar || '/images/default-avatar.jpg'" :alt="consultation.teacher.name"
                    class="teacher-avatar" />
                <div class="teacher-details">
                    <h3>{{ consultation.teacher.name }}</h3>
                    <p>{{ consultation.subject }} 教师</p>
                </div>
            </div>

            <div class="feedback-form-container">
                <div class="feedback-form-header">
                    <h2>为{{ consultation.teacher.name }}老师的咨询服务评分</h2>
                    <p>请根据此次咨询体验进行评价</p>
                </div>

                <div v-if="submitError" class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>{{ submitError }}</span>
                </div>

                <form @submit.prevent="handleSubmit" class="feedback-form">
                    <div class="rating-section">
                        <label>服务满意度</label>
                        <div class="star-rating">
                            <button v-for="n in 5" :key="n" type="button"
                                :class="['star-btn', n <= feedback.rating ? 'active' : '']"
                                @click="feedback.rating = n">
                                <i class="fas fa-star"></i>
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="comment">评价内容</label>
                        <textarea id="comment" v-model="feedback.comment" rows="5"
                            placeholder="请分享您对此次咨询的评价和建议..."></textarea>
                    </div>

                    <button type="submit" class="submit-btn" :disabled="submitting || !feedback.rating">
                        <template v-if="submitting">
                            <i class="fas fa-spinner fa-spin"></i> 提交中...
                        </template>
                        <template v-else>
                            <i class="fas fa-paper-plane"></i> 提交评价
                        </template>
                    </button>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getConsultationById, submitFeedback } from '../../services/consultationService'

export default {
    name: 'ConsultationFeedback',
    setup() {
        const route = useRoute()
        const router = useRouter()
        const { id } = route.params

        const consultation = ref(null)
        const loading = ref(true)
        const error = ref('')
        const submitting = ref(false)
        const submitError = ref('')

        const feedback = reactive({
            rating: 0,
            comment: ''
        })

        // 加载咨询详情
        onMounted(async () => {
            try {
                loading.value = true
                error.value = ''

                const data = await getConsultationById(id)

                if (data.status !== 'completed') {
                    error.value = '只能对已完成的咨询进行评价'
                    loading.value = false
                    return
                }

                consultation.value = data
                loading.value = false
            } catch (err) {
                error.value = err.message || '加载咨询详情失败'
                loading.value = false
                console.error('加载咨询详情错误:', err)
            }
        })

        // 提交评价
        const handleSubmit = async () => {
            try {
                if (!feedback.rating) {
                    submitError.value = '请选择满意度评分'
                    return
                }

                submitting.value = true
                submitError.value = ''

                await submitFeedback(id, feedback)

                // 提交成功后跳转
                router.push({
                    path: '/student/consultations',
                    query: { feedbackSuccess: 'true' }
                })
            } catch (err) {
                submitError.value = err.message || '提交评价失败，请重试'
                submitting.value = false
                console.error('提交评价错误:', err)
            }
        }

        return {
            consultation,
            loading,
            error,
            submitting,
            submitError,
            feedback,
            handleSubmit
        }
    }
}
</script>