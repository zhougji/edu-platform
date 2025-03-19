<template>
  <header class="header">
    <div class="header-left">
      <!-- 左侧 Logo，点击后新标签页打开首页 -->
      <router-link to="/" class="logo" aria-label="返回首页" @click.prevent="openNewTab('/')">
        EduResource
      </router-link>
    </div>
    <div class="header-center">
      <!-- 中间导航项：新标签页打开 -->
      <a href="javascript:;" class="nav-item" @click="openNewTab('/online-resources')">在线资源</a>
      <a href="javascript:;" class="nav-item" @click="openNewTab('/online-consult')">在线咨询</a>
      <a href="javascript:;" class="nav-item" @click="openNewTab('/ai-learning')">AI辅助学习</a>
    </div>
    <div class="header-right">
      <!-- 右侧登录注册：当前标签页跳转 -->
      <router-link to="/login" class="nav-item login-btn">登录</router-link>
      <router-link to="/register" class="nav-item register-btn">注册</router-link>
    </div>
  </header>
</template>

<script>
export default {
  name: "Header",
  methods: {
    openNewTab(route) {
      const resolved = this.$router.resolve(route);
      window.open(resolved.href, '_blank');
    }
  }
}
</script>

<style scoped>
/* 整个头部采用纯黑背景，覆盖整个窗口 */
.header {
  background-color: #000;       /* 纯黑背景 */
  color: #fff;
  height: 60px;
  line-height: 60px;
  padding: 0 40px;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  font-family: "Helvetica Neue", Arial, sans-serif;
}

/* 左侧区域 */
.header-left {
  flex: 1;
}
.logo {
  font-size: 20px;
  font-weight: bold;
  text-decoration: none;
  color: #fff;
}

/* 中间区域：导航项整体居中 */
.header-center {
  flex: 2;
  display: flex;
  justify-content: center;
  gap: 40px;  /* 导航项间距增大 */
}
.nav-item {
  font-size: 14px;
  text-decoration: none;
  color: #aaa;
  transition: color 0.3s;
  cursor: pointer;
}
.nav-item:hover {
  color: #fff;
}

/* 右侧区域：登录、注册按钮 */
.header-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.login-btn,
.register-btn {
  font-size: 14px;
  text-decoration: none;
  color: #fff;
  padding: 4px 8px;  /* 控制按钮内边距 */
  border: 1px solid #333;
  border-radius: 2px;
  transition: background-color 0.3s, border-color 0.3s;
}
.login-btn:hover,
.register-btn:hover {
  border-color: #fff;
  background-color: rgba(255,255,255,0.1);
}
</style>
