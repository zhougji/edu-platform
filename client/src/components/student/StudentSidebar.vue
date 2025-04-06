<template>
  <div class="student-sidebar">
    <div class="sidebar-header">
      <img src="/logo.png" alt="启明隅教育" class="sidebar-logo" />
      <h3>启明隅教育</h3>
    </div>
    <ul class="sidebar-menu">
      <li>
        <router-link to="/student/dashboard" class="nav-link" active-class="active">
          <i class="fas fa-tachometer-alt"></i>
          <span>学习中心</span>
        </router-link>
      </li>
      <li>
        <router-link to="/student/resources" class="nav-link" active-class="active">
          <i class="fas fa-book-open"></i>
          <span>学习资源</span>
        </router-link>
      </li>
      <li>
        <router-link to="/student/consultations" class="nav-link" active-class="active">
          <i class="fas fa-comments"></i>
          <span>在线咨询</span>
        </router-link>
      </li>
      <li>
        <router-link to="/student/ai" class="nav-link" active-class="active">
          <i class="fas fa-robot"></i>
          <span>AI学习助手</span>
        </router-link>
      </li>
      <li>
        <router-link to="/student/profile" class="nav-link" active-class="active">
          <i class="fas fa-user-circle"></i>
          <span>个人中心</span>
        </router-link>
      </li>
    </ul>
    <div class="sidebar-footer">
      <p>启明隅教育 © {{ currentYear }}</p>
      <p>点亮学习之路</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StudentSidebar',
  computed: {
    currentYear() {
      return new Date().getFullYear()
    }
  }
}
</script> 