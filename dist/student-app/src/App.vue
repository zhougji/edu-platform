<template>
  <div id="app">
    <!-- Navigation Header (Always visible) -->
    <el-header class="app-header" height="60px">
      <el-row type="flex" justify="space-between" align="middle" style="height: 100%;">
        <!-- Left: Brand Name -->
        <el-col :span="8" class="header-left">
          <router-link to="/" class="brand-link">启明隅 <span class="subtitle">学生端</span></router-link>
        </el-col>

        <!-- Center: Main Navigation -->
        <el-col :span="8" class="header-center">
           <el-menu 
              mode="horizontal" 
              router 
              :default-active="activeRoute"
              background-color="transparent"
              text-color="#303133"
              active-text-color="#409EFF" 
              class="header-menu"
            >
              <el-menu-item index="/home" title="首页"><i class="el-icon-s-home"></i> 主页</el-menu-item>
              <el-menu-item index="/resources" title="在线资源"><i class="el-icon-reading"></i> 资源</el-menu-item>
              <el-menu-item index="/consultation" title="在线咨询"><i class="el-icon-chat-line-round"></i> 咨询</el-menu-item>
              <el-menu-item index="/ai-assistant" title="AI 助手"><i class="el-icon-cpu"></i> AI助手</el-menu-item>
            </el-menu>
        </el-col>

        <!-- Right: User Dropdown -->
        <el-col :span="8" class="header-right">
          <div v-if="currentUser" class="user-dropdown">
            <el-dropdown @command="handleCommand" trigger="click">
              <span class="el-dropdown-link">
                <el-avatar size="small" :src="currentUser.avatar || defaultAvatar" class="user-avatar"></el-avatar>
                <span class="user-name">{{ currentUser.realName || currentUser.username }}</span>
                <i class="el-icon-arrow-down el-icon--right"></i>
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="profile"><i class="el-icon-user"></i> 个人资料</el-dropdown-item>
                <el-dropdown-item command="logout" divided><i class="el-icon-switch-button"></i> 退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
           <div v-else class="auth-buttons">
              <el-button type="primary" @click="redirectToLogin">登录</el-button>
            </div>
        </el-col>
      </el-row>
    </el-header>

    <!-- Main Content Area (Always visible) -->
    <el-main class="app-main">
      <router-view/>
    </el-main>

    <!-- Global Snackbar -->
    <el-alert
      v-if="snackbar.show"
      :title="snackbar.text"
      :type="snackbar.color || 'info'"
      center
      show-icon
      class="global-snackbar"
      @close="closeSnackbar">
    </el-alert>

  </div>
</template>

<script>
// Keep Vuex mappings if needed, otherwise manage state locally
import { mapState, mapActions } from 'vuex'; 

export default {
  name: 'App',
  data() {
    return {
       defaultAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png', // Default avatar
       currentUser: null // Local state for user info
    }
  },
  computed: {
    ...mapState(['snackbar']), // Keep snackbar state
    activeRoute() {
      // Route highlighting logic remains the same
      if (this.$route.path.startsWith('/resources')) return '/resources';
      if (this.$route.path.startsWith('/consultation')) return '/consultation';
      if (this.$route.path.startsWith('/ai-assistant')) return '/ai-assistant';
      if (this.$route.path.startsWith('/profile')) return '/profile'; 
      return this.$route.path; 
    }
  },
  methods: {
    ...mapActions(['closeSnackbar']), // Keep snackbar action
    handleCommand(command) {
      if (command === 'logout') {
        this.logout();
      } else if (command === 'profile') {
        // Navigate to profile page if it exists
         if (this.$router) {
           this.$router.push('/profile'); // Assuming /profile route exists
         }
      }
    },
    logout() {
      // Clear local storage
      localStorage.removeItem('currentUser');
      localStorage.removeItem('auth_token');
      // Update local state
      this.currentUser = null;
      // Redirect to home page
      window.location.href = '/'; // Simple redirect
    },
    redirectToLogin() {
      window.location.href = 'login.html';
    },
    checkAuthStatus() {
      const storedUser = localStorage.getItem('currentUser');
      const token = localStorage.getItem('auth_token') || localStorage.getItem('studentToken');
      if (storedUser && token) {
        try {
          this.currentUser = JSON.parse(storedUser);
        } catch (e) {
          localStorage.removeItem('currentUser');
          this.currentUser = null;
        }
      } else {
        this.currentUser = null;
      }
    }
  },
  created() {
    // Check auth status when the app is created
    this.checkAuthStatus();
  },
  mounted() {
    this.checkAuthStatus();
  },
  watch: {
    // Watch route changes to re-check auth
    $route() {
      this.checkAuthStatus();
    }
  }
}
</script>

<style scoped>
/* Styles largely remain the same, added styles for user dropdown */
:root {
  --student-primary-color: #67c23a; /* Example: Green theme for students */
  --student-header-bg: #ffffff;
  --student-text-primary: #303133;
  --student-text-secondary: #606266;
  --student-border-color: #e4e7ed;
  --student-font-sans: 'Noto Sans SC', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

#app {
  font-family: var(--student-font-sans);
}

.app-header {
  background-color: var(--student-header-bg);
  border-bottom: 1px solid var(--student-border-color);
  padding: 0 5%; 
  position: fixed; 
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left,
.header-center,
.header-right {
  display: flex;
  align-items: center;
  height: 100%;
}

.header-left {
  justify-content: flex-start;
}

.header-center {
  justify-content: center;
}

.header-right {
  justify-content: flex-end;
}

.brand-link {
  font-family: var(--student-font-sans);
  font-size: 22px;
  font-weight: 600;
  color: var(--student-primary-color) !important;
  text-decoration: none;
}

.header-menu.el-menu.el-menu--horizontal {
  border-bottom: none !important;
  height: 59px; /* Align with header height */
}

.header-menu .el-menu-item {
   font-size: 15px;
   padding: 0 15px; /* Adjust spacing */
   color: var(--student-text-primary) !important;
}
.header-menu .el-menu-item i {
  margin-right: 5px;
}

.header-menu .el-menu-item:hover {
  background-color: #f5f7fa !important;
}

.header-menu .el-menu-item.is-active {
  color: var(--student-primary-color) !important;
  border-bottom: 2px solid var(--student-primary-color) !important;
  background-color: transparent !important;
}

/* Styles for user dropdown */
.user-dropdown .el-dropdown-link {
  cursor: pointer;
  color: var(--student-text-primary);
  display: flex;
  align-items: center;
}
.user-dropdown .user-avatar {
  margin-right: 8px;
}
.user-dropdown .user-name {
  margin-right: 5px;
  font-weight: 500;
}

/* Styles for auth buttons when not logged in */
.auth-buttons .el-button {
  margin-left: 10px;
}

.app-main {
  padding-top: 75px; /* Account for fixed header height + space */
  min-height: calc(100vh - 60px); 
  background-color: #f0f2f5;
  padding-left: 20px; 
  padding-right: 20px;
  padding-bottom: 20px;
}

.global-snackbar {
  position: fixed !important; 
  top: 80px !important; 
  left: 50% !important;
  transform: translateX(-50%) !important;
  width: auto !important;
  min-width: 300px;
  max-width: 600px;
  z-index: 2000 !important;
}

.subtitle {
  font-size: 0.8rem;
  color: var(--student-text-secondary);
  font-weight: normal;
}

</style>

<style>
/* Global styles */
body {
  margin: 0;
  padding: 0;
  font-family: 'Noto Sans SC', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* Ensure header dropdown items have correct styles */
.el-dropdown-menu__item i {
  margin-right: 5px;
}

.el-main {
   padding: 20px; /* Consistent padding */
}
</style> 