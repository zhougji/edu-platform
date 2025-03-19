<template>
  <div class="auth-page">
    <el-card class="auth-card">
      <h2>注册</h2>
      <el-form :model="form" label-width="0">
        <el-form-item>
          <el-input v-model="form.name" placeholder="姓名"></el-input>
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.email" placeholder="邮箱"></el-input>
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="register">注册</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  name: "Register",
  data() {
    return {
      form: {
        name: '',
        email: '',
        password: ''
      }
    }
  },
  methods: {
    register() {
      axios.post('http://localhost:5000/api/auth/register', {
        role: 'student',
        name: this.form.name,
        email: this.form.email,
        password: this.form.password
      })
          .then(res => {
            this.$message.success("注册成功，请登录");
            this.$router.push('/login');
          })
          .catch(err => {
            this.$message.error("注册失败");
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
</style>
