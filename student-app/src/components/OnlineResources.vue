<template>
  <div class="page-container">
    <el-card class="page-card">
      <h2>在线资源</h2>
      
      <!-- 搜索和筛选 -->
      <div class="search-container">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索资源..." 
          prefix-icon="el-icon-search"
          class="search-input"
          @keyup.enter="searchResources"
        ></el-input>
        
        <div class="filters">
          <el-select v-model="filters.subject" placeholder="学科" clearable @change="filterResources">
            <el-option label="全部学科" value=""></el-option>
            <el-option label="数学" value="math"></el-option>
            <el-option label="语文" value="chinese"></el-option>
            <el-option label="英语" value="english"></el-option>
            <el-option label="物理" value="physics"></el-option>
            <el-option label="化学" value="chemistry"></el-option>
            <el-option label="生物" value="biology"></el-option>
            <el-option label="历史" value="history"></el-option>
            <el-option label="地理" value="geography"></el-option>
            <el-option label="政治" value="politics"></el-option>
          </el-select>
          
          <el-select v-model="filters.level" placeholder="难度" clearable @change="filterResources">
            <el-option label="全部难度" value=""></el-option>
            <el-option label="初级" value="beginner"></el-option>
            <el-option label="中级" value="intermediate"></el-option>
            <el-option label="高级" value="advanced"></el-option>
          </el-select>
          
          <el-select v-model="filters.type" placeholder="类型" clearable @change="filterResources">
            <el-option label="全部类型" value=""></el-option>
            <el-option label="视频" value="video"></el-option>
            <el-option label="文档" value="document"></el-option>
            <el-option label="习题" value="exercise"></el-option>
          </el-select>
        </div>
      </div>
      
      <!-- 资源列表 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else-if="filteredResources.length === 0" class="empty-container">
        <el-empty description="没有找到符合条件的资源"></el-empty>
      </div>
      
      <div v-else class="resources-container">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" v-for="resource in filteredResources" :key="resource.id">
            <el-card class="resource-card" shadow="hover">
              <div class="resource-header">
                <div class="resource-type">
                  <el-tag :type="getTagType(resource.type)">{{ getResourceTypeLabel(resource.type) }}</el-tag>
                  <el-tag type="info" size="small" class="level-tag">{{ getLevelLabel(resource.level) }}</el-tag>
                </div>
                <h3 class="resource-title">{{ resource.title }}</h3>
                <div class="resource-subject">{{ getSubjectLabel(resource.subject) }}</div>
              </div>
              
              <div class="resource-preview" v-if="resource.thumbnail">
                <img :src="resource.thumbnail" :alt="resource.title">
              </div>
              <div class="resource-preview no-thumbnail" v-else>
                <i class="el-icon-document"></i>
              </div>
              
              <div class="resource-description">{{ resource.description }}</div>
              
              <div class="resource-footer">
                <span class="resource-date">更新于: {{ resource.updatedAt }}</span>
                <el-button type="primary" size="small" @click="viewResource(resource)">查看资源</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <div class="pagination-container">
          <el-pagination
            background
            layout="prev, pager, next"
            :total="totalResources"
            :page-size="pageSize"
            :current-page="currentPage"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </div>
      </div>
      
      <!-- 资源详情对话框 -->
      <el-dialog v-model="dialogVisible" :title="currentResource?.title || '资源详情'" width="70%">
        <div v-if="currentResource" class="resource-detail">
          <div class="resource-meta">
            <div>
              <label>学科：</label>
              <span>{{ getSubjectLabel(currentResource.subject) }}</span>
            </div>
            <div>
              <label>难度：</label>
              <span>{{ getLevelLabel(currentResource.level) }}</span>
            </div>
            <div>
              <label>类型：</label>
              <span>{{ getResourceTypeLabel(currentResource.type) }}</span>
            </div>
            <div>
              <label>上传者：</label>
              <span>{{ currentResource.author }}</span>
            </div>
          </div>
          
          <div class="resource-content">
            <div v-if="currentResource.type === 'video'" class="video-container">
              <video controls :src="currentResource.url" width="100%"></video>
            </div>
            <div v-else-if="currentResource.type === 'document'" class="document-container">
              <iframe :src="currentResource.url" width="100%" height="500px"></iframe>
            </div>
            <div v-else-if="currentResource.type === 'exercise'" class="exercise-container">
              <div v-for="(question, index) in currentResource.content" :key="index" class="question">
                <div class="question-text">{{ index + 1 }}. {{ question.text }}</div>
                <div v-if="question.options" class="options">
                  <div v-for="(option, optIndex) in question.options" :key="optIndex" class="option">
                    <el-radio v-model="question.userAnswer" :label="optIndex">{{ option }}</el-radio>
                  </div>
                </div>
                <div v-else class="answer-input">
                  <el-input v-model="question.userAnswer" placeholder="输入答案..."></el-input>
                </div>
              </div>
              <div class="submit-container">
                <el-button type="primary" @click="submitAnswers">提交答案</el-button>
              </div>
            </div>
          </div>
          
          <div class="resource-actions">
            <el-button type="success" icon="el-icon-download" @click="downloadResource">下载资源</el-button>
            <el-button type="primary" icon="el-icon-star-off" @click="favoriteResource">收藏资源</el-button>
            <el-button icon="el-icon-share" @click="shareResource">分享资源</el-button>
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
  name: "OnlineResources",
  data() {
    return {
      searchQuery: '',
      resources: [],
      filteredResources: [],
      filters: {
        subject: '',
        level: '',
        type: ''
      },
      loading: true,
      currentPage: 1,
      pageSize: 9,
      totalResources: 0,
      dialogVisible: false,
      currentResource: null
    }
  },
  created() {
    this.fetchResources()
  },
  methods: {
    fetchResources() {
      this.loading = true
      axios.get(`http://localhost:5000/api/resources?page=${this.currentPage}&limit=${this.pageSize}`)
        .then(res => {
          this.resources = res.data.resources || []
          this.totalResources = res.data.total || 0
          this.filteredResources = [...this.resources]
        })
        .catch(err => {
          console.error('获取资源失败', err)
          ElMessage.error('获取资源失败')
        })
        .finally(() => {
          this.loading = false
        })
    },
    
    searchResources() {
      if (!this.searchQuery.trim()) {
        this.filterResources()
        return
      }
      
      this.loading = true
      axios.get(`http://localhost:5000/api/resources/search?q=${this.searchQuery}&subject=${this.filters.subject}&level=${this.filters.level}&type=${this.filters.type}&page=${this.currentPage}&limit=${this.pageSize}`)
        .then(res => {
          this.resources = res.data.resources || []
          this.totalResources = res.data.total || 0
          this.filteredResources = [...this.resources]
        })
        .catch(err => {
          console.error('搜索资源失败', err)
          ElMessage.error('搜索资源失败')
        })
        .finally(() => {
          this.loading = false
        })
    },
    
    filterResources() {
      // 使用客户端过滤（当数据集不大时）
      if (!this.filters.subject && !this.filters.level && !this.filters.type) {
        this.filteredResources = [...this.resources]
        return
      }
      
      this.filteredResources = this.resources.filter(resource => {
        return (!this.filters.subject || resource.subject === this.filters.subject) &&
               (!this.filters.level || resource.level === this.filters.level) &&
               (!this.filters.type || resource.type === this.filters.type)
      })
    },
    
    handleCurrentChange(page) {
      this.currentPage = page
      this.fetchResources()
    },
    
    viewResource(resource) {
      this.currentResource = resource
      this.dialogVisible = true
      
      // 记录访问历史
      const userId = localStorage.getItem('userId')
      if (userId) {
        axios.post('http://localhost:5000/api/resource-views', {
          userId,
          resourceId: resource.id
        }).catch(err => console.error('记录访问历史失败', err))
      }
    },
    
    downloadResource() {
      if (!this.currentResource) return
      
      ElMessage.success('开始下载资源')
      // 实际下载逻辑
      window.open(this.currentResource.downloadUrl || this.currentResource.url, '_blank')
    },
    
    favoriteResource() {
      if (!this.currentResource) return
      
      const userId = localStorage.getItem('userId')
      if (!userId) {
        ElMessage.warning('请先登录')
        this.$router.push('/login')
        return
      }
      
      axios.post('http://localhost:5000/api/favorites', {
        userId,
        resourceId: this.currentResource.id
      })
        .then(() => {
          ElMessage.success('收藏成功')
        })
        .catch(err => {
          console.error('收藏失败', err)
          ElMessage.error('收藏失败')
        })
    },
    
    shareResource() {
      if (!this.currentResource) return
      
      // 复制分享链接到剪贴板
      const shareUrl = `${window.location.origin}/resource/${this.currentResource.id}`
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          ElMessage.success('链接已复制到剪贴板')
        })
        .catch(() => {
          ElMessage.error('复制链接失败')
        })
    },
    
    submitAnswers() {
      if (!this.currentResource || this.currentResource.type !== 'exercise') return
      
      const answers = this.currentResource.content.map(question => ({
        questionId: question.id,
        answer: question.userAnswer
      }))
      
      axios.post('http://localhost:5000/api/exercise-answers', {
        resourceId: this.currentResource.id,
        userId: localStorage.getItem('userId'),
        answers
      })
        .then(res => {
          ElMessage.success('答案提交成功')
          // 显示正确答案和解析
          this.currentResource.content = this.currentResource.content.map((question, index) => ({
            ...question,
            correctAnswer: res.data.correctAnswers[index].answer,
            explanation: res.data.correctAnswers[index].explanation,
            isCorrect: question.userAnswer === res.data.correctAnswers[index].answer
          }))
        })
        .catch(err => {
          console.error('提交答案失败', err)
          ElMessage.error('提交答案失败')
        })
    },
    
    getTagType(type) {
      const types = {
        'video': 'danger',
        'document': 'primary',
        'exercise': 'success'
      }
      return types[type] || 'info'
    },
    
    getResourceTypeLabel(type) {
      const labels = {
        'video': '视频',
        'document': '文档',
        'exercise': '习题'
      }
      return labels[type] || '其他'
    },
    
    getLevelLabel(level) {
      const labels = {
        'beginner': '初级',
        'intermediate': '中级',
        'advanced': '高级'
      }
      return labels[level] || '未知'
    },
    
    getSubjectLabel(subject) {
      const labels = {
        'math': '数学',
        'chinese': '语文',
        'english': '英语',
        'physics': '物理',
        'chemistry': '化学',
        'biology': '生物',
        'history': '历史',
        'geography': '地理',
        'politics': '政治'
      }
      return labels[subject] || '其他'
    }
  }
}
</script>

<style scoped>
.page-container {
  padding: 20px;
}
.page-card {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
}
.search-container {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}
.search-input {
  width: 300px;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.resources-container {
  margin-top: 20px;
}
.resource-card {
  height: 100%;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
}
.resource-header {
  margin-bottom: 15px;
}
.resource-type {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}
.level-tag {
  margin-left: 5px;
}
.resource-title {
  margin: 10px 0;
  font-size: 18px;
  font-weight: bold;
  height: 44px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.resource-subject {
  color: #666;
  font-size: 14px;
}
.resource-preview {
  height: 150px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  margin-bottom: 15px;
  border-radius: 4px;
}
.resource-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.no-thumbnail {
  font-size: 48px;
  color: #dcdfe6;
}
.resource-description {
  margin-bottom: 15px;
  height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  color: #606266;
  font-size: 14px;
}
.resource-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}
.resource-date {
  color: #909399;
  font-size: 12px;
}
.pagination-container {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}
.empty-container, .loading-container {
  margin: 40px 0;
  padding: 20px;
}
.resource-detail {
  padding: 10px;
}
.resource-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}
.resource-meta label {
  font-weight: bold;
  margin-right: 5px;
}
.resource-content {
  margin-bottom: 30px;
}
.video-container, .document-container {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}
.exercise-container {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
.question {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #e1e1e1;
}
.question-text {
  font-weight: bold;
  margin-bottom: 10px;
}
.options {
  margin-left: 20px;
}
.option {
  margin-bottom: 8px;
}
.submit-container {
  margin-top: 20px;
  text-align: center;
}
.resource-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 15px;
}
</style>
