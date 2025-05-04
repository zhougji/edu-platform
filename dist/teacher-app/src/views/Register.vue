<template>
  <div class="register-container">
    <el-card class="register-card box-card">
      <div slot="header" class="header">
        <h2 class="text-center">教师注册</h2>
      </div>
      
      <el-form :model="credentials" ref="registerForm" @submit.native.prevent="submitRegistration">
        <el-form-item prop="username">
          <el-input 
            v-model="credentials.username" 
            placeholder="设置用户名" 
            prefix-icon="el-icon-user"
            clearable
          ></el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="credentials.password" 
            type="password" 
            placeholder="设置密码" 
            prefix-icon="el-icon-lock"
            show-password
            clearable
          ></el-input>
        </el-form-item>
        
        <!-- Optional: Add confirm password if needed -->
        <!-- 
        <el-form-item prop="confirmPassword">
          <el-input 
            v-model="confirmPassword" 
            type="password" 
            placeholder="确认密码" 
            prefix-icon="el-icon-lock"
            show-password
            clearable
          ></el-input>
        </el-form-item>
        -->
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="submitRegistration" 
            :loading="loading" 
            style="width: 100%; height: 45px; font-size: 16px; border-radius: 25px; margin-top: 10px;"
          >
            注册
          </el-button>
        </el-form-item>
        
        <div class="login-link">
          已有账号？<router-link to="/login">立即登录</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Register',
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
      // confirmPassword: '', // Uncomment if using confirm password
      loading: false
    }
  },
  methods: {
    submitRegistration() {
      // Optional: Add confirm password validation
      // if (this.credentials.password !== this.confirmPassword) {
      //   this.$message.error('两次输入的密码不一致');
      //   return;
      // }

      // Since we removed validation rules, we can directly call the async logic
      // If you re-add validation rules later, you'll need the validate call back
      // this.$refs.registerForm.validate(async (valid) => {
      //   if (valid) {
      //     ...
      //   }
      // });
      
      // Directly execute the async logic
      (async () => {
        this.loading = true
        try {
          await axios.post('/auth/teacher/register', this.credentials)
          
          this.$message({
            message: '注册成功! 请登录。',
            type: 'success'
          });
          this.$router.push('/login')
        } catch (error) {
          console.error('Registration failed:', error.response?.data || error.message)
          this.$message.error(error.response?.data?.message || '注册失败，请稍后重试');
        } finally {
          this.loading = false
        }
      })(); // Immediately invoke the async function
    }
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  /* Suggestion: Add background image here */
  /* background: url('/path/to/your/register-background.jpg') center center / cover no-repeat; */
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); /* Example gradient background - reversed from login */
  padding: 20px;
}

.register-card {
  width: 400px;
  max-width: 90%;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

.header {
  text-align: center;
  padding-bottom: 0;
}

.header h2 {
  color: #fff;
  margin-bottom: 0;
  font-weight: 300;
}

.el-form-item {
  margin-bottom: 20px;
}

::v-deep .el-input__inner {
  background-color: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 25px !important;
  color: #fff !important;
  height: 45px;
  line-height: 45px;
}

::v-deep .el-input__inner::placeholder {
  color: rgba(255, 255, 255, 0.7) !important;
}

::v-deep .el-input__prefix .el-input__icon,
::v-deep .el-input__suffix .el-input__icon {
  color: rgba(255, 255, 255, 0.8) !important;
  line-height: 45px;
}

.login-link {
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
}

.login-link,
.login-link a {
  color: #eee;
}

.login-link a:hover {
  color: #fff;
  text-decoration: underline;
}
</style> 