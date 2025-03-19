<template>
  <el-container class="app-container">
    <el-header>
      <nav-bar />
    </el-header>
    <el-main>
      <router-view></router-view>
    </el-main>
    <el-footer>
      <app-footer />
    </el-footer>
  </el-container>
</template>

<script setup>
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
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
  background-color: #f5f7fa;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.el-header {
  padding: 0;
  height: auto;
  z-index: 1000;
}

.el-main {
  padding: 20px;
  flex: 1;
}

.el-footer {
  padding: 0;
  height: auto;
}
</style>