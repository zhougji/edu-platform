<template>
  <div class="dashboard-container">
    <el-row :gutter="20" class="welcome-row">
      <el-col :span="24">
        <el-card shadow="never" class="welcome-card">
          <h2>欢迎回来, {{ teacherName || '老师' }}!</h2>
          <p>查看您的待办事项和教学概览。</p>
        </el-card>
      </el-col>
    </el-row>

    <!-- Overview Stats -->
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stat-card stat-card-videos">
          <div class="stat-icon">
             <i class="el-icon-video-camera"></i>
          </div>
          <div class="stat-content">
            <div class="stat-title">视频资源</div>
            <div class="stat-value">{{ videoCount }}</div>
             <router-link to="/resources" class="stat-link">管理视频 &rarr;</router-link>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stat-card stat-card-pending">
          <div class="stat-icon">
             <i class="el-icon-bell"></i>
          </div>
          <div class="stat-content">
            <div class="stat-title">待处理辅导</div>
            <div class="stat-value">{{ pendingRequestCount }}</div>
            <el-button type="text" class="stat-link" @click="goToPendingConsultations">处理请求 &rarr;</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stat-card stat-card-processed">
           <div class="stat-icon">
             <i class="el-icon-finished"></i>
          </div>
          <div class="stat-content">
            <div class="stat-title">已处理请求</div>
            <div class="stat-value">{{ processedRequestCount }}</div>
             <span class="stat-link inactive">(历史记录)</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Recent Videos & Pending Requests -->
    <el-row :gutter="20">
      <el-col :xs="24" :md="14">
        <el-card shadow="never" class="dashboard-card">
          <div slot="header" class="clearfix">
            <span>最近上传的视频</span>
            <el-button style="float: right; padding: 3px 0" type="text" @click="goToResources">查看全部</el-button>
          </div>
          <el-table :data="recentVideos" style="width: 100%" v-loading="loading.videos" height="300px">
            <el-table-column prop="title" label="标题" show-overflow-tooltip></el-table-column>
            <el-table-column prop="subject" label="科目" width="100"></el-table-column>
            <el-table-column prop="grade" label="年级" width="100"></el-table-column>
            <el-table-column label="上传日期" width="140">
              <template slot-scope="scope">
                <span>{{ formatDate(scope.row.createdAt) }}</span>
              </template>
            </el-table-column>
             <el-table-column label="操作" width="80">
              <template slot-scope="scope">
                <el-button type="primary" icon="el-icon-edit" size="mini" circle @click="editVideo(scope.row.id)"></el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="!loading.videos && recentVideos.length === 0" class="empty-state">
            暂无最近上传的视频。
             <el-button type="primary" size="small" @click="goToResources" style="margin-left: 10px;">上传第一个视频</el-button>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="10">
        <el-card shadow="never" class="dashboard-card">
          <div slot="header" class="clearfix">
            <span>待处理辅导请求</span>
            <el-button style="float: right; padding: 3px 0" type="text" @click="goToPendingConsultations">查看所有待处理</el-button>
          </div>
          <div class="pending-requests-list" v-loading="loading.requests">
            <el-scrollbar height="300px">
              <div v-if="pendingRequests.length > 0">
                <div v-for="request in pendingRequests" :key="request.id" class="pending-request-item">
                  <el-avatar :size="40" :src="request.student?.avatar || defaultAvatar" class="student-avatar"></el-avatar>
                  <div class="request-info">
                    <span class="student-name">{{ request.student?.name || '未知学生' }}</span>
                    <span class="request-details">{{ request.topic || '请求聊天' }} - {{ formatTimeAgo(request.createdAt) }}</span>
                  </div>
                  <el-button type="success" size="mini" icon="el-icon-view" @click="viewRequest(request)" circle title="查看并处理"></el-button>
                </div>
              </div>
              <div v-else class="empty-state">
                当前没有待处理的辅导请求。
              </div>
            </el-scrollbar>
          </div>
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>

<script>
// import { mapState, mapActions } from 'vuex'
import axios from 'axios'
import { formatDate, formatTimeAgo } from '../utils/dateFormat'
import socketService from '../services/socketService'

export default {
  name: 'TeacherDashboard',
  data() {
    return {
      loading: {
        stats: false,
        videos: false,
        requests: false,
      },
      teacherName: '',
      videoCount: 0,
      pendingRequestCount: 0,
      processedRequestCount: 0,
      recentVideos: [],
      pendingRequests: [],
      defaultAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    }
  },
  methods: {
    formatDate,
    formatTimeAgo,
    async fetchDashboardData() {
      console.log('Executing fetchDashboardData...');
      this.loading.stats = true;
      this.loading.videos = true;
      this.loading.requests = true;
      try {
        const response = await axios.get('/api/teacher/dashboard');
        
        const data = response.data;
        this.teacherName = data.teacherName || '老师';
        this.videoCount = data.videoCount || 0;
        this.pendingRequestCount = data.pendingRequestCount || 0;
        this.processedRequestCount = data.processedRequestCount || 0;
        this.recentVideos = data.recentVideos || [];
        this.pendingRequests = data.pendingRequests || [];
        
        // 如果没有从API获取数据，则尝试从WebSocket获取
        this.fetchConsultationStats();
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        this.$message.error('无法加载仪表盘数据');
        
        // 尝试从WebSocket获取咨询数据
        this.fetchConsultationStats();
      } finally {
        this.loading.stats = false;
        this.loading.videos = false;
        this.loading.requests = false;
      }
    },
    
    // 获取咨询请求统计数据
    async fetchConsultationStats() {
      try {
        const response = await axios.get('/api/consultations/requests');
        if (response.data) {
          this.pendingRequestCount = response.data.pending.length;
          this.processedRequestCount = response.data.completed.length;
          this.pendingRequests = response.data.pending.slice(0, 5); // 只显示前5个
        }
      } catch (error) {
        console.error('Error fetching consultation stats:', error);
      }
    },
    
    goToResources() {
      this.$router.push('/resources');
    },
    
    // Rename goToChat to goToPendingConsultations and implement navigation with query
    goToPendingConsultations() {
      this.$router.push({ path: '/consultations', query: { tab: '0' } });
    },
    
    editVideo(videoId) {
      this.$message('编辑视频功能待实现: ' + videoId);
    },
    viewRequest(request) {
      // Navigate to consultations but pass specific request ID or focus on it
      // Option 1: Go to general pending tab (already handled by goToPendingConsultations)
      // this.goToPendingConsultations(); 
      
      // Option 2: Go to consultations and potentially highlight/open the specific request detail
      // This might require modification in Consultations.vue to handle `requestId` query
      this.$router.push({
        path: '/consultations',
        query: { tab: '0', requestId: request.id } // Pass requestId as well
      });
    },
    
    // 初始化WebSocket监听
    setupSocketListeners() {
      if (!socketService.state.isConnected) {
        const token = localStorage.getItem('teacherToken');
        if (token) {
          socketService.connect(token);
        }
      }
      
      // 监听新的咨询请求
      socketService.socket?.on('new_consultation_request', this.handleNewRequest);
      
      // 监听待处理请求列表更新
      socketService.socket?.on('pending_requests', this.handlePendingRequests);
      
      // 监听已完成请求列表更新
      socketService.socket?.on('completed_requests', this.handleCompletedRequests);
      
      // 监听咨询统计数据更新
      socketService.socket?.on('consultation_stats', this.handleConsultationStats);
    },
    
    // 删除WebSocket监听
    removeSocketListeners() {
      socketService.socket?.off('new_consultation_request', this.handleNewRequest);
      socketService.socket?.off('pending_requests', this.handlePendingRequests);
      socketService.socket?.off('completed_requests', this.handleCompletedRequests);
      socketService.socket?.off('consultation_stats', this.handleConsultationStats);
    },
    
    // 处理新的咨询请求
    handleNewRequest(request) {
      console.log('收到新的咨询请求:', request);
      this.pendingRequestCount++;
      
      // 将请求添加到待处理请求列表的开头
      this.pendingRequests.unshift(request);
      
      // 保持最多显示5个请求
      if (this.pendingRequests.length > 5) {
        this.pendingRequests.pop();
      }
      
      // 显示通知
      this.$notify({
        title: '新的咨询请求',
        message: `学生 ${request.studentName} 发送了一个新的咨询请求`,
        type: 'info',
        position: 'bottom-right',
        duration: 5000
      });
    },
    
    // 处理待处理请求列表更新
    handlePendingRequests(requests) {
      console.log('待处理请求列表更新:', requests);
      this.pendingRequestCount = requests.length;
      this.pendingRequests = requests.slice(0, 5); // 只显示前5个
    },
    
    // 处理已完成请求列表更新
    handleCompletedRequests(requests) {
      console.log('已完成请求列表更新:', requests);
      this.processedRequestCount = requests.length;
    },
    
    // 处理咨询统计数据更新
    handleConsultationStats(stats) {
      console.log('咨询统计数据更新:', stats);
      this.pendingRequestCount = stats.pending;
      this.processedRequestCount = stats.completed;
    }
  },
  created() {
    console.log('Home.vue component created.');
    this.fetchDashboardData();
    this.setupSocketListeners();
  },
  mounted() {
    // 确保教师认证
    if (socketService.state.isConnected && socketService.socket) {
      socketService.socket.emit('authenticate', {
        userId: localStorage.getItem('teacherId') || 'unknown',
        role: 'teacher'
      });
    }
  },
  beforeDestroy() {
    this.removeSocketListeners();
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 25px;
  background-color: #f5f7fa; /* Light background for the page */
}

.welcome-row {
  margin-bottom: 20px;
}

.welcome-card {
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  border: none;
}
.welcome-card h2 {
  margin: 0 0 5px 0;
  font-weight: 500;
}
.welcome-card p {
  margin: 0;
  opacity: 0.9;
}

.stat-card {
  border-radius: 10px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  padding: 20px;
  color: white;
  border: none;
  overflow: hidden; /* Ensure icon doesn't overflow */
  position: relative; /* For pseudo-elements or absolute positioning */
}

.stat-card-videos {
  background: linear-gradient(45deg, #f6d365 0%, #fda085 100%);
}
.stat-card-pending {
   background: linear-gradient(45deg, #ff9a9e 0%, #fecfef 100%);
}
.stat-card-processed {
  background: linear-gradient(45deg, #00c6fb 0%, #005bea 100%);
}

.stat-icon {
  font-size: 48px; /* Larger icon */
  opacity: 0.3;
  margin-right: 20px;
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
}

.stat-icon i {
    display: inline-block;
    line-height: 1; 
}

.stat-content {
  position: relative; /* Keep content above icon */
  z-index: 1;
}

.stat-title {
  font-size: 15px;
  margin-bottom: 8px;
  opacity: 0.9;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 10px;
  line-height: 1.2;
}

.stat-link {
  color: white;
  font-size: 13px;
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.2s;
}
.stat-link:hover {
  opacity: 1;
  text-decoration: underline;
}
.stat-link.inactive {
  opacity: 0.5;
  cursor: not-allowed;
}

.dashboard-card {
  margin-bottom: 20px;
  border: none; /* Remove default card border */
}

.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}
.clearfix:after {
  clear: both
}

.el-card__header {
  background-color: #ffffff;
  border-bottom: 1px solid #ebeef5; 
}



.pending-request-item {
  display: flex;
  align-items: center;
  padding: 10px 5px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.pending-request-item:last-child {
  border-bottom: none;
}

.pending-request-item:hover {
  background-color: #f9fafc;
}

.student-avatar {
  margin-right: 12px;
}

.request-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent long text overflow */
  margin-right: 10px;
}

.student-name {
  font-weight: 500;
}

.request-details {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  text-align: center;
  color: #909399;
  padding: 40px 0;
  font-size: 14px;
}

/* Override default table header */
::v-deep .el-table th {
  background-color: #f8f9fa !important;
  color: #606266 !important;
  font-weight: 500;
}

/* Ensure scrollbar looks decent */
.el-scrollbar__wrap {
  overflow-x: hidden; 
}

</style> 