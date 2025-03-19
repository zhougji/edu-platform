<template>
  <div class="page-container">
    <el-card class="page-card">
      <h2>AI辅助学习</h2>
      <el-form @submit.native.prevent="submitQuestion">
        <el-form-item label="您的学习问题">
          <el-input 
            v-model="question" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入您想要获取建议的学习问题...">
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            @click="submitQuestion" 
            :loading="loading">
            获取AI学习建议
          </el-button>
        </el-form-item>
      </el-form>
      
      <div v-if="aiSuggestion" class="ai-content">
        <h3>AI学习建议</h3>
        <div class="suggestion-content">{{ aiSuggestion }}</div>
      </div>
      
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="true"
        @close="error = ''">
      </el-alert>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios';
import { getToken } from '@/utils/auth';

export default {
  name: "AiLearning",
  data() {
    return {
      question: '',
      aiSuggestion: '',
      loading: false,
      error: ''
    }
  },
  methods: {
    submitQuestion() {
      if (!this.question.trim()) {
        this.error = '请输入学习问题';
        return;
      }
      
      this.loading = true;
      this.error = '';
      
      axios.post('http://localhost:5000/api/ai-learning', {
        query: this.question,
        context: '学生在线教育平台用户'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': getToken()
        }
      })
      .then(res => {
        this.aiSuggestion = res.data.suggestion;
        this.loading = false;
      })
      .catch(err => {
        console.error('获取AI建议失败:', err);
        this.error = err.response?.data?.message || '获取AI建议失败，请稍后重试';
        this.loading = false;
      });
    }
  }
}
</script>

<style scoped>
.page-card {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
}
.ai-content {
  margin-top: 20px;
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
}
.suggestion-content {
  white-space: pre-line;
  line-height: 1.6;
}
</style>
