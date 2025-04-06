<template>
  <div class="auth-page login-page">
    <div class="auth-container">
      <div class="auth-logo-container">
        <img src="/logo.png" alt="启明隅教育" class="auth-logo" />
        <h1 class="auth-title">启明隅教育平台</h1>
      </div>
      
      <div class="form-container">
        <h2 class="form-title">用户登录</h2>
        
        <div v-if="error" class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <span>{{ error }}</span>
        </div>
        
        <form @submit.prevent="handleSubmit" class="auth-form">
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
          
          <div class="form-options">
            <div class="remember-me">
              <input type="checkbox" id="remember" v-model="formData.rememberMe" />
              <label for="remember">记住我</label>
            </div>
            <router-link to="/forgot-password" class="forgot-password">
              忘记密码?
            </router-link>
          </div>
          
          <button type="submit" class="submit-btn" :disabled="isLoading">
            <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
            <span>{{ isLoading ? '登录中...' : '登录' }}</span>
          </button>
        </form>
        
        <div class="auth-links">
          <p>
            还没有账号? 
            <router-link to="/register" class="register-link">
              立即注册
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
import { login } from '../../services/authService'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const isLoading = ref(false)
    const error = ref('')
    const showPassword = ref(false)
    
    const formData = reactive({
      email: '',
      password: '',
      rememberMe: false
    })
    
    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }
    
    const handleSubmit = async () => {
      try {
        isLoading.value = true
        error.value = ''
        
        const userData = await login(formData.email, formData.password)
        
        // 根据用户角色跳转到相应的首页
        switch (userData.role) {
          case 'student':
            router.push('/student/dashboard')
            break
          case 'teacher':
            router.push('/teacher/dashboard')
            break
          case 'admin':
            router.push('/admin/dashboard')
            break
          default:
            router.push('/')
        }
      } catch (err) {
        error.value = err.message || '登录失败，请检查您的邮箱和密码'
        console.error('登录错误:', err)
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