<template>
  <div class="online-consultation">
    <!-- 教师列表卡片 -->
    <el-card v-if="!activeConsultation">
      <div slot="header">
        <span>选择咨询教师</span>
      </div>

      <!-- Filters (Optional) -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="8">
           <el-input placeholder="搜索教师姓名..." v-model="searchQuery" clearable @clear="fetchTeachers" @keyup.enter.native="fetchTeachers">
             <el-button slot="append" icon="el-icon-search" @click="fetchTeachers"></el-button>
           </el-input>
        </el-col>
        <el-col :span="8">
           <el-select v-model="filterSubject" placeholder="筛选学科" clearable @change="fetchTeachers" style="width: 100%;">
              <!-- Fetch subjects from backend -->
              <el-option label="数学" value="math"></el-option>
              <el-option label="物理" value="physics"></el-option>
              <el-option label="化学" value="chemistry"></el-option>
               <el-option label="英语" value="english"></el-option>
            </el-select>
        </el-col>
         <el-col :span="8">
           <el-select v-model="filterAvailability" placeholder="筛选在线状态" clearable @change="fetchTeachers" style="width: 100%;">
              <el-option label="在线" :value="true"></el-option>
              <el-option label="离线" :value="false"></el-option>
            </el-select>
        </el-col>
      </el-row>

      <!-- Teacher List -->
      <div v-loading="loading">
        <div v-if="!loading && teachers.length === 0" class="no-teachers-placeholder">
           <el-empty description="暂无教师或未找到匹配教师"></el-empty>
        </div>

        <el-row :gutter="20" v-else>
          <el-col :span="6" v-for="teacher in teachers" :key="teacher._id" style="margin-bottom: 20px;">
            <el-card shadow="hover" class="teacher-card">
              <div class="teacher-info">
                 <el-avatar :size="60" :src="teacher.avatar || defaultAvatar" style="margin-bottom: 10px;"></el-avatar>
                <h4>{{ teacher.name }}</h4>
                <p class="teacher-subject">
                   <i class="el-icon-collection-tag"></i> {{ teacher.subjects?.join(', ') || '暂未指定学科' }}
                 </p>
                <p class="teacher-status">
                   <el-tag :type="teacher.isOnline ? 'success' : 'info'" size="mini">{{ teacher.isOnline ? '在线' : '离线' }}</el-tag>
                </p>
                <el-button type="primary" size="small" @click="viewTeacherProfile(teacher._id)">查看详情</el-button>
                <el-button type="success" size="small" icon="el-icon-chat-dot-round" 
                  :disabled="!teacher.isOnline" 
                  @click="showConsultationDialog(teacher)">
                  发起咨询
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- Pagination -->
        <el-pagination
          v-if="teachers.length > 0"
          background
          layout="prev, pager, next, total"
          :total="totalTeachers"
          :page-size="pageSize"
          :current-page.sync="currentPage"
          @current-change="handlePageChange"
          style="margin-top: 20px; text-align: right;">
        </el-pagination>
      </div>
    </el-card>

    <!-- 发起咨询对话框 -->
    <el-dialog 
      title="发起在线咨询" 
      :visible.sync="consultationDialogVisible" 
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="!sendingRequest">
      <el-form :model="consultationForm" :rules="consultationRules" ref="consultationForm" label-width="80px">
        <el-form-item label="咨询主题" prop="topic">
          <el-input v-model="consultationForm.topic" placeholder="请简要描述您需要咨询的问题"></el-input>
        </el-form-item>
        <el-form-item label="咨询内容" prop="message">
          <el-input 
            type="textarea" 
            v-model="consultationForm.message" 
            placeholder="请详细描述您的问题，以便教师更好地帮助您"
            :rows="4">
          </el-input>
        </el-form-item>
      </el-form>
      <div v-if="requestStatus" :class="['request-status', {'success': requestStatus.success}]">
        {{ requestStatus.message }}
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelConsultation" :disabled="sendingRequest">取消</el-button>
        <el-button type="primary" @click="submitConsultation" :loading="sendingRequest">发送请求</el-button>
      </span>
    </el-dialog>

    <!-- 等待教师接受请求 -->
    <el-card v-if="waitingForTeacher" class="waiting-card">
      <div slot="header">
        <span>等待教师接受</span>
      </div>
      <div class="waiting-content">
        <el-avatar :size="80" :src="selectedTeacher?.avatar || defaultAvatar"></el-avatar>
        <h3>{{ consultationForm.topic }}</h3>
        <p>您的咨询请求已发送给 {{ selectedTeacher?.name }}，请耐心等待教师接受。</p>
        <div class="waiting-timer">
          <el-progress type="circle" :percentage="waitingProgress" :width="80"></el-progress>
          <p>{{ Math.floor(waitingTimeLeft / 60) }}:{{ (waitingTimeLeft % 60).toString().padStart(2, '0') }}</p>
        </div>
        <el-button type="danger" @click="cancelWaitingRequest">取消请求</el-button>
      </div>
    </el-card>

    <!-- 实时咨询界面 -->
    <el-card v-if="activeConsultation" class="consultation-card">
      <div slot="header" class="consultation-header">
        <div>
          <span>与 {{ activeConsultation.teacherName }} 的在线咨询</span>
          <el-tag type="success" size="small" style="margin-left: 10px">进行中</el-tag>
        </div>
        <el-button type="danger" size="small" icon="el-icon-close" @click="endConsultation">结束咨询</el-button>
      </div>
      
      <div class="consultation-content">
        <div class="messages-container" ref="messagesContainer">
          <div v-for="(message, index) in consultationMessages" :key="index" 
            :class="['message', message.senderRole === 'student' ? 'message-sent' : 'message-received']">
            <div class="message-header">
              <span class="message-sender">{{ message.senderName }}</span>
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-body">{{ message.message }}</div>
          </div>
          <div v-if="consultationMessages.length === 0" class="no-messages">
            <p>咨询已开始，请输入您的问题...</p>
          </div>
        </div>
        
        <div class="message-input">
          <el-input 
            type="textarea" 
            v-model="newMessage" 
            placeholder="输入消息..." 
            :rows="3"
            :disabled="messageInputDisabled"
            @keyup.ctrl.enter.native="sendMessage">
          </el-input>
          <el-button 
            type="primary" 
            icon="el-icon-s-promotion" 
            :disabled="!newMessage.trim() || messageInputDisabled"
            @click="sendMessage"
            style="margin-top: 10px; width: 100%">
            发送消息
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 咨询结束对话框 -->
    <el-dialog 
      title="咨询已结束" 
      :visible.sync="endDialogVisible" 
      width="500px"
      :show-close="false"
      :close-on-click-modal="false">
      <div class="end-consultation-content">
        <i class="el-icon-circle-check end-icon success" v-if="!endedWithError"></i>
        <i class="el-icon-circle-close end-icon error" v-else></i>
        <h3>{{ endReason }}</h3>
        <p>您可以为本次咨询评分：</p>
        <el-rate v-model="consultationRating" :colors="ratingColors"></el-rate>
        <el-input
          type="textarea"
          :rows="3"
          placeholder="请留下您对本次咨询的评价（可选）"
          v-model="consultationFeedback">
        </el-input>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitFeedbackAndReturn">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import io from 'socket.io-client';

export default {
  name: 'OnlineConsultation',
  data() {
    return {
      loading: false,
      searchQuery: '',
      filterSubject: '',
      filterAvailability: null, // null for 'all', true for 'online', false for 'offline'
      teachers: [], // Array to hold fetched teacher data
      currentPage: 1,
      pageSize: 12, // Adjust as needed for card layout
      totalTeachers: 0,
      defaultAvatar: 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png', // Default teacher avatar
      
      // WebSocket连接
      socket: null,
      
      // 发起咨询对话框
      consultationDialogVisible: false,
      selectedTeacher: null,
      consultationForm: {
        topic: '',
        message: ''
      },
      consultationRules: {
        topic: [
          { required: true, message: '请输入咨询主题', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        message: [
          { required: true, message: '请输入咨询内容', trigger: 'blur' },
          { min: 5, max: 500, message: '长度在 5 到 500 个字符', trigger: 'blur' }
        ]
      },
      sendingRequest: false,
      requestStatus: null,
      
      // 等待教师接受
      waitingForTeacher: false,
      waitingTimeLeft: 300, // 5分钟倒计时
      waitingTimer: null,
      waitingProgress: 100,
      requestId: null,
      
      // 实时咨询
      activeConsultation: null,
      consultationMessages: [],
      newMessage: '',
      messageInputDisabled: false,
      
      // 咨询结束
      endDialogVisible: false,
      endedWithError: false,
      endReason: '',
      consultationRating: 0,
      consultationFeedback: '',
      ratingColors: ['#99A9BF', '#F7BA2A', '#FF9900'] // 自定义评分颜色
    };
  },
  methods: {
    // 获取教师列表
    fetchTeachers() {
      this.loading = true;
      const params = {
        page: this.currentPage,
        limit: this.pageSize,
        search: this.searchQuery,
        subject: this.filterSubject,
        isOnline: this.filterAvailability // Backend should handle null/undefined as 'all'
      };
      // Placeholder API call - adjust endpoint as needed
      this.$axios.get('/api/teachers/available', { params })
        .then(response => {
          // Replace with actual data structure
          this.teachers = response.data.teachers || [];
          this.totalTeachers = response.data.total || 0;
          // Simulate online status for demo if backend doesn't provide it
          this.teachers.forEach(t => { 
              if (t.isOnline === undefined) {
                t.isOnline = Math.random() > 0.5; 
              }
          });
        })
        .catch(error => {
          console.error("Error fetching teachers:", error);
          this.$message.error('加载教师列表失败');
          this.teachers = [];
          this.totalTeachers = 0;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    // 分页处理
    handlePageChange(newPage) {
      this.currentPage = newPage;
      this.fetchTeachers();
    },
    
    // 查看教师详情
    viewTeacherProfile(teacherId) {
       // Navigate to the TeacherProfile route with the teacher's ID
       this.$router.push({ name: 'TeacherProfile', params: { teacherId } }).catch(()=>{});
    },
    
    // 显示发起咨询对话框
    showConsultationDialog(teacher) {
      this.selectedTeacher = teacher;
      this.consultationForm = {
        topic: '',
        message: ''
      };
      this.requestStatus = null;
      this.consultationDialogVisible = true;
    },
    
    // 取消咨询请求
    cancelConsultation() {
      this.consultationDialogVisible = false;
      this.selectedTeacher = null;
      this.consultationForm = {
        topic: '',
        message: ''
      };
    },
    
    // 提交咨询请求
    submitConsultation() {
      this.$refs.consultationForm.validate((valid) => {
        if (valid) {
          this.sendingRequest = true;
          this.requestStatus = null;
          
          // 发送WebSocket请求
          this.socket.emit('create_consultation', {
            studentId: this.$store.state.user.id,
            studentName: this.$store.state.user.name,
            teacherId: this.selectedTeacher._id,
            topic: this.consultationForm.topic,
            message: this.consultationForm.message
          });
          
          // 等待响应
          setTimeout(() => {
            if (!this.requestStatus) {
              this.requestStatus = {
                success: false,
                message: '请求超时，请稍后再试'
              };
              this.sendingRequest = false;
            }
          }, 10000); // 10秒超时
        }
      });
    },
    
    // 取消等待教师接受
    cancelWaitingRequest() {
      if (this.waitingTimer) {
        clearInterval(this.waitingTimer);
        this.waitingTimer = null;
      }
      
      // 通知服务器取消请求
      if (this.requestId) {
        this.socket.emit('end_consultation', {
          requestId: this.requestId,
          reason: '学生取消了请求'
        });
      }
      
      this.waitingForTeacher = false;
      this.requestId = null;
      this.$message({
        type: 'info',
        message: '您已取消咨询请求'
      });
    },
    
    // 发送消息
    sendMessage() {
      if (!this.newMessage.trim() || !this.activeConsultation || this.messageInputDisabled) {
        return;
      }
      
      this.socket.emit('consultation_message', {
        requestId: this.activeConsultation.requestId,
        senderName: this.$store.state.user.name,
        message: this.newMessage
      });
      
      this.newMessage = '';
      
      // 自动滚动到底部
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },
    
    // 结束咨询
    endConsultation() {
      this.$confirm('确定要结束本次咨询吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.socket.emit('end_consultation', {
          requestId: this.activeConsultation.requestId,
          reason: '学生结束了咨询'
        });
        
        this.showEndDialog('您已结束本次咨询');
      }).catch(() => {});
    },
    
    // 显示咨询结束对话框
    showEndDialog(reason, isError = false) {
      this.endDialogVisible = true;
      this.endReason = reason;
      this.endedWithError = isError;
      this.activeConsultation = null;
    },
    
    // 提交反馈并返回
    submitFeedbackAndReturn() {
      if (this.requestId) {
        // 发送评分和反馈到服务器
        this.$axios.post(`/api/consultations/${this.requestId}/feedback`, {
          rating: this.consultationRating,
          feedback: this.consultationFeedback
        }).catch(error => {
          console.error('Error submitting feedback:', error);
        });
      }
      
      this.endDialogVisible = false;
      this.consultationRating = 0;
      this.consultationFeedback = '';
    },
    
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },
    
    // 初始化WebSocket连接
    initializeSocket() {
      // 连接到WebSocket服务器
      this.socket = io(process.env.VUE_APP_SOCKET_URL || 'http://localhost:5000', {
        withCredentials: true
      });
      
      // 连接事件
      this.socket.on('connect', () => {
        console.log('Connected to server');
        
        // 发送身份认证
        this.socket.emit('authenticate', {
          userId: this.$store.state.user.id,
          role: 'student'
        });
      });
      
      // 断开连接事件
      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });
      
      // 接收咨询创建成功响应
      this.socket.on('consultation_created', (data) => {
        if (data.success) {
          this.requestStatus = {
            success: true,
            message: '咨询请求已发送，等待教师接受'
          };
          
          // 关闭对话框，显示等待界面
          setTimeout(() => {
            this.sendingRequest = false;
            this.consultationDialogVisible = false;
            this.waitingForTeacher = true;
            this.requestId = data.requestId;
            
            // 开始倒计时
            this.startWaitingTimer();
          }, 1500);
        } else {
          this.requestStatus = {
            success: false,
            message: data.message || '发送请求失败，请稍后再试'
          };
          this.sendingRequest = false;
        }
      });
      
      // 接收教师接受咨询的响应
      this.socket.on('consultation_accepted', (data) => {
        // 停止倒计时
        if (this.waitingTimer) {
          clearInterval(this.waitingTimer);
          this.waitingTimer = null;
        }
        
        this.waitingForTeacher = false;
        
        // 显示咨询界面
        this.activeConsultation = {
          requestId: data.requestId,
          teacherName: data.teacherName,
          roomId: data.roomId
        };
        
        this.$message({
          type: 'success',
          message: `教师${data.teacherName}已接受您的咨询请求`
        });
      });
      
      // 接收咨询消息
      this.socket.on('consultation_message', (data) => {
        this.consultationMessages.push(data);
        
        // 自动滚动到底部
        this.$nextTick(() => {
          const container = this.$refs.messagesContainer;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        });
      });
      
      // 接收咨询结束通知
      this.socket.on('consultation_ended', (data) => {
        let reason = '咨询已结束';
        if (data.endedBy === 'teacher') {
          reason = '教师结束了本次咨询';
        } else if (data.reason) {
          reason = data.reason;
        }
        
        this.showEndDialog(reason);
      });
    },
    
    // 开始等待计时器
    startWaitingTimer() {
      this.waitingTimeLeft = 300; // 5分钟
      this.waitingProgress = 100;
      
      this.waitingTimer = setInterval(() => {
        this.waitingTimeLeft--;
        this.waitingProgress = Math.round((this.waitingTimeLeft / 300) * 100);
        
        if (this.waitingTimeLeft <= 0) {
          clearInterval(this.waitingTimer);
          this.waitingTimer = null;
          this.waitingForTeacher = false;
          
          // 通知服务器请求超时
          if (this.requestId) {
            this.socket.emit('end_consultation', {
              requestId: this.requestId,
              reason: '请求超时'
            });
          }
          
          this.$message({
            type: 'warning',
            message: '咨询请求超时，请稍后再试'
          });
        }
      }, 1000);
    }
  },
  created() {
    this.fetchTeachers();
    this.initializeSocket();
  },
  beforeDestroy() {
    // 清除定时器
    if (this.waitingTimer) {
      clearInterval(this.waitingTimer);
    }
    
    // 如果有活动的咨询，通知服务器学生离开
    if (this.activeConsultation) {
      this.socket.emit('end_consultation', {
        requestId: this.activeConsultation.requestId,
        reason: '学生离开了页面'
      });
    }
    
    // 断开WebSocket连接
    if (this.socket) {
      this.socket.disconnect();
    }
  }
};
</script>

<style scoped>
.online-consultation {
  padding: 20px;
}

.teacher-card {
  text-align: center;
}

.teacher-info h4 {
  margin: 10px 0 5px 0;
  font-size: 1.1em;
}

.teacher-subject {
  font-size: 0.9em;
  color: #606266;
  margin-bottom: 10px;
  min-height: 18px; /* Prevent layout shift if empty */
}
.teacher-subject i {
    margin-right: 4px;
}

.teacher-status {
    margin-bottom: 15px;
}

.no-teachers-placeholder {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

/* 请求状态样式 */
.request-status {
  text-align: center;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  background-color: #fef0f0;
  color: #f56c6c;
}

.request-status.success {
  background-color: #f0f9eb;
  color: #67c23a;
}

/* 等待卡片样式 */
.waiting-card {
  max-width: 500px;
  margin: 0 auto;
}

.waiting-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.waiting-content h3 {
  margin: 15px 0 10px;
}

.waiting-timer {
  margin: 20px 0;
  text-align: center;
}

.waiting-timer p {
  margin-top: 10px;
  font-size: 18px;
  font-weight: bold;
  color: #606266;
}

/* 咨询界面样式 */
.consultation-card {
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}

.consultation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.consultation-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.messages-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 10px;
}

.message {
  margin-bottom: 15px;
  max-width: 80%;
  padding: 10px;
  border-radius: 4px;
  position: relative;
}

.message-sent {
  background-color: #ecf5ff;
  margin-left: auto;
  border-top-right-radius: 0;
}

.message-received {
  background-color: #fff;
  margin-right: auto;
  border-top-left-radius: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.message-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 5px;
}

.message-sender {
  font-weight: bold;
  color: #409EFF;
}

.message-time {
  color: #909399;
}

.message-body {
  word-break: break-word;
}

.message-input {
  padding: 10px 0;
}

.no-messages {
  text-align: center;
  color: #909399;
  padding: 20px;
}

/* 咨询结束对话框样式 */
.end-consultation-content {
  text-align: center;
  padding: 20px 0;
}

.end-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.end-icon.success {
  color: #67c23a;
}

.end-icon.error {
  color: #f56c6c;
}

.end-consultation-content h3 {
  margin-bottom: 20px;
}

.end-consultation-content .el-rate {
  margin: 15px 0;
}

.end-consultation-content .el-textarea {
  margin-top: 15px;
}
</style> 