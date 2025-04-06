<template>
  <div class="welcome-container">
    <h1>欢迎来到启明隅教育平台</h1>
    <p class="welcome-desc">专注于为学生提供高质量在线教育资源与服务</p>
    <div class="feature-container">
      <div class="feature">
        <i class="fas fa-book-open"></i>
        <h3>在线资源</h3>
        <p>丰富的学习资料，覆盖多学科内容</p>
      </div>
      <div class="feature">
        <i class="fas fa-comments"></i>
        <h3>在线咨询</h3>
        <p>专业教师一对一解答学习疑问</p>
      </div>
      <div class="feature">
        <i class="fas fa-robot"></i>
        <h3>AI辅助学习</h3>
        <p>智能学习助手随时为您服务</p>
      </div>
    </div>
    <div class="action-buttons">
      <router-link to="/login" class="login-btn">登录</router-link>
      <router-link to="/register" class="register-btn">注册</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage'
}
</script>