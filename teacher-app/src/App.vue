<template>
  <div class="app-container">
    <el-container v-if="isLoggedIn">
      <el-aside width="250px" class="sidebar">
        <div class="logo">
          <h2>教师资源平台</h2>
        </div>
        <el-menu
          :router="true"
          default-active="/"
          class="el-menu-vertical"
          background-color="#001529"
          text-color="#fff"
          active-text-color="#409EFF">
          <el-menu-item index="/">
            <el-icon><i class="el-icon-s-home"></i></el-icon>
            <span>控制台</span>
          </el-menu-item>
          <el-menu-item index="/resources">
            <el-icon><i class="el-icon-folder-opened"></i></el-icon>
            <span>资源管理</span>
          </el-menu-item>
          <el-menu-item index="/consultation-requests">
            <el-icon><i class="el-icon-message"></i></el-icon>
            <span>咨询请求</span>
            <el-badge :value="pendingConsultationCount" class="consultation-badge" :hidden="!pendingConsultationCount" />
          </el-menu-item>
          <el-menu-item index="/active-consultations">
            <el-icon><i class="el-icon-chat-line-round"></i></el-icon>
            <span>进行中咨询</span>
            <el-badge :value="activeConsultationCount" class="consultation-badge" :hidden="!activeConsultationCount" />
          </el-menu-item>
          <el-menu-item index="/profile">
            <el-icon><i class="el-icon-user"></i></el-icon>
            <span>个人中心</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-container class="main-container">
        <el-header class="header">
          <div class="header-left">
            <h3>{{ getPageTitle }}</h3>
          </div>
          <div class="header-right">
            <el-dropdown trigger="click" @command="handleCommand">
              <span class="el-dropdown-link">
                {{ teacherName }} <i class="el-icon-arrow-down el-icon--right"></i>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="settings">设置</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <el-main>
          <router-view />
        </el-main>
        
        <el-footer class="footer">
          <p>© 2023 教育资源分配系统 - 教师平台</p>
        </el-footer>
      </el-container>
    </el-container>
    
    <router-view v-else />
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const store = useStore()
    const router = useRouter()
    
    const isLoggedIn = computed(() => store.getters.isAuthenticated)
    const teacherName = computed(() => {
      return store.state.teacher && store.state.teacher.name ? store.state.teacher.name : '教师用户'
    })
    const pendingConsultationCount = computed(() => store.getters.pendingConsultationCount)
    const activeConsultationCount = computed(() => store.getters.activeConsultationCount)
    
    const getPageTitle = computed(() => {
      const routeName = router.currentRoute.value.name
      const titles = {
        'Dashboard': '控制台',
        'ResourceManagement': '资源管理',
        'ConsultationRequests': '咨询请求',
        'ActiveConsultations': '进行中咨询',
        'TeacherProfile': '个人中心'
      }
      return titles[routeName] || '教师平台'
    })
    
    const handleCommand = (command) => {
      if (command === 'logout') {
        store.dispatch('logout')
        router.push('/login')
      } else if (command === 'profile') {
        router.push('/profile')
      }
    }
    
    onMounted(() => {
      if (localStorage.getItem('teacherToken')) {
        store.dispatch('fetchTeacherProfile')
        store.dispatch('fetchConsultationRequests')
        store.dispatch('fetchActiveConsultations')
      }
    })
    
    return {
      isLoggedIn,
      teacherName,
      pendingConsultationCount,
      activeConsultationCount,
      getPageTitle,
      handleCommand
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', SimSun, sans-serif;
  background-color: #f0f2f5;
}

.app-container {
  height: 100vh;
}

.sidebar {
  background-color: #001529;
  color: white;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  overflow-y: auto;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
}

.el-menu {
  border-right: none;
}

.main-container {
  margin-left: 250px;
  min-height: 100vh;
}

.header {
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  position: relative;
  z-index: 10;
}

.header-left h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #409EFF;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}

.footer {
  text-align: center;
  color: #666;
  font-size: 14px;
  padding: 15px 0;
  background-color: white;
}

.consultation-badge {
  margin-top: 2px;
  margin-right: 10px;
}
</style>
