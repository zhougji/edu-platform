<template>
  <div class="student-home">
    <div class="banner" :style="bannerStyle">
      <div class="banner-content">
        <h1>欢迎来到启明隅学生平台</h1>
        <!-- <p>你好{{ studentName }}！在这里你可以获取学习资源、在线咨询老师、体验AI学习助手等多种功能。</p> -->
      </div>
    </div>
    <div class="features">
      <div class="feature-card" @click="goTo('/resources')">
        <img src="https://img.icons8.com/color/96/000000/books.png" alt="资源"/>
        <h3>学习资源</h3>
        <p>丰富的学习资料，助你高效学习。</p>
      </div>
      <div class="feature-card" @click="goTo('/consultation')">
        <img src="https://img.icons8.com/color/96/000000/teacher.png" alt="咨询"/>
        <h3>在线咨询</h3>
        <p>随时向老师提问，获得专业解答。</p>
      </div>
      <div class="feature-card" @click="goTo('/ai-assistant')">
        <img src="https://img.icons8.com/color/96/000000/artificial-intelligence.png" alt="AI助手"/>
        <h3>AI助手</h3>
        <p>智能AI助你解答学习难题。</p>
      </div>
    </div>
    <div class="notice">
      <el-alert title="公告：平台将于每周五凌晨维护，请提前保存学习进度。" type="info" show-icon :closable="false" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'StudentHome',
  computed: {
    ...mapGetters(['studentName']),
    bannerStyle() {
      return {
        backgroundImage: `url(${require('@/asserts/images/login-bg.jpg')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '180px',
        color: '#fff',
      };
    }
  },
  methods: {
    goTo(path) {
      this.$router.push(path).catch(()=>{});
    }
  }
};
</script>

<style scoped>
.student-home {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 0 32px 0;
}
.banner {
  width: 100%;
  border-radius: 12px;
  margin: 32px 0 24px 0;
  display: flex;
  align-items: center;
  min-height: 180px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  position: relative;
}
.banner-content {
  
  padding: 32px 40px;
  border-radius: 12px;
  margin-left: 25px;
  
}
.banner-content h1 {
  margin: 0 0 12px 0;
  color: #fff;
  font-size: 2.2em;
}
.banner-content p {
  color: #f0f0f0;
  font-size: 1.1em;
}
.features {
  display: flex;
  justify-content: space-between;
  gap: 32px;
  margin: 32px 0 24px 0;
  flex-wrap: wrap;
}
.feature-card {
  flex: 1 1 260px;
  background: #f7f9fa;
  border-radius: 10px;
  padding: 28px 16px 20px 16px;
  text-align: center;
  cursor: pointer;
  transition: box-shadow 0.2s, background 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.feature-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  background: #eaf6ff;
}
.feature-card img {
  width: 64px;
  margin-bottom: 12px;
}
.notice {
  margin-top: 32px;
}
</style> 