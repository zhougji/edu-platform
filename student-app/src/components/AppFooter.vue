<template>
  <footer class="app-footer">
    <div class="footer-container">
      <div class="footer-section">
        <h3>教育资源平台</h3>
        <p>免费优质教育资源 • 随时随地学习</p>

      </div>
      
      <div class="footer-section">
        <h4>快捷链接</h4>
        <ul class="footer-links">
          <li><router-link to="/">首页</router-link></li>
          <li><router-link to="/resources">学习资源</router-link></li>
          <li><router-link to="/consult">在线咨询</router-link></li>
          <li><router-link to="/ai-learning">AI辅助学习</router-link></li>
        </ul>
      </div>
      
      <div class="footer-section">
        <h4>资源分类</h4>
        <ul class="footer-links">
          <li><router-link to="/resources?subject=math">数学</router-link></li>
          <li><router-link to="/resources?subject=chinese">语文</router-link></li>
          <li><router-link to="/resources?subject=english">英语</router-link></li>
          <li><router-link to="/resources?subject=physics">物理</router-link></li>
          <li><router-link to="/resources?subject=chemistry">化学</router-link></li>
        </ul>
      </div>
      
      <div class="footer-section">
        <h4>联系我们</h4>
        <ul class="footer-links contact-links">
          <li><i class="el-icon-message"></i> support@edu-platform.org</li>
          <li><i class="el-icon-phone"></i> 400-123-4567</li>
          <li><i class="el-icon-location-information"></i> 北京市海淀区中关村</li>
        </ul>
      </div>
    </div>
    
    <div class="footer-bottom">
      <p>&copy; 2023 教育资源分配系统 - 学生平台 版权所有</p>
      <p>
        <router-link to="/terms">使用条款</router-link> | 
        <router-link to="/privacy">隐私政策</router-link> | 
        <router-link to="/help">帮助中心</router-link>
      </p>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'AppFooter'
}
</script>

<style scoped>
.app-footer {
  background-color: #1f4e79;
  color: #fff;
  padding: 40px 0 20px;
  margin-top: 40px;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.footer-section {
  width: 100%;
  max-width: 250px;
  margin-bottom: 30px;
}

.footer-section h3 {
  margin: 0 0 15px;
  font-size: 22px;
  font-weight: 600;
}

.footer-section h4 {
  margin: 0 0 15px;
  font-size: 18px;
  font-weight: 500;
}

.footer-section p {
  margin: 0 0 10px;
  color: rgba(255, 255, 255, 0.8);
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 8px;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: #fff;
  text-decoration: underline;
}

.contact-links li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.contact-links i {
  width: 16px;
}

.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.footer-bottom p {
  margin: 8px 0;
}

.footer-bottom a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
}

.footer-bottom a:hover {
  color: #fff;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .footer-container {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .footer-section {
    margin-bottom: 25px;
  }
  
  .contact-links li {
    justify-content: center;
  }
}
</style> 