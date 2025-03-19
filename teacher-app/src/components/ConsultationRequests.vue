<template>
  <div class="consultation-requests">
    <div class="page-header">
      <h3>待处理咨询请求</h3>
      <el-button type="primary" size="small" @click="refreshRequests">刷新</el-button>
    </div>
    
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    
    <div v-else-if="consultationRequests.length === 0" class="empty-container">
      <el-empty description="暂无待处理的咨询请求" />
    </div>
    
    <div v-else class="requests-list">
      <el-card v-for="request in consultationRequests" :key="request.id" class="request-card">
        <div class="request-header">
          <div class="student-info">
            <el-avatar :size="40">{{ request.studentName.charAt(0) }}</el-avatar>
            <div class="student-details">
              <h4>{{ request.studentName }}</h4>
              <el-tag size="small">{{ getSubjectLabel(request.subject) }}</el-tag>
            </div>
          </div>
          <div class="request-time">
            {{ request.createdAt }}
          </div>
        </div>
        
        <div class="request-content">
          <h4 class="request-topic">{{ request.topic }}</h4>
          <p class="request-message">{{ request.message }}</p>
        </div>
        
        <div class="request-actions">
          <el-button type="primary" @click="handleAccept(request)">接受咨询</el-button>
          <el-button type="info" @click="handleReject(request)">拒绝</el-button>
        </div>
      </el-card>
    </div>
    
    <!-- 拒绝咨询对话框 -->
    <el-dialog
      title="拒绝咨询"
      v-model="rejectDialogVisible"
      width="30%">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因">
          <el-select v-model="rejectForm.reason" placeholder="请选择拒绝原因">
            <el-option label="时间冲突" value="time_conflict"></el-option>
            <el-option label="非专业领域" value="not_expertise"></el-option>
            <el-option label="学生问题描述不清" value="unclear_question"></el-option>
            <el-option label="其他原因" value="other"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备注" v-if="rejectForm.reason === 'other'">
          <el-input
            type="textarea"
            :rows="3"
            v-model="rejectForm.comment"
            placeholder="请输入拒绝原因">
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmReject">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'ConsultationRequests',
  setup() {
    const store = useStore()
    const router = useRouter()
    const loading = ref(true)
    const rejectDialogVisible = ref(false)
    const currentRequest = ref(null)
    
    const rejectForm = ref({
      reason: '',
      comment: ''
    })
    
    const consultationRequests = computed(() => store.state.consultationRequests)
    
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
    
    const refreshRequests = async () => {
      loading.value = true
      try {
        await store.dispatch('fetchConsultationRequests')
      } catch (error) {
        console.error('获取咨询请求失败:', error)
        ElMessage.error('获取咨询请求失败')
      } finally {
        loading.value = false
      }
    }
    
    const handleAccept = (request) => {
      ElMessageBox.confirm(
        `确定接受来自 ${request.studentName} 的咨询请求吗？`,
        '接受咨询',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(async () => {
        try {
          const consultation = await store.dispatch('acceptConsultationRequest', request.id)
          ElMessage.success('已接受咨询请求')
          router.push(`/active-consultations/${consultation.id}`)
        } catch (error) {
          console.error('接受咨询请求失败:', error)
          ElMessage.error('接受咨询请求失败')
        }
      }).catch(() => {
        // 取消操作
      })
    }
    
    const handleReject = (request) => {
      currentRequest.value = request
      rejectForm.value.reason = ''
      rejectForm.value.comment = ''
      rejectDialogVisible.value = true
    }
    
    const confirmReject = async () => {
      if (!rejectForm.value.reason) {
        ElMessage.warning('请选择拒绝原因')
        return
      }
      
      if (rejectForm.value.reason === 'other' && !rejectForm.value.comment) {
        ElMessage.warning('请输入拒绝原因')
        return
      }
      
      try {
        // 这里应该调用API拒绝咨询请求
        // 暂时使用本地操作模拟
        store.commit('removeConsultationRequest', currentRequest.value.id)
        ElMessage.success('已拒绝咨询请求')
        rejectDialogVisible.value = false
      } catch (error) {
        console.error('拒绝咨询请求失败:', error)
        ElMessage.error('拒绝咨询请求失败')
      }
    }
    
    onMounted(async () => {
      await refreshRequests()
    })
    
    return {
      loading,
      consultationRequests,
      rejectDialogVisible,
      rejectForm,
      getSubjectLabel,
      refreshRequests,
      handleAccept,
      handleReject,
      confirmReject
    }
  }
}
</script>

<style scoped>
.consultation-requests {
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

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.request-card {
  border-radius: 8px;
  transition: transform 0.2s;
}

.request-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.request-header {
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

.request-time {
  color: #909399;
  font-size: 14px;
}

.request-content {
  margin-bottom: 16px;
}

.request-topic {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.request-message {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}

.request-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}
</style> 