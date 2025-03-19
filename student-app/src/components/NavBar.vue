<template>
  <nav class="navbar">
    <div class="navbar-container">
      <router-link to="/" class="logo">
        <h1>教育资源平台</h1>
      </router-link>
      
      <div class="menu">
        <router-link to="/" class="menu-item">首页</router-link>
        <router-link to="/resources" class="menu-item">学习资源</router-link>
        <router-link to="/consult" class="menu-item">在线咨询</router-link>
        <router-link to="/ai-learning" class="menu-item">AI辅助学习</router-link>
      </div>
      
      <div class="user-actions">
        <template v-if="isLoggedIn">
          <router-link to="/profile" class="profile-link">
            <el-avatar :size="32" :src="userAvatar">{{ userInitial }}</el-avatar>
            <span class="username">{{ userName }}</span>
          </router-link>
          <el-button size="small" @click="logout" type="text">退出</el-button>
        </template>
        <template v-else>
          <router-link to="/login">
            <el-button size="small" type="primary">登录</el-button>
          </router-link>
          <router-link to="/register">
            <el-button size="small">注册</el-button>
          </router-link>
        </template>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'NavBar',
  data() {
    return {
      isLoggedIn: false,
      userName: '',
      userAvatar: ''
    }
  },
  computed: {
    userInitial() {
      return this.userName ? this.userName.charAt(0).toUpperCase() : '?';
    }
  },
  created() {
    // 检查是否已登录
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    if (userId && userName) {
      this.isLoggedIn = true;
      this.userName = userName;
      this.userAvatar = localStorage.getItem('userAvatar') || '';
    }
  },
  methods: {
    logout() {
      // 清除本地存储的用户信息
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userAvatar');
      localStorage.removeItem('userToken');
      
      this.isLoggedIn = false;
      this.userName = '';
      this.userAvatar = '';
      
      // 跳转到登录页
      this.$router.push('/login');
    }
  }
}
</script>

<style scoped>
.navbar {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 64px;
}

.logo {
  text-decoration: none;
  color: #1f4e79;
}

.logo h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.menu {
  display: flex;
  gap: 24px;
}

.menu-item {
  color: #333;
  text-decoration: none;
  font-size: 16px;
  padding: 8px 0;
  position: relative;
}

.menu-item:hover {
  color: #1f4e79;
}

.menu-item.router-link-active {
  color: #1f4e79;
  font-weight: 500;
}

.menu-item.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #1f4e79;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #333;
}

.username {
  font-size: 14px;
}
</style> 