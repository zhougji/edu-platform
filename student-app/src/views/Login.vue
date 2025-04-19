<template>
  <div class="login-register-container">
    <div class="left-panel">
      <!-- 改为使用背景图片，不再需要单独的图片元素 -->
      <div class="brand-placeholder">
          <i class="el-icon-reading main-icon"></i>
          <h1>启明隅</h1>
          <p>点亮你的学习之路</p>
       </div>
    </div>
    <div class="right-panel">
      <el-card class="form-card">
        <div slot="header" class="form-header">
          <span>学生登录</span>
        </div>
        <el-form @submit.native.prevent="handleLogin" :model="loginForm" :rules="loginRules" ref="loginForm" label-width="80px">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="el-icon-user"></el-input>
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input type="password" v-model="loginForm.password" placeholder="请输入密码" prefix-icon="el-icon-lock" show-password></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleLogin" :loading="loading" class="login-button">登录</el-button>
          </el-form-item>
        </el-form>
        <div class="form-footer">
          <el-link type="info" @click="goToForgotPassword" class="forgot-password-link">忘记密码?</el-link>
          <el-link type="primary" @click="goToRegister">还没有账号？立即注册</el-link>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'LoginPage',
  data() {
    return {
      loading: false,
      loginForm: {
        username: '', 
        password: ''
      },
      loginRules: {
        username: [ 
          { required: true, message: '请输入用户名', trigger: 'blur' },
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
        ]
      }
    };
  },
  methods: {
    ...mapActions(['login', 'showSnackbar']),

    handleLogin() {
      this.$refs.loginForm.validate((valid) => {
        if (valid) {
          this.loading = true;
          
          // 修改登录请求格式和API路径
          const loginData = {
            contactType: 'username',
            contact: this.loginForm.username,
            password: this.loginForm.password,
            role: 'student'
          };
          
          console.log('发送登录请求:', loginData); // 添加调试日志
          
          this.$axios.post('/auth/login', loginData)
            .then(response => {
              console.log('登录成功:', response.data); // 调试日志
              const { token, user } = response.data; 
              
              // --- 添加 Token 存储 --- 
              if (token) {
                  localStorage.setItem('studentToken', token);
                  // 可选：同时存储一些用户信息，方便其他地方使用
                  if (user) {
                      localStorage.setItem('studentInfo', JSON.stringify(user)); // 存储为 JSON 字符串
                  }
                  console.log('Token 已存入 Local Storage');
              } else {
                  console.error('登录成功，但未收到 Token!');
                   this.showSnackbar({ text: '登录异常，未获取到凭证', color: 'error' });
                   return; // 阻止后续操作
              }
              // --- 结束添加 --- 
              
              // 如果您不再使用 Vuex 管理登录状态，可以注释或删除下面这行
              // this.login({ token, studentInfo: user }); 
              
              this.showSnackbar({ text: '登录成功!', color: 'success' });
              this.$router.push('/home'); 
            })
            .catch(error => {
              console.error("登录失败:", error.response?.data || error.message);
              const errorMsg = error.response?.data?.message || '登录失败，请检查用户名或密码';
              this.showSnackbar({ text: errorMsg, color: 'error' });
            })
            .finally(() => {
              this.loading = false;
            });
        } else {
          console.log('登录表单验证失败');
          return false;
        }
      });
    },
    goToRegister() {
      this.$router.push('/register');
    },
    goToForgotPassword() {
      this.showSnackbar({ text: '"忘记密码"功能暂未实现', color: 'info' });
    }
  }
};
</script>

<style scoped>
.login-register-container {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

.left-panel {
  width: 50%;
  /* 修正文件夹名称，从assets改为asserts */
  background: url("../asserts/images/login-bg.jpg") center center;
  background-size: cover;
  background-position: center;
  
  /* 如果图片仍然无法加载，可以临时使用渐变色 */
  /* background: linear-gradient(135deg, #333333 0%, #000000 100%); */
  
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: white;
  text-align: center;
  position: relative;
}

/* 在图片上添加一个半透明暗层，使文字更容易阅读 */
.left-panel::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.brand-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2; /* 确保文字在半透明层上方 */
}

.brand-placeholder .main-icon {
    font-size: 80px;
    margin-bottom: 20px;
    text-shadow: 0 0 10px rgba(0,0,0,0.5); /* 添加文字阴影增强可读性 */
}

.brand-placeholder h1 {
    font-size: 2.5em;
    margin-bottom: 10px;
    text-shadow: 0 0 10px rgba(0,0,0,0.5);
}

.brand-placeholder p {
    font-size: 1.1em;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 0 8px rgba(0,0,0,0.5);
}

.right-panel {
  width: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f7f8fa; 
}

.form-card {
  width: 450px;
  max-width: 90%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.form-header {
   text-align: center;
   font-size: 1.5em;
   font-weight: 500;
   color: #303133;
}

.login-button {
  width: 100%;
}

.form-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  padding: 0 10px; 
}

.forgot-password-link {
  margin-left: auto; /* Pushes forgot password to the right */
}

/* Responsive adjustments */
@media (max-width: 992px) {
  .left-panel {
    display: none; /* Hide left panel on smaller screens */
  }
  .right-panel {
    width: 100%;
  }
  .form-card {
      box-shadow: none;
      border: none;
      background-color: transparent;
  }
}
</style> 