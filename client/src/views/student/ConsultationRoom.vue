<template>
    <div class="consultation-room">
        <div v-if="loading" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>正在进入咨询室...</p>
        </div>

        <div v-else-if="error" class="error-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>{{ error }}</p>
            <router-link to="/student/consultations" class="back-button">
                返回咨询列表
            </router-link>
        </div>

        <template v-else>
            <div class="room-header">
                <div class="header-left">
                    <router-link :to="`/student/consultation/detail/${id}`" class="back-link">
                        <i class="fas fa-arrow-left"></i> 返回咨询详情
                    </router-link>
                    <h1>启明隅在线咨询室</h1>
                </div>
                <div class="header-right">
                    <div class="teacher-info">
                        <img :src="consultation.teacher.avatar || '/images/default-avatar.jpg'"
                            :alt="consultation.teacher.name" class="teacher-avatar" />
                        <div class="teacher-name">{{ consultation.teacher.name }} 老师</div>
                    </div>
                </div>
            </div>

            <div class="messages-container" ref="messagesContainer">
                <div v-if="messages.length === 0" class="empty-messages">
                    <i class="fas fa-comments"></i>
                    <p>咨询已开始，请发送消息</p>
                </div>

                <template v-else>
                    <div v-for="(msg, index) in messages" :key="index"
                        :class="['message', msg.sender === currentUser._id ? 'outgoing' : 'incoming']">
                        <div class="message-content">
                            <div class="message-text">{{ msg.content }}</div>
                            <div class="message-time">{{ formatTime(msg.createdAt) }}</div>
                            <div v-if="msg.read && msg.sender === currentUser._id" class="message-status">
                                <i class="fas fa-check"></i> 已读
                            </div>
                        </div>
                    </div>
                </template>

                <div ref="messagesEnd"></div>
            </div>

            <div class="message-input-container">
                <form @submit.prevent="handleSendMessage" class="message-form">
                    <textarea v-model="newMessage" placeholder="输入消息..." ref="messageInput" class="message-textarea"
                        :disabled="sending" @keydown="handleKeyDown"></textarea>

                    <button type="submit" class="send-button" :disabled="sending || !newMessage.trim()">
                        <i v-if="sending" class="fas fa-spinner fa-spin"></i>
                        <i v-else class="fas fa-paper-plane"></i>
                        发送
                    </button>
                </form>

                <div class="input-tips">
                    按Enter键发送，Shift+Enter换行
                </div>
            </div>
        </template>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { getConsultationById } from '../../services/consultationService'
import { getCurrentUser } from '../../services/authService'
import {
    initSocket,
    joinConsultation,
    sendMessage,
    onNewMessage,
    markMessagesAsRead,
    onMessagesRead,
    onConsultationEnded
} from '../../services/socketService'

export default {
    name: 'ConsultationRoom',
    setup() {
        const route = useRoute()
        // eslint-disable-next-line no-unused-vars
        const router = useRouter()
        const { id } = route.params

        const consultation = ref(null)
        const messages = ref([])
        const loading = ref(true)
        const error = ref('')
        const newMessage = ref('')
        const sending = ref(false)
        const messagesContainer = ref(null)
        const messagesEnd = ref(null)
        const messageInput = ref(null)

        const currentUser = getCurrentUser()
        let socket = null

        // 滚动到最新消息
        const scrollToBottom = () => {
            nextTick(() => {
                if (messagesEnd.value) {
                    messagesEnd.value.scrollIntoView({ behavior: 'smooth' })
                }
            })
        }

        // 格式化消息时间
        const formatTime = (dateString) => {
            return format(new Date(dateString), 'HH:mm')
        }

        // 处理发送消息
        const handleSendMessage = async () => {
            if (!newMessage.value.trim() || sending.value) return

            try {
                sending.value = true

                // 发送消息
                const sentMessage = await sendMessage(consultation.value._id, newMessage.value)

                // 添加到本地消息列表
                messages.value.push(sentMessage)

                // 清空输入框并滚动到底部
                newMessage.value = ''
                scrollToBottom()

                sending.value = false

                // 聚焦输入框
                nextTick(() => {
                    if (messageInput.value) {
                        messageInput.value.focus()
                    }
                })
            } catch (err) {
                error.value = '发送消息失败，请重试'
                sending.value = false
                console.error('发送消息错误:', err)
            }
        }

        // 处理键盘事件
        const handleKeyDown = (e) => {
            // Enter发送，Shift+Enter换行
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
            }
        }

        // 初始化咨询室
        onMounted(async () => {
            try {
                loading.value = true

                // 获取咨询详情
                const data = await getConsultationById(id)
                consultation.value = data

                // 检查咨询状态
                if (data.status !== 'accepted' && data.status !== 'completed') {
                    error.value = '咨询尚未开始或已结束'
                    loading.value = false
                    return
                }

                // 初始化Socket连接
                socket = initSocket()

                // 加入咨询房间
                const roomData = await joinConsultation(id)
                messages.value = roomData.messages || []

                // 监听新消息
                onNewMessage((newMsg) => {
                    messages.value.push(newMsg)
                    scrollToBottom()

                    // 如果不是自己发的消息，标记为已读
                    if (newMsg.sender !== currentUser._id) {
                        markMessagesAsRead(id)
                    }
                })

                // 监听消息已读状态
                onMessagesRead((data) => {
                    if (data.consultationId === id) {
                        // 更新消息已读状态
                        messages.value = messages.value.map(msg =>
                            msg.sender === currentUser._id ? { ...msg, read: true } : msg
                        )
                    }
                })

                // 监听咨询结束
                onConsultationEnded((data) => {
                    if (data.consultationId === id) {
                        // 显示咨询结束提示
                        alert('咨询已结束')
                        // 刷新咨询状态
                        consultation.value = { ...consultation.value, status: 'completed' }
                    }
                })

                // 标记消息为已读
                if (messages.value.some(msg => msg.sender !== currentUser._id && !msg.read)) {
                    markMessagesAsRead(id)
                }

                loading.value = false
                scrollToBottom()

                // 聚焦输入框
                nextTick(() => {
                    if (messageInput.value) {
                        messageInput.value.focus()
                    }
                })
            } catch (err) {
                error.value = err.message || '加载咨询室失败'
                loading.value = false
                console.error('加载咨询室错误:', err)
            }
        })

        // 组件销毁时清理
        onUnmounted(() => {
            // 清理任何监听器
            if (socket) {
                socket.off('newMessage')
                socket.off('messagesRead')
                socket.off('consultationEnded')
            }
        })

        return {
            id,
            consultation,
            messages,
            loading,
            error,
            newMessage,
            sending,
            currentUser,
            messagesContainer,
            messagesEnd,
            messageInput,
            formatTime,
            handleSendMessage,
            handleKeyDown
        }
    }
}
</script>