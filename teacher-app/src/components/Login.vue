<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>教师平台登录</h2>
      </div>
      
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="0">
        <el-form-item prop="email">
          <el-input 
            v-model="loginForm.email" 
            placeholder="邮箱"
            prefix-icon="el-icon-message">
          </el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="密码"
            prefix-icon="el-icon-lock"
            show-password>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            class="login-button" 
            :loading="loading"
            @click="handleLogin">
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <el-checkbox v-model="rememberMe">记住我</el-checkbox>
        <el-button type="text" @click="forgotPassword">忘记密码？</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  name: 'Login',
  setup() {
    const store = useStore()
    const router = useRouter()
    const loginFormRef = ref(null)
    const loading = ref(false)
    const rememberMe = ref(false)
    
    const loginForm = reactive({
      email: '',
      password: ''
    })
    
    const rules = {
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
      ]
    }
    
    const handleLogin = () => {
      if (loginFormRef.value) {
        loginFormRef.value.validate(async (valid) => {
          if (valid) {
            loading.value = true
            try {
              // 模拟登录请求
              setTimeout(() => {
                // 存储登录信息
                localStorage.setItem('teacherToken', 'mock-token')
                localStorage.setItem('teacherId', '1')
                
                // 更新 Vuex 状态
                store.commit('setTeacher', {
                  id: '1',
                  name: '张老师',
                  email: loginForm.email,
                  avatar: '',
                  subjects: ['math', 'physics']
                })
                
                ElMessage.success('登录成功')
                router.push('/')
                loading.value = false
              }, 1000)
            } catch (error) {
              console.error('登录失败:', error)
              ElMessage.error('登录失败，请检查邮箱和密码')
              loading.value = false
            }
          } else {
            return false
          }
        })
      }
    }
    
    const forgotPassword = () => {
      ElMessage.info('请联系管理员重置密码')
    }
    
    return {
      loginFormRef,
      loginForm,
      rules,
      loading,
      rememberMe,
      handleLogin,
      forgotPassword
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.login-card {
  width: 400px;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.login-button {
  width: 100%;
}

.login-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}
</style>
