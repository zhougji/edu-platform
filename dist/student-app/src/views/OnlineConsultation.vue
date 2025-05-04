<template>
  <div class="online-consultation">
    <!-- 离线测试模式提示 -->
    <el-alert
      v-if="offlineTestMode"
      title="离线测试模式已启用，所有功能使用模拟数据"
      type="info"
      description="此模式下可以测试UI流程，但不会发送实际请求到后端服务。"
      show-icon
      :closable="false"
      style="margin-bottom: 15px;">
    </el-alert>
    
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
        
        <!-- 仅在开发/测试模式下显示 -->
        <el-button 
          type="primary" 
          @click="simulateTeacherAccept"
          style="margin-top: 15px;">
          模拟教师接受（测试用）
        </el-button>
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
// Replace the problematic imports with browser-compatible versions
import SockJS from 'sockjs-client/dist/sockjs.min.js';
// Use the browser version of stomp instead of the Node.js version
import { Stomp } from '@stomp/stompjs';

export default {
  name: 'OnlineConsultation',
  data() {
    return {
      // 添加离线测试模式
      offlineTestMode: true, // 设置为true启用离线测试模式

      loading: false,
      searchQuery: '',
      filterSubject: '',
      filterAvailability: null, // null for 'all', true for 'online', false for 'offline'
      teachers: [], // Array to hold fetched teacher data
      currentPage: 1,
      pageSize: 12, // Adjust as needed for card layout
      totalTeachers: 0,
      defaultAvatar: 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png', // Default teacher avatar
      
      // WebSocket/STOMP state
      stompClient: null,
      subscription: null, 
      isConnected: false, // Track STOMP connection status
      
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
      
      // 离线测试模式直接使用模拟数据
      if (this.offlineTestMode) {
        console.log("离线测试模式: 使用模拟教师数据");
        setTimeout(() => {
          this.teachers = [
            {_id: '1', name: '张老师', subjects: ['数学', '物理'], isOnline: true, avatar: ''},
            {_id: '2', name: '王老师', subjects: ['英语'], isOnline: true, avatar: ''},
            {_id: '3', name: '李老师', subjects: ['化学'], isOnline: false, avatar: ''},
            {_id: '4', name: '赵老师', subjects: ['生物'], isOnline: true, avatar: ''},
            {_id: '5', name: '钱老师', subjects: ['历史', '政治'], isOnline: true, avatar: ''},
            {_id: '6', name: '孙老师', subjects: ['地理'], isOnline: false, avatar: ''}
          ];
          this.totalTeachers = 6;
          this.loading = false;
        }, 500); // 模拟网络延迟
        return;
      }

      const params = {
        page: this.currentPage,
        limit: this.pageSize,
        search: this.searchQuery,
        subject: this.filterSubject,
        isOnline: this.filterAvailability // Backend should handle null/undefined as 'all'
      };
      // Placeholder API call - adjust endpoint as needed
      this.$http.get('/api/teachers/available', { params })
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
          this.$message.error('加载教师列表失败 - 使用模拟数据');
          // 使用模拟数据进行测试
          this.teachers = [
            {_id: '1', name: '张老师', subjects: ['数学', '物理'], isOnline: true, avatar: ''},
            {_id: '2', name: '王老师', subjects: ['英语'], isOnline: true, avatar: ''},
            {_id: '3', name: '李老师', subjects: ['化学'], isOnline: false, avatar: ''}
          ];
          this.totalTeachers = 3;
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
          
          // 离线测试模式下模拟请求成功
          if (this.offlineTestMode) {
            console.log("离线测试模式: 模拟咨询请求成功");
            setTimeout(() => this.handleConsultationRequestSent(), 1000);
            return;
          }
          
          // TODO: Verify this logic. Sending a request might be better via REST API first.
          // Then, use WebSocket for status updates (pending, accepted, rejected).
          // If using WebSocket directly:
          if (this.stompClient && this.stompClient.connected) {
             // TODO: Define a proper STOMP destination for creating requests, e.g., /app/consultation.request
             console.warn("Consultation request via STOMP not fully implemented yet.");
             // Example placeholder - backend needs @MessageMapping for this
             // this.stompClient.send("/app/consultation.request", {}, JSON.stringify({
             //   studentId: this.$store.state.user?.id,
             //   teacherId: this.selectedTeacher._id,
             //   topic: this.consultationForm.topic,
             //   message: this.consultationForm.message
             // }));
             // Simulate success for now for UI flow
             setTimeout(() => this.handleConsultationRequestSent(), 1000); 
          } else {
             this.requestStatus = { success: false, message: '无法连接到服务，请稍后重试' };
             this.sendingRequest = false;
             console.error("Cannot send consultation request, STOMP client not connected.");
          }

          // // Original socket.io logic (keep commented for reference)
          // this.socket.emit('create_consultation', {
          //   studentId: this.$store.state.user.id,
          //   studentName: this.$store.state.user.name,
          //   teacherId: this.selectedTeacher._id,
          //   topic: this.consultationForm.topic,
          //   message: this.consultationForm.message
          // });
          
          // // Timeout logic might need adjustment based on actual request flow
          // setTimeout(() => {
          //   if (!this.requestStatus) { ... }
          // }, 10000); 
        }
      });
    },
    
    // Placeholder after sending request (simulates backend confirmation)
    handleConsultationRequestSent() {
        this.requestStatus = { success: true, message: '咨询请求已发送，等待教师接受' };
        // Transition to waiting state
          setTimeout(() => {
              this.sendingRequest = false;
            this.consultationDialogVisible = false;
            this.waitingForTeacher = true;
            // Assuming requestId comes from the actual request confirmation
            this.requestId = `temp_${Date.now()}`; // Use a temporary ID for now
            this.startWaitingTimer(); // Start the waiting timer
        }, 1500);
    },
    
    // 启动等待计时器
    startWaitingTimer() {
      this.waitingTimeLeft = 300; // 5分钟 = 300秒
      this.waitingProgress = 100;
      
      if (this.waitingTimer) {
        clearInterval(this.waitingTimer);
      }
      
      this.waitingTimer = setInterval(() => {
        this.waitingTimeLeft -= 1;
        this.waitingProgress = Math.round((this.waitingTimeLeft / 300) * 100);
        
        if (this.waitingTimeLeft <= 0) {
          clearInterval(this.waitingTimer);
          this.waitingTimer = null;
          this.waitingForTeacher = false;
          this.requestId = null;
          this.showEndDialog('教师未在规定时间内接受您的请求', true);
        }
      }, 1000);
    },
    
    // 取消等待教师接受
    cancelWaitingRequest() {
      if (this.waitingTimer) {
        clearInterval(this.waitingTimer);
        this.waitingTimer = null;
      }
      
      // 通知服务器取消请求
      if (this.requestId && this.stompClient && this.stompClient.connected) {
        // Using STOMP to send cancel message
        this.stompClient.send("/app/consultation.cancel", {}, JSON.stringify({
          requestId: this.requestId,
          reason: '学生取消了请求'
        }));
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
      
      // 离线测试模式模拟发送和接收消息
      if (this.offlineTestMode) {
        console.log("离线测试模式: 模拟发送消息");
        
        // 添加学生消息
        const studentMessage = {
          senderRole: 'student',
          senderName: this.$store.state.user?.name || '学生',
          message: this.newMessage.trim(),
          timestamp: new Date().toISOString()
        };
        this.consultationMessages.push(studentMessage);
        
        // 清空输入框
      this.newMessage = '';
        
        // 模拟教师回复
        setTimeout(() => {
          const teacherMessage = {
            senderRole: 'teacher',
            senderName: this.activeConsultation.teacherName,
            message: `这是对"${studentMessage.message.substring(0, 10)}${studentMessage.message.length > 10 ? '...' : ''}"的自动回复。`,
            timestamp: new Date().toISOString()
          };
          this.consultationMessages.push(teacherMessage);
      
      // 自动滚动到底部
          this.$nextTick(() => {
            const container = this.$refs.messagesContainer;
            if (container) {
              container.scrollTop = container.scrollHeight;
            }
          });
        }, 1500);
        
        return;
      }
      
      if (!this.stompClient || !this.stompClient.connected) {
        this.$message.error("消息服务未连接，请稍后重试");
        return;
      }
      
      const messagePayload = {
        senderId: this.$store.state.user?.id || 'student_unknown', 
        senderName: this.$store.state.user?.name || 'Student', 
        content: this.newMessage.trim(),
        consultationId: this.activeConsultation.consultationId, // Use consultationId
        type: 'CHAT' 
      };
      
      // Send message via STOMP
      this.stompClient.send(`/app/chat.sendMessage/${this.activeConsultation.consultationId}`, {}, JSON.stringify(messagePayload));
      
      this.newMessage = '';
      
      // Auto-scroll 
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
        // 离线测试模式
        if (this.offlineTestMode) {
          console.log("离线测试模式: 结束咨询");
          this.showEndDialog('您已结束本次咨询');
          return;
        }
        
        // TODO: Implement sending end signal via STOMP or REST
        if (this.stompClient && this.stompClient.connected && this.activeConsultation) {
            console.warn("End consultation via STOMP not fully implemented.");
             // Example: Send a LEAVE message or specific end event
            // const endMessage = { type: 'LEAVE', senderId: ..., consultationId: ... };
            // this.stompClient.send(`/app/chat.leave/${this.activeConsultation.consultationId}`, {}, JSON.stringify(endMessage));
        }
        
        // // Original socket.io logic
        // this.socket.emit('end_consultation', {
        //   requestId: this.activeConsultation.requestId,
        //   reason: '学生结束了咨询'
        // });
        
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
        if (this.offlineTestMode) {
          console.log("离线测试模式: 提交评分反馈", {
            rating: this.consultationRating,
            feedback: this.consultationFeedback
          });
        } else {
        // 发送评分和反馈到服务器
          this.$http.post(`/api/consultations/${this.requestId}/feedback`, {
          rating: this.consultationRating,
          feedback: this.consultationFeedback
        }).catch(error => {
          console.error('Error submitting feedback:', error);
        });
        }
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
      // 在离线测试模式下不连接WebSocket
      if (this.offlineTestMode) {
        console.log("离线测试模式: 跳过WebSocket连接");
        this.isConnected = true; // 假装已连接
        return;
      }

      if (this.stompClient && this.stompClient.connected) {
        console.log("STOMP client already connected.");
        return;
      }

      // 更新为正确的Spring Boot后端端口
      const socketUrl = 'http://localhost:8085/ws'; 
      console.log(`尝试连接STOMP端点: ${socketUrl}`);
      const socket = new SockJS(socketUrl);
      this.stompClient = Stomp.over(socket);

      // Disable STOMP debugging messages in production
      if (process.env.NODE_ENV !== 'production') {
         this.stompClient.debug = (str) => { console.log('STOMP DEBUG:', str); };
      } else {
         this.stompClient.debug = null; // Disable debug logging
      }
      
      this.stompClient.connect(
        {}, // Headers (e.g., auth token if needed)
        (frame) => { // onConnect
          console.log('STOMP Connected: ' + frame);
          this.isConnected = true;
          this.$message.success('已连接到实时消息服务');
          // IMPORTANT: Subscription should happen *after* a consultation is accepted
          // Do not subscribe globally here unless necessary for other features
        },
        (error) => { // onError
          console.error('STOMP Connection Error:', error);
          this.isConnected = false;
          this.$message.error('无法连接到实时消息服务，请检查后端服务是否正常运行');
          // Implement robust reconnection logic if required
        }
      );
      
       // TODO: How are consultation_created/accepted/ended signals received?
       // If via STOMP, need specific subscriptions here or elsewhere.
       // For now, we assume handleConsultationAccepted is triggered externally.
    },

    // 订阅咨询主题
    subscribeToConsultationTopic(consultationId) {
        if (!consultationId) {
            console.error("Cannot subscribe: consultationId is missing.");
            return;
        }
        if (this.stompClient && this.stompClient.connected) {
            // Unsubscribe from previous topic if exists
            if (this.subscription) {
                this.subscription.unsubscribe();
                console.log("Unsubscribed from previous topic.");
            }
            
            const topic = `/topic/consultation/${consultationId}`;
            this.subscription = this.stompClient.subscribe(topic, (message) => {
                try {
                  const chatMessage = JSON.parse(message.body);
                  this.handleReceivedMessage(chatMessage);
                } catch (e) {
                  console.error("Error parsing received message:", e, message.body);
                }
            });
            console.log(`Subscribed to ${topic}`);
            
            // Send JOIN message
            const joinMessage = {
                senderId: this.$store.state.user?.id || 'student_unknown',
                senderName: this.$store.state.user?.name || 'Student',
                type: 'JOIN',
                consultationId: consultationId
            };
            this.stompClient.send(`/app/chat.addUser/${consultationId}`, {}, JSON.stringify(joinMessage));

        } else {
            console.error("Cannot subscribe, STOMP client not connected.");
            this.$message.error("无法订阅咨询消息，连接已断开");
        }
    },
    
    // 处理收到的消息
    handleReceivedMessage(message) {
        console.log("Message received: ", message);
        // Basic validation
        if (!message || !message.type || !message.senderName) {
            console.warn("Received invalid message format:", message);
            return;
        }
        
        let displayMessage = {};
        
        if (message.type === 'CHAT') {
            displayMessage = {
                senderRole: message.senderId === (this.$store.state.user?.id || 'student_unknown') ? 'student' : 'teacher', 
                senderName: message.senderName,
                message: message.content,
                timestamp: message.timestamp || new Date().toISOString()
            };
        } else if (message.type === 'JOIN') {
            displayMessage = {
                 senderRole: 'system', 
                 senderName: 'System',
                 message: `${message.senderName} 已加入咨询。`,
                 timestamp: message.timestamp || new Date().toISOString()
            };
        } else if (message.type === 'LEAVE') { // Assuming LEAVE type exists
             displayMessage = {
                 senderRole: 'system',
                 senderName: 'System',
                 message: `${message.senderName} 已离开咨询。`,
                 timestamp: message.timestamp || new Date().toISOString()
             };
        }
        
        if (displayMessage.message) { // Only push if we have something to display
           this.consultationMessages.push(displayMessage);
           // Auto-scroll
        this.$nextTick(() => {
          const container = this.$refs.messagesContainer;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        });
        }
    },

    // 教师接受咨询后的处理逻辑 (Example)
    // This method needs to be TRIGGERED somehow (e.g., after a successful REST call response, 
    // or by subscribing to a user-specific STOMP queue like /queue/consultations/{userId})
    handleConsultationAccepted(data) { 
      console.log("Handling Consultation Accepted: ", data);
      if (!data || !data.requestId) {
        console.error("Invalid data received for consultation accepted.");
        return;
      }
      
      // Ensure we have a consultationId (might be same as requestId or a separate field)
      const consultationId = data.consultationId || data.requestId;
      if (!consultationId) {
          console.error("Consultation ID is missing in accepted data.");
          return;
      }
      
      if (this.waitingTimer) {
          clearInterval(this.waitingTimer);
          this.waitingTimer = null;
      }
          this.waitingForTeacher = false;
      this.activeConsultation = {
        requestId: data.requestId, 
        teacherName: data.teacherName || 'Teacher', // Use actual teacher name
        consultationId: consultationId 
      };
      this.$message({
        type: 'success',
        message: `教师 ${this.activeConsultation.teacherName} 已接受您的咨询请求`
      });
      // Subscribe to the topic now!
      this.subscribeToConsultationTopic(this.activeConsultation.consultationId);
    },

    // 断开STOMP连接
    disconnectStomp() {
       if (this.subscription) {
           this.subscription.unsubscribe();
           this.subscription = null;
           console.log("Unsubscribed from STOMP topic.");
          }
       if (this.stompClient && this.stompClient.connected) {
           this.stompClient.disconnect(() => {
               console.log("STOMP Disconnected.");
               this.isConnected = false;
          });
       } else {
           console.log("STOMP client already disconnected or not initialized.");
       }
    },

    // 模拟教师接受咨询
    simulateTeacherAccept() {
      // 实现模拟教师接受咨询的逻辑
      console.log("模拟教师接受咨询");
      this.handleConsultationAccepted({
        requestId: this.requestId,
        teacherName: this.selectedTeacher?.name || '模拟教师',
        consultationId: this.requestId
      });
    }
  },
  created() {
    this.fetchTeachers();
    // Do not connect immediately, connect when needed or upon user action?
    // Or connect here and handle state properly.
    this.initializeSocket();
  },
  beforeDestroy() {
    // 清除定时器
    if (this.waitingTimer) {
      clearInterval(this.waitingTimer);
    }
    
    // 断开STOMP连接
    this.disconnectStomp();
    
    // // Original cleanup logic
    // // If using socket.io, this would be needed:
    // if (this.activeConsultation) {
    //   this.socket.emit('end_consultation', {
    //     requestId: this.activeConsultation.requestId,
    //     reason: '学生离开了页面'
    //   });
    // }
    // if (this.socket) {
    //   this.socket.disconnect();
    // }
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