<template>
  <div class="auth-page">
    <el-card class="auth-card">
      <div class="login-header">
        <h2>教育资源平台登录</h2>
      </div>
      <el-form :model="form" label-width="0">
        <el-form-item>
          <el-input v-model="form.email" placeholder="邮箱"></el-input>
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="login">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'
import { setToken, setUserInfo } from '@/utils/auth'

export default {
  name: "Login",
  data() {
    return {
      form: {
        email: '',
        password: ''
      }
    }
  },
  methods: {
    login() {
      axios.post('http://localhost:5000/api/auth/login', this.form)
          .then(res => {
            // 使用 auth 工具函数保存令牌和用户信息
            setToken(res.data.token);
            setUserInfo(res.data.user);
            
            this.$message.success("登录成功");
            this.$router.push('/profile');
          })
          .catch(err => {
            this.$message.error(err.response?.data?.message || "登录失败");
            console.error(err);
          });
    }
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}
.auth-card {
  max-width: 400px;
  width: 100%;
  padding: 20px;
}
.login-header {
  text-align: center;
  margin-bottom: 20px;
}
</style>
