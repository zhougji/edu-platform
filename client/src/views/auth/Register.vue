<template>
  <div class="auth-page register-page">
    <div class="auth-container">
      <div class="auth-logo-container">
        <img src="/logo.png" alt="启明隅教育" class="auth-logo" />
        <h1 class="auth-title">启明隅教育平台</h1>
      </div>
      
      <div class="form-container">
        <h2 class="form-title">用户注册</h2>
        
        <div v-if="error" class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <span>{{ error }}</span>
        </div>
        
        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="form-group">
            <label for="name">姓名</label>
            <div class="input-group">
              <i class="fas fa-user input-icon"></i>
              <input
                type="text"
                id="name"
                v-model="formData.name"
                required
                placeholder="请输入您的姓名"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="email">邮箱</label>
            <div class="input-group">
              <i class="fas fa-envelope input-icon"></i>
              <input
                type="email"
                id="email"
                v-model="formData.email"
                required
                placeholder="请输入邮箱地址"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="password">密码</label>
            <div class="input-group">
              <i class="fas fa-lock input-icon"></i>
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model="formData.password"
                required
                placeholder="请输入密码"
              />
              <button 
                type="button" 
                class="password-toggle" 
                @click="togglePasswordVisibility"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="role">用户类型</label>
            <div class="input-group">
              <i class="fas fa-user-tag input-icon"></i>
              <select id="role" v-model="formData.role" required>
                <option value="student">学生</option>
                <option value="teacher">教师</option>
              </select>
            </div>
          </div>
          
          <div class="form-options">
            <div class="agree-terms">
              <input type="checkbox" id="agreeTerms" v-model="formData.agreeTerms" required />
              <label for="agreeTerms">
                我已阅读并同意
                <router-link to="/terms" class="terms-link">用户协议</router-link>
                和
                <router-link to="/privacy" class="privacy-link">隐私政策</router-link>
              </label>
            </div>
          </div>
          
          <button type="submit" class="submit-btn" :disabled="isLoading || !formData.agreeTerms">
            <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
            <span>{{ isLoading ? '注册中...' : '注册' }}</span>
          </button>
        </form>
        
        <div class="auth-links">
          <p>
            已有账号? 
            <router-link to="/login" class="login-link">
              立即登录
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../../services/authService'

export default {
  name: 'Register',
  setup() {
    const router = useRouter()
    const isLoading = ref(false)
    const error = ref('')
    const showPassword = ref(false)
    
    const formData = reactive({
      name: '',
      email: '',
      password: '',
      role: 'student',
      agreeTerms: false
    })
    
    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }
    
    const handleSubmit = async () => {
      try {
        isLoading.value = true
        error.value = ''
        
        await register(formData)
        
        // 注册成功，跳转到登录页
        router.push('/login?registered=true')
      } catch (err) {
        error.value = err.message || '注册失败，请重试'
        console.error('注册错误:', err)
      } finally {
        isLoading.value = false
      }
    }
    
    return {
      formData,
      isLoading,
      error,
      showPassword,
      togglePasswordVisibility,
      handleSubmit
    }
  }
}
</script> 