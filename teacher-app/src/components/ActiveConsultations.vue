<template>
  <div class="active-consultations">
    <div class="page-header">
      <h3>进行中咨询</h3>
      <el-button type="primary" size="small" @click="refreshConsultations">刷新</el-button>
    </div>
    
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    
    <div v-else-if="activeConsultations.length === 0" class="empty-container">
      <el-empty description="暂无进行中的咨询" />
    </div>
    
    <div v-else class="consultations-list">
      <el-card v-for="consultation in activeConsultations" :key="consultation.id" class="consultation-card">
        <div class="consultation-header">
          <div class="student-info">
            <el-avatar :size="40">{{ consultation.studentName.charAt(0) }}</el-avatar>
            <div class="student-details">
              <h4>{{ consultation.studentName }}</h4>
              <el-tag size="small">{{ getSubjectLabel(consultation.subject) }}</el-tag>
            </div>
          </div>
          <div class="consultation-time">
            开始时间: {{ consultation.startedAt }}
          </div>
        </div>
        
        <div class="consultation-content">
          <h4 class="consultation-topic">{{ consultation.topic }}</h4>
          <div class="message-preview">
            <div v-if="consultation.messages && consultation.messages.length > 0" class="last-message">
              <span class="message-sender">{{ getSenderName(consultation.messages[consultation.messages.length - 1]) }}:</span>
              <span class="message-content">{{ consultation.messages[consultation.messages.length - 1].content }}</span>
            </div>
            <div v-else class="no-messages">
              暂无消息记录
            </div>
          </div>
        </div>
        
        <div class="consultation-actions">
          <el-button type="primary" @click="enterChat(consultation)">进入对话</el-button>
          <el-button type="danger" @click="handleEnd(consultation)">结束咨询</el-button>
        </div>
      </el-card>
    </div>
    
    <!-- 结束咨询对话框 -->
    <el-dialog
      title="结束咨询"
      v-model="endDialogVisible"
      width="30%">
      <p>确定要结束与 {{ currentConsultation && currentConsultation.studentName ? currentConsultation.studentName : '该学生' }} 的咨询吗？</p>
      <el-form :model="endForm" label-width="80px">
        <el-form-item label="评价">
          <el-rate v-model="endForm.rating" :colors="colors"></el-rate>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            type="textarea"
            :rows="3"
            v-model="endForm.comment"
            placeholder="请输入咨询总结或备注">
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="endDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmEnd">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  name: 'ActiveConsultations',
  setup() {
    const store = useStore()
    const router = useRouter()
    const loading = ref(true)
    const endDialogVisible = ref(false)
    const currentConsultation = ref(null)
    
    const endForm = ref({
      rating: 5,
      comment: ''
    })
    
    const colors = {
      1: '#F56C6C',
      2: '#F56C6C',
      3: '#E6A23C',
      4: '#67C23A',
      5: '#67C23A'
    }
    
    const activeConsultations = computed(() => store.state.activeConsultations)
    
    const subjectOptions = [
      { value: 'math', label: '数学' },
      { value: 'chinese', label: '语文' },
      { value: 'english', label: '英语' },
      { value: 'physics', label: '物理' },
      { value: 'chemistry', label: '化学' },
      { value: 'biology', label: '生物' },
      { value: 'history', label: '历史' },
      { value: 'geography', label: '地理' },
      { value: 'politics', label: '政治' }
    ]
    
    const getSubjectLabel = (value) => {
      const option = subjectOptions.find(item => item.value === value)
      return option ? option.label : value
    }
    
    const getSenderName = (message) => {
      if (!message) return ''
      return message.senderType === 'student' ? '学生' : '我'
    }
    
    const refreshConsultations = async () => {
      loading.value = true
      try {
        await store.dispatch('fetchActiveConsultations')
      } catch (error) {
        console.error('获取进行中咨询失败:', error)
        ElMessage.error('获取进行中咨询失败')
      } finally {
        loading.value = false
      }
    }
    
    const enterChat = (consultation) => {
      router.push(`/consultation/${consultation.id}`)
    }
    
    const handleEnd = (consultation) => {
      currentConsultation.value = consultation
      endForm.value.rating = 5
      endForm.value.comment = ''
      endDialogVisible.value = true
    }
    
    const confirmEnd = async () => {
      try {
        // 这里应该调用API结束咨询
        // 暂时使用本地操作模拟
        store.commit('removeActiveConsultation', currentConsultation.value.id)
        ElMessage.success('咨询已结束')
        endDialogVisible.value = false
      } catch (error) {
        console.error('结束咨询失败:', error)
        ElMessage.error('结束咨询失败')
      }
    }
    
    onMounted(async () => {
      await refreshConsultations()
    })
    
    return {
      loading,
      activeConsultations,
      endDialogVisible,
      currentConsultation,
      endForm,
      colors,
      getSubjectLabel,
      getSenderName,
      refreshConsultations,
      enterChat,
      handleEnd,
      confirmEnd
    }
  }
}
</script>

<style scoped>
.active-consultations {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h3 {
  margin: 0;
}

.loading-container, .empty-container {
  margin: 40px 0;
}

.consultations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.consultation-card {
  border-radius: 8px;
  transition: transform 0.2s;
}

.consultation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.consultation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.student-info {
  display: flex;
  align-items: center;
}

.student-details {
  margin-left: 12px;
}

.student-details h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
}

.consultation-time {
  color: #909399;
  font-size: 14px;
}

.consultation-content {
  margin-bottom: 16px;
}

.consultation-topic {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.message-preview {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 12px;
}

.last-message {
  color: #606266;
  line-height: 1.5;
}

.message-sender {
  font-weight: bold;
  margin-right: 4px;
}

.no-messages {
  color: #909399;
  font-style: italic;
}

.consultation-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}
</style> 