<template>
  <div id="app">
    <!-- Header (Always visible) -->
    <el-header class="app-header" height="60px">
      <el-row type="flex" justify="space-between" align="middle" style="height: 100%;">
        <!-- Left: Brand Name -->
        <el-col :span="8" class="header-left">
          <router-link to="/" class="brand-link">启明隅 <span class="subtitle">教师端</span></router-link>
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
            <el-menu-item index="/home" title="仪表盘"><i class="el-icon-data-board"></i> 仪表盘</el-menu-item>
            <el-menu-item index="/resources" title="教学资源"><i class="el-icon-folder-opened"></i> 资源管理</el-menu-item>
            <el-menu-item index="/consultations" title="在线辅导"><i class="el-icon-chat-line-square"></i> 在线辅导</el-menu-item>
            <!-- Add other teacher-specific links -->
          </el-menu>
        </el-col>

        <!-- Right: Removed User Dropdown -->
        <el-col :span="8" class="header-right">
          <div v-if="currentUser" class="user-dropdown">
            <el-dropdown @command="handleCommand" trigger="click">
              <span class="el-dropdown-link">
                <i class="el-icon-user"></i>
                {{ getUserDisplayName() }}
                <i class="el-icon-arrow-down el-icon--right"></i>
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="profile"><i class="el-icon-user"></i> 个人资料</el-dropdown-item>
                <el-dropdown-item command="debug"><i class="el-icon-info"></i> 查看详情</el-dropdown-item>
                <el-dropdown-item command="logout" divided><i class="el-icon-switch-button"></i> 退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
          <div v-else class="auth-buttons">
            <el-button type="text" @click="redirectToLogin">登录</el-button>
          </div>
        </el-col>
      </el-row>
    </el-header>

    <!-- Main Content Area (Always visible) -->
    <el-main class="app-main">
       <router-view/>
    </el-main>

    <!-- Removed Login/Register View -->

    <!-- Remove Global Snackbar since it uses Vuex -->
  </div>
</template>

<script>
// Remove Vuex imports
// import { mapState, mapActions } from 'vuex' 
import { getUser } from './utils/auth';

export default {
  name: 'App',
  data() {
    return {
       // defaultAvatar: 'path/to/default/teacher/avatar.png' // Removed
       currentUser: null // 存储登录用户信息
    }
  },
  computed: {
    // Removed Vuex mapState
    activeRoute() {
      // Logic to determine active menu item based on route
      if (this.$route.path.startsWith('/resources')) return '/resources';
      if (this.$route.path.startsWith('/consultations')) return '/consultations';
      if (this.$route.path.startsWith('/profile')) return '/profile';
      return this.$route.path; // Default to exact path
    }
  },
  methods: {
    loadUserInfo() {
      // 从localStorage加载用户信息
      const user = getUser();
      console.log('[App.vue] 从localStorage加载的用户信息:', user);
      
      if (user) {
        this.currentUser = user;
        console.log('[App.vue] 成功设置当前用户:', this.currentUser);
      } else {
        console.warn('[App.vue] 未找到用户信息，将尝试从localStorage直接获取');
        
        // 尝试手动从localStorage获取
        try {
          const userStr = localStorage.getItem('currentUser') || 
                          localStorage.getItem('user');
          
          if (userStr) {
            this.currentUser = JSON.parse(userStr);
            console.log('[App.vue] 手动获取到用户信息:', this.currentUser);
          } else {
            console.error('[App.vue] 无法获取用户信息，localStorage中不存在相关数据');
            this.currentUser = null;
          }
        } catch (e) {
          console.error('[App.vue] 解析用户信息失败:', e);
          this.currentUser = null;
        }
      }
    },
    // 跳转到登录页
    redirectToLogin() {
      window.location.href = '/login.html';
    },
    // 跳转到个人资料页
    goProfile() {
      this.$router.push('/profile');
    },
    // 登出
    logout() {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.currentUser = null;
      window.location.href = '/login.html';
    },
    handleCommand(command) {
      if (command === 'profile') {
        this.goProfile();
      } else if (command === 'logout') {
        this.logout();
      } else if (command === 'debug') {
        this.showUserInfo();
      }
    },
    getUserDisplayName() {
      if (this.currentUser) {
        // 首选项：真实姓名 > 用户名 > 邮箱 > ID
        return this.currentUser.realName || this.currentUser.username || this.currentUser.name || 
               this.currentUser.email || this.currentUser.id || '用户';
      }
      return '用户';
    },
    showUserInfo() {
      // 显示用户详细信息
      const userInfo = JSON.stringify(this.currentUser, null, 2);
      this.$alert(userInfo, '用户信息详情', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定'
      });
    }
  },
  created() {
    // 初始化登录状态
    console.log('应用启动，加载用户信息...');
    this.loadUserInfo();
  },
  watch: {
    // Removed checkAuth watcher
    $route(to, from) {
      // 每次路由切换重新检查登录状态
      console.log('路由变化，重新读取用户信息', { from: from.path, to: to.path });  
      this.loadUserInfo();
    }
  }
}
</script>

<style scoped>
/* Styles should be similar to student app, adjust colors/variables if needed */
:root {
  --teacher-primary-color: #409EFF; /* Example: Blue theme for teachers */
  --teacher-header-bg: #ffffff;
  --teacher-text-primary: #303133;
  --teacher-text-secondary: #606266;
  --teacher-border-color: #e4e7ed;
  --teacher-font-sans: 'Noto Sans SC', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

#app {
  font-family: var(--teacher-font-sans);
}

.app-header {
  background-color: var(--teacher-header-bg);
  border-bottom: 1px solid var(--teacher-border-color);
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
  font-family: var(--teacher-font-sans);
  font-size: 22px;
  font-weight: 600;
  color: var(--teacher-primary-color) !important;
  text-decoration: none;
}

.subtitle {
  font-size: 0.8rem;
  color: var(--teacher-text-secondary);
  font-weight: normal;
}

.header-menu.el-menu.el-menu--horizontal {
  border-bottom: none !important;
  height: 59px; 
}

.header-menu .el-menu-item {
   font-size: 15px;
   padding: 0 15px;
   color: var(--teacher-text-primary) !important;
}
.header-menu .el-menu-item i {
  margin-right: 5px;
}

.header-menu .el-menu-item:hover {
  background-color: #f5f7fa !important;
}

.header-menu .el-menu-item.is-active {
  color: var(--teacher-primary-color) !important;
  border-bottom: 2px solid var(--teacher-primary-color) !important;
  background-color: transparent !important;
}

/* User dropdown styles */
.user-dropdown {
  display: flex;
  align-items: center;
}

.user-dropdown .el-button {
  font-size: 14px;
  margin-left: 10px;
}

.auth-buttons .el-button {
  margin-left: 10px;
}

.app-main {
  padding-top: 75px; 
  min-height: calc(100vh - 60px); 
  background-color: #f0f2f5;
  padding-left: 20px; 
  padding-right: 20px;
  padding-bottom: 20px;
}

/* Removed styles for non-logged-in state */

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
</style>

<style>
/* Global styles if needed */
body {
  margin: 0;
  padding: 0;
  font-family: 'Noto Sans SC', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.el-main {
   padding: 20px; 
}
</style> 