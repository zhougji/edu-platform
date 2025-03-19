<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon">
            <i class="el-icon-s-management"></i>
          </div>
          <div class="stat-content">
            <h3>上传资源</h3>
            <p class="stat-number">{{ stats.resourceCount }}</p>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon">
            <i class="el-icon-chat-dot-round"></i>
          </div>
          <div class="stat-content">
            <h3>待处理咨询</h3>
            <p class="stat-number">{{ stats.pendingConsultCount }}</p>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon">
            <i class="el-icon-s-cooperation"></i>
          </div>
          <div class="stat-content">
            <h3>进行中咨询</h3>
            <p class="stat-number">{{ stats.activeConsultCount }}</p>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon">
            <i class="el-icon-view"></i>
          </div>
          <div class="stat-content">
            <h3>资源浏览</h3>
            <p class="stat-number">{{ stats.totalViews }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="dashboard-row">
      <el-col :span="16">
        <el-card class="chart-card">
          <div slot="header">
            <span>近期咨询统计</span>
          </div>
          <div class="chart-placeholder">
            <p>这里将展示咨询数据图表</p>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="recent-card">
          <div slot="header">
            <span>最近活动</span>
          </div>
          <div class="activity-list">
            <div v-for="(activity, index) in recentActivities" :key="index" class="activity-item">
              <div class="activity-time">{{ activity.time }}</div>
              <div class="activity-content">{{ activity.content }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="dashboard-row">
      <el-col :span="12">
        <el-card>
          <div slot="header">
            <span>待处理咨询请求</span>
            <router-link to="/consultation-requests" class="card-extra">
              查看全部
            </router-link>
          </div>
          <el-table :data="pendingConsultations" style="width: 100%">
            <el-table-column prop="studentName" label="学生" width="120"></el-table-column>
            <el-table-column prop="subject" label="科目" width="100"></el-table-column>
            <el-table-column prop="createdAt" label="请求时间"></el-table-column>
            <el-table-column fixed="right" label="操作" width="120">
              <template #default="scope">
                <el-button
                  size="small"
                  type="primary"
                  @click="handleAccept(scope.row.id)"
                >接受</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <div slot="header">
            <span>最新上传资源</span>
            <router-link to="/resource-management" class="card-extra">
              管理资源
            </router-link>
          </div>
          <el-table :data="recentResources" style="width: 100%">
            <el-table-column prop="title" label="标题"></el-table-column>
            <el-table-column prop="type" label="类型" width="100"></el-table-column>
            <el-table-column prop="uploadDate" label="上传时间" width="180"></el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'Dashboard',
  setup() {
    const store = useStore()
    const router = useRouter()
    
    const stats = ref({
      resourceCount: 0,
      pendingConsultCount: 0,
      activeConsultCount: 0,
      totalViews: 0
    })
    
    const pendingConsultations = ref([])
    const recentResources = ref([])
    const recentActivities = ref([
      { time: '2小时前', content: '回复了学生小明的数学咨询' },
      { time: '昨天', content: '上传了《高中物理知识点总结》' },
      { time: '2天前', content: '完成了与学生小红的语文咨询' },
      { time: '3天前', content: '上传了《初中英语语法练习》' }
    ])
    
    onMounted(async () => {
      try {
        // 假设这里从API获取数据
        stats.value = {
          resourceCount: 25,
          pendingConsultCount: 5,
          activeConsultCount: 2,
          totalViews: 1243
        }
        
        pendingConsultations.value = [
          { id: 1, studentName: '张三', subject: '数学', createdAt: '2023-03-15 14:30' },
          { id: 2, studentName: '李四', subject: '物理', createdAt: '2023-03-15 15:45' },
          { id: 3, studentName: '王五', subject: '化学', createdAt: '2023-03-16 09:20' }
        ]
        
        recentResources.value = [
          { id: 1, title: '高中数学必修一知识点', type: '文档', uploadDate: '2023-03-16 10:30' },
          { id: 2, title: '初中英语语法练习', type: '习题', uploadDate: '2023-03-15 14:20' },
          { id: 3, title: '物理实验视频教程', type: '视频', uploadDate: '2023-03-14 16:45' }
        ]
      } catch (error) {
        console.error('获取控制台数据失败:', error)
      }
    })
    
    const handleAccept = (id) => {
      // 处理接受咨询
      router.push(`/consultation/${id}`)
    }
    
    return {
      stats,
      pendingConsultations,
      recentResources,
      recentActivities,
      handleAccept
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-row {
  margin-top: 20px;
}

.stat-card {
  height: 120px;
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  font-size: 48px;
  color: #409EFF;
  margin-right: 20px;
}

.stat-content h3 {
  font-size: 16px;
  color: #606266;
  margin: 0 0 10px 0;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin: 0;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  padding: 12px 0;
  border-bottom: 1px solid #EBEEF5;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.activity-content {
  color: #606266;
}

.card-extra {
  float: right;
  padding: 3px 0;
  text-decoration: none;
  font-size: 14px;
  color: #409EFF;
}
</style> 