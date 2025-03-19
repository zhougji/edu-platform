<template>
  <div class="page-container">
    <el-card class="page-card">
      <h2>在线咨询</h2>
      
      <div v-if="consultations.length > 0" class="consultation-history">
        <h3>咨询历史</h3>
        <el-table :data="consultations" stripe style="width: 100%">
          <el-table-column prop="subject" label="咨询主题" width="180"></el-table-column>
          <el-table-column prop="date" label="提交日期" width="180"></el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="scope">
              <el-button 
                size="small" 
                type="primary" 
                @click="viewConsultation(scope.row)"
                :disabled="scope.row.status === '等待中'"
              >查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <div v-else class="empty-state">
        <el-empty description="暂无咨询记录"></el-empty>
      </div>
      
      <el-divider></el-divider>
      
      <h3>发起新咨询</h3>
      <el-form :model="consultForm" :rules="rules" ref="consultForm" label-width="100px">
        <el-form-item label="学科" prop="subject">
          <el-select v-model="consultForm.subject" placeholder="请选择学科">
            <el-option label="数学" value="math"></el-option>
            <el-option label="语文" value="chinese"></el-option>
            <el-option label="英语" value="english"></el-option>
            <el-option label="物理" value="physics"></el-option>
            <el-option label="化学" value="chemistry"></el-option>
            <el-option label="生物" value="biology"></el-option>
            <el-option label="历史" value="history"></el-option>
            <el-option label="地理" value="geography"></el-option>
            <el-option label="政治" value="politics"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="咨询问题" prop="question">
          <el-input type="textarea" v-model="consultForm.question" rows="4" placeholder="请详细描述您的问题..."></el-input>
        </el-form-item>
        
        <el-form-item label="紧急程度" prop="urgency">
          <el-radio-group v-model="consultForm.urgency">
            <el-radio label="low">普通</el-radio>
            <el-radio label="medium">较急</el-radio>
            <el-radio label="high">紧急</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitConsult" :loading="submitting">提交咨询</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 咨询详情对话框 -->
      <el-dialog v-model="dialogVisible" title="咨询详情" width="60%">
        <div v-if="currentConsultation">
          <h3>{{ currentConsultation.subject }} 咨询</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="咨询问题">{{ currentConsultation.question }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ currentConsultation.date }}</el-descriptions-item>
            <el-descriptions-item label="回复老师">{{ currentConsultation.teacherName || '未分配' }}</el-descriptions-item>
            <el-descriptions-item label="回复内容">{{ currentConsultation.answer || '等待老师回复...' }}</el-descriptions-item>
          </el-descriptions>
          
          <div class="chat-section" v-if="currentConsultation.status === '已接受'">
            <h4>追加咨询</h4>
            <div class="chat-messages">
              <div v-for="(msg, idx) in currentConsultation.messages" :key="idx" 
                   :class="['message', msg.sender === 'student' ? 'message-student' : 'message-teacher']">
                <div class="message-sender">{{ msg.sender === 'student' ? '我' : currentConsultation.teacherName }}</div>
                <div class="message-content">{{ msg.content }}</div>
                <div class="message-time">{{ msg.time }}</div>
              </div>
            </div>
            <div class="chat-input">
              <el-input v-model="messageInput" placeholder="输入追加问题..." rows="2" type="textarea"></el-input>
              <el-button type="primary" @click="sendMessage" :disabled="!messageInput.trim()">发送</el-button>
            </div>
          </div>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'
import { ElMessage } from 'element-plus'

export default {
  name: "OnlineConsult",
  data() {
    return {
      consultations: [],
      consultForm: {
        subject: '',
        question: '',
        urgency: 'medium'
      },
      rules: {
        subject: [{ required: true, message: '请选择学科', trigger: 'change' }],
        question: [{ required: true, message: '请输入咨询问题', trigger: 'blur' }],
        urgency: [{ required: true, message: '请选择紧急程度', trigger: 'change' }]
      },
      submitting: false,
      dialogVisible: false,
      currentConsultation: null,
      messageInput: ''
    }
  },
  created() {
    this.fetchConsultations()
  },
  methods: {
    fetchConsultations() {
      // 获取用户咨询历史
      const userId = localStorage.getItem('userId')
      if (!userId) {
        ElMessage.warning('请先登录')
        this.$router.push('/login')
        return
      }
      
      axios.get(`http://localhost:5000/api/consultations?userId=${userId}`)
        .then(res => {
          this.consultations = res.data || []
        })
        .catch(err => {
          console.error('获取咨询历史失败', err)
          ElMessage.error('获取咨询历史失败')
        })
    },
    
    submitConsult() {
      this.$refs.consultForm.validate(valid => {
        if (!valid) return
        
        this.submitting = true
        const userId = localStorage.getItem('userId')
        
        if (!userId) {
          ElMessage.warning('请先登录')
          this.$router.push('/login')
          return
        }
        
        const consultation = {
          ...this.consultForm,
          userId,
          date: new Date().toLocaleString(),
          status: '等待中'
        }
        
        axios.post('http://localhost:5000/api/consultations', consultation)
          .then(res => {
            ElMessage.success('咨询提交成功，请等待老师接单')
            this.consultForm = {
              subject: '',
              question: '',
              urgency: 'medium'
            }
            this.fetchConsultations()
          })
          .catch(err => {
            console.error('提交咨询失败', err)
            ElMessage.error('提交咨询失败')
          })
          .finally(() => {
            this.submitting = false
          })
      })
    },
    
    getStatusType(status) {
      const types = {
        '等待中': 'info',
        '已接受': 'success',
        '已完成': 'success',
        '已拒绝': 'danger'
      }
      return types[status] || 'info'
    },
    
    viewConsultation(row) {
      axios.get(`http://localhost:5000/api/consultations/${row.id}`)
        .then(res => {
          this.currentConsultation = res.data
          this.dialogVisible = true
        })
        .catch(err => {
          console.error('获取咨询详情失败', err)
          ElMessage.error('获取咨询详情失败')
        })
    },
    
    sendMessage() {
      if (!this.messageInput.trim()) return
      
      const message = {
        consultationId: this.currentConsultation.id,
        content: this.messageInput,
        sender: 'student',
        time: new Date().toLocaleString()
      }
      
      axios.post('http://localhost:5000/api/consultation-messages', message)
        .then(res => {
          // 添加到当前消息列表
          if (!this.currentConsultation.messages) {
            this.currentConsultation.messages = []
          }
          this.currentConsultation.messages.push(message)
          this.messageInput = ''
          
          // 轮询获取老师回复
          this.pollForTeacherResponse()
        })
        .catch(err => {
          console.error('发送消息失败', err)
          ElMessage.error('发送消息失败')
        })
    },
    
    pollForTeacherResponse() {
      // 实际应用中可使用WebSocket实时通讯
      const checkInterval = setInterval(() => {
        axios.get(`http://localhost:5000/api/consultations/${this.currentConsultation.id}`)
          .then(res => {
            if (res.data.messages?.length > this.currentConsultation.messages?.length) {
              this.currentConsultation = res.data
              clearInterval(checkInterval)
            }
          })
          .catch(err => {
            console.error('轮询老师回复失败', err)
            clearInterval(checkInterval)
          })
      }, 5000) // 每5秒检查一次
      
      // 30秒后停止轮询
      setTimeout(() => {
        clearInterval(checkInterval)
      }, 30000)
    }
  }
}
</script>

<style scoped>
.page-container {
  padding: 20px;
}
.page-card {
  max-width: 900px;
  margin: 20px auto;
  padding: 20px;
}
.consultation-history {
  margin-bottom: 30px;
}
.empty-state {
  margin: 40px 0;
}
.chat-section {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}
.chat-messages {
  height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 15px;
  background: #f9f9f9;
}
.message {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 80%;
}
.message-student {
  background: #ecf5ff;
  margin-left: auto;
  text-align: right;
}
.message-teacher {
  background: #f0f9eb;
}
.message-sender {
  font-weight: bold;
  margin-bottom: 4px;
  font-size: 0.9em;
}
.message-time {
  font-size: 0.8em;
  color: #999;
  margin-top: 4px;
}
.chat-input {
  display: flex;
  gap: 10px;
}
.chat-input .el-textarea {
  flex: 1;
}
</style>
