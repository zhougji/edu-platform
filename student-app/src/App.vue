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

        <!-- Right: Removed User Dropdown -->
        <el-col :span="8" class="header-right">
          <!-- User Dropdown Removed -->
        </el-col>
      </el-row>
    </el-header>

    <!-- Main Content Area (Always visible) -->
    <el-main class="app-main">
      <router-view/>
    </el-main>

    <!-- Removed Login/Register View -->

     <!-- Global Snackbar (Optional, using Vuex recommended) -->
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
// Removed Vuex mappings related to auth
import { mapState, mapActions } from 'vuex'; 

export default {
  name: 'App',
  data() {
    return {
       // defaultAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png' // Removed
    }
  },
  computed: {
    // Removed isLoggedIn and studentInfo mappings
    ...mapState(['snackbar']), // Keep snackbar if needed
    activeRoute() {
      // Match parent route for highlighting
      if (this.$route.path.startsWith('/resources')) return '/resources';
      if (this.$route.path.startsWith('/consultation')) return '/consultation';
      if (this.$route.path.startsWith('/ai-assistant')) return '/ai-assistant';
      if (this.$route.path.startsWith('/profile')) return '/profile'; 
      return this.$route.path; // Default
    }
  },
  methods: {
    ...mapActions(['closeSnackbar']), // Keep snackbar action if needed
    // Removed handleCommand and logout action mapping
  },
  created() {
    // Removed checkAuth call
  },
  watch: {
    // Removed checkAuth watcher
    $route() {
       // Optionally keep this watcher for other route-related logic
    }
  }
}
</script>

<style scoped>
/* Styles remain largely the same, minor adjustments might be needed */
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

/* User dropdown styles removed */

.app-main {
  padding-top: 75px; /* Account for fixed header height + space */
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

/* Ensure header dropdown items have correct styles (if any remain) */
.el-dropdown-menu__item i {
  margin-right: 5px;
}

.el-main {
   padding: 20px; /* Consistent padding */
}
</style> 