<template>
  <div class="student-home">
    <el-card class="welcome-card">
       <div slot="header">
         <span>欢迎回来, {{ studentName }}!</span>
       </div>
       <p>这里是你的主页仪表板。</p>
       <p>你可以在这里快速访问你的课程、资源和与老师的沟通。</p>
       <!-- Add quick links or summary widgets here -->
        <el-divider></el-divider>
        <h4>快速导航</h4>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-button type="primary" plain icon="el-icon-notebook-2" @click="goTo('/resources')" style="width:100%; margin-bottom: 10px;">在线资源</el-button>
          </el-col>
          <el-col :span="8">
            <el-button type="success" plain icon="el-icon-service" @click="goTo('/consultation')" style="width:100%; margin-bottom: 10px;">在线咨询</el-button>
          </el-col>
           <el-col :span="8">
             <el-button type="info" plain icon="el-icon-cpu" @click="goTo('/ai-assistant')" style="width:100%; margin-bottom: 10px;">AI 助手</el-button>
          </el-col>
        </el-row>
    </el-card>

    <!-- Placeholder for other dashboard sections -->
    <!-- <el-row :gutter="20"> <el-col :span="12">...</el-col> </el-row> -->

  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'StudentHome',
  computed: {
    // Get student's name from Vuex store
    ...mapGetters(['studentName'])
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
  padding: 20px;
}

.welcome-card {
  margin-bottom: 20px;
}

.welcome-card .el-card__header span {
  font-weight: 600;
  font-size: 1.1em;
}

h4 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #606266;
}

</style> 