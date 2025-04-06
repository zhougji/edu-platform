<template>
  <div class="student-layout">
    <StudentSidebar />
    <div class="student-main-content">
      <header class="student-header">
        <div class="search-bar">
          <input type="text" placeholder="搜索..." />
          <button class="search-btn">
            <i class="fas fa-search"></i>
          </button>
        </div>
        <div class="user-menu">
          <div class="notifications">
            <button class="notification-btn">
              <i class="fas fa-bell"></i>
              <span class="notification-badge" v-if="notificationCount > 0">
                {{ notificationCount }}
              </span>
            </button>
          </div>
          <div class="user-profile" @click="toggleProfileMenu">
            <img :src="currentUser?.avatar || '/images/default-avatar.jpg'" :alt="currentUser?.name" class="user-avatar" />
            <span class="user-name">{{ currentUser?.name || '用户' }}</span>
            <i class="fas fa-chevron-down"></i>
            
            <div v-if="showProfileMenu" class="profile-dropdown">
              <router-link to="/student/profile" class="dropdown-item">
                <i class="fas fa-user"></i> 个人中心
              </router-link>
              <router-link to="/student/settings" class="dropdown-item">
                <i class="fas fa-cog"></i> 账号设置
              </router-link>
              <div class="dropdown-divider"></div>
              <button @click="handleLogout" class="dropdown-item logout-btn">
                <i class="fas fa-sign-out-alt"></i> 退出登录
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main class="student-content">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import StudentSidebar from '../components/student/StudentSidebar.vue'
import { getCurrentUser, logout } from '../services/authService'

export default {
  name: 'StudentLayout',
  components: {
    StudentSidebar
  },
  setup() {
    const router = useRouter()
    const showProfileMenu = ref(false)
    const notificationCount = ref(0)
    const currentUser = getCurrentUser()
    
    // 切换个人菜单显示状态
    const toggleProfileMenu = () => {
      showProfileMenu.value = !showProfileMenu.value
    }
    
    // 关闭菜单的点击外部处理函数
    const closeMenuOnClickOutside = (event) => {
      // 检查点击事件是否在菜单外部
      if (showProfileMenu.value && !event.target.closest('.user-profile')) {
        showProfileMenu.value = false
      }
    }
    
    // 添加全局点击监听器
    document.addEventListener('click', closeMenuOnClickOutside)
    
    // 退出登录处理
    const handleLogout = async () => {
      try {
        await logout()
        router.push('/login')
      } catch (error) {
        console.error('退出登录失败:', error)
      }
    }
    
    // 在组件销毁时移除事件监听器
    onUnmounted(() => {
      document.removeEventListener('click', closeMenuOnClickOutside)
    })
    
    return {
      showProfileMenu,
      notificationCount,
      currentUser,
      toggleProfileMenu,
      handleLogout
    }
  }
}
</script> 