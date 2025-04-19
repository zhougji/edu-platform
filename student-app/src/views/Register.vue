<template>
  <div class="login-register-container">
    <!-- 左侧面板 - 品牌展示 -->
    <div class="left-panel">
       <div class="brand-placeholder">
          <i class="el-icon-reading main-icon"></i>
          <h1>启明隅</h1>
          <p>点亮你的学习之路</p>
       </div>
    </div>
    <!-- 右侧面板 - 注册表单 -->
    <div class="right-panel">
      <el-card class="form-card">
        <div slot="header" class="form-header">
          <span>学生注册</span>
        </div>
        <el-form @submit.native.prevent="handleRegister" :model="registerForm" :rules="registerRules" ref="registerForm" label-width="80px">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="registerForm.username" placeholder="请输入用户名" prefix-icon="el-icon-user"></el-input>
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input type="password" v-model="registerForm.password" placeholder="请输入密码 (至少6位)" prefix-icon="el-icon-lock" show-password></el-input>
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input type="password" v-model="registerForm.confirmPassword" placeholder="请再次输入密码" prefix-icon="el-icon-check" show-password></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleRegister" :loading="loading" class="register-button">注册</el-button>
          </el-form-item>
        </el-form>
        <div class="form-footer">
          <el-link type="primary" @click="goToLogin">已有账号？立即登录</el-link>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'RegisterPage',
  data() {
    // 自定义验证器，确保两次输入的密码一致
    const validatePassConfirm = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'));
      } else if (value !== this.registerForm.password) {
        callback(new Error('两次输入密码不一致!'));
      } else {
        callback();
      }
    };

    return {
      loading: false,
      registerForm: {
        username: '',
        password: '',
        confirmPassword: ''
      },
      registerRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, message: '用户名长度至少为3位', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请再次输入密码', trigger: 'blur' },
          { validator: validatePassConfirm, trigger: 'blur' }
        ]
      }
    };
  },
  methods: {
     ...mapActions(['showSnackbar']),

    handleRegister() {
      this.$refs.registerForm.validate((valid) => {
        if (valid) {
          this.loading = true;
          // 按后端API要求格式化数据
          const registrationData = {
            name: this.registerForm.username, // 使用username值作为name
            contactType: 'username', // 联系方式类型设为username
            contact: this.registerForm.username, // 联系方式值
            password: this.registerForm.password,
            role: 'student' // 指定角色为学生
          };

          console.log('发送注册请求:', registrationData); // 添加日志帮助调试

          // 使用正确的API端点，不需要/api前缀，因为axios配置中已添加
          this.$axios.post('/auth/register', registrationData)
            .then(response => {
              console.log('注册成功:', response.data); // 添加成功日志
              this.showSnackbar({ text: '注册成功！请登录。', color: 'success' });
              this.$router.push('/login');
            })
            .catch(error => {
              console.error("注册失败:", error.response?.data || error.message);
              const errorMsg = error.response?.data?.message || '注册失败，请检查信息或稍后重试';
              this.showSnackbar({ text: errorMsg, color: 'error' });
            })
            .finally(() => {
              this.loading = false;
            });
        } else {
          console.log('注册表单验证失败');
          return false;
        }
      });
    },

    goToLogin() {
      this.$router.push('/login');
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
  background: linear-gradient(135deg, #67c23a 0%, #a5e78a 100%); /* 绿色渐变背景 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: white;
  text-align: center;
}

.brand-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.brand-placeholder .main-icon {
    font-size: 80px;
    margin-bottom: 20px;
}

.brand-placeholder h1 {
    font-size: 2.5em;
    margin-bottom: 10px;
}

.brand-placeholder p {
    font-size: 1.1em;
    color: rgba(255, 255, 255, 0.8);
}

.right-panel {
  width: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f7f8fa; 
  padding: 40px 0;
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

.register-button {
  width: 100%;
}

.form-footer {
  text-align: center;
  margin-top: 15px;
}

/* 响应式调整 */
@media (max-width: 992px) {
  .left-panel {
    display: none; /* 小屏幕下隐藏左侧面板 */
  }
  .right-panel {
    width: 100%;
    padding: 20px 0;
  }
  .form-card {
      width: 90%;
      box-shadow: none;
      border: none;
      background-color: transparent;
  }
}
</style> 