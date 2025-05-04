<template>
  <div class="login-container">
    <el-card class="login-card box-card">
      <div slot="header" class="header">
        <h2 class="text-center">教师登录</h2>
      </div>
      
      <el-form :model="credentials" ref="loginForm" @submit.native.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input 
            v-model="credentials.username" 
            placeholder="用户名" 
            prefix-icon="el-icon-user"
            clearable
          ></el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="credentials.password" 
            type="password" 
            placeholder="密码" 
            prefix-icon="el-icon-lock"
            show-password
            clearable
            @keyup.enter.native="handleLogin"
          ></el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleLogin" 
            :loading="loading" 
            style="width: 100%; height: 45px; font-size: 16px; border-radius: 25px; margin-top: 10px;"
          >
            登录
          </el-button>
        </el-form-item>
        
        <div class="register-link">
          还没有账号？<router-link to="/register">立即注册</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Login',
  created() {
    // Immediately redirect to home if this page is somehow accessed
    this.$router.replace('/home');
  },
  data() {
    return {
      credentials: {
        username: '',
        password: ''
      },
      loading: false
    }
  },
  methods: {
    handleLogin() {
      // Directly execute the async logic
      (async () => {
        this.loading = true
        try {
          // 准备符合后端 /api/auth/login 接口的数据格式
          const loginData = {
            contactType: 'username', // 假设使用用户名登录
            contact: this.credentials.username,
            password: this.credentials.password,
            role: 'teacher' // 明确指定角色
          };

          console.log('发送教师登录请求:', loginData);

          // 使用正确的统一认证端点
          const response = await axios.post('/auth/login', loginData)
          
          // Store token and user info (后端返回的是 user 对象)
          localStorage.setItem('teacherToken', response.data.token)
          localStorage.setItem('teacherInfo', JSON.stringify(response.data.user))
          
          // Update Axios default headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
          
          // Show success message using Element UI
          this.$message({
            message: '登录成功!',
            type: 'success'
          });
          
          // Redirect to dashboard
          this.$router.push('/') // 确认 '/' 是教师端的仪表盘路由
        } catch (error) {
          console.error('Login failed:', error.response?.data || error.message)
          // Show error message using Element UI
          this.$message.error(error.response?.data?.message || '无效的凭据');
        } finally {
          this.loading = false
        }
      })(); // Immediately invoke the async function
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh; /* Ensure takes full height */
  /* Suggestion: Add background image here */
  /* background: url('/path/to/your/login-background.jpg') center center / cover no-repeat; */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* Example gradient background */
  padding: 20px;
}

.login-card {
  width: 400px;
  max-width: 90%; /* Ensure responsiveness */
  border-radius: 20px; /* More rounded corners */
  background: rgba(255, 255, 255, 0.15); /* Semi-transparent background */
  backdrop-filter: blur(15px); /* Increased blur for glass effect */
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37); /* Softer shadow */
}

.header {
  text-align: center;
  padding-bottom: 0; /* Remove default header padding */
}

.header h2 {
  color: #fff; /* White text for header */
  margin-bottom: 0;
  font-weight: 300; /* Lighter font weight */
}

/* Style Element UI components */
.el-form-item {
  margin-bottom: 20px;
}

/* Style input fields for the glass effect */
::v-deep .el-input__inner {
  background-color: rgba(255, 255, 255, 0.2) !important; 
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 25px !important; /* Rounded inputs */
  color: #fff !important; /* White text in input */
  height: 45px; /* Taller inputs */
  line-height: 45px;
}

::v-deep .el-input__inner::placeholder {
  color: rgba(255, 255, 255, 0.7) !important; /* Lighter placeholder text */
}

/* Adjust icon color */
::v-deep .el-input__prefix .el-input__icon,
::v-deep .el-input__suffix .el-input__icon {
  color: rgba(255, 255, 255, 0.8) !important;
  line-height: 45px; /* Center icon vertically */
}

.register-link {
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
}

.register-link,
.register-link a {
  color: #eee; /* Lighter link color */
}

.register-link a:hover {
  color: #fff;
  text-decoration: underline;
}
</style> 