<template>
  <div class="teacher-profile">
    <el-page-header @back="goBack" :content="teacher ? teacher.name + ' 的资料' : '教师资料'">
    </el-page-header>

    <el-card v-loading="loading" style="margin-top: 20px;">
       <div v-if="loading" style="min-height: 300px;"></div> <!-- Placeholder for loading -->
      <div v-else-if="error" class="error-message">
        <el-alert
          title="加载教师信息失败"
          type="error"
          :description="error"
          show-icon
          :closable="false">
        </el-alert>
      </div>
       <div v-else-if="teacher">
        <el-row :gutter="40">
          <el-col :span="6" style="text-align: center;">
            <el-avatar :size="120" :src="teacher.avatar || defaultAvatar"></el-avatar>
             <p style="margin-top: 15px;">
                <el-tag :type="teacher.isOnline ? 'success' : 'info'" size="medium">{{ teacher.isOnline ? '当前在线' : '当前离线' }}</el-tag>
             </p>
              <el-button 
                type="success" 
                icon="el-icon-chat-dot-round" 
                @click="initiateConsultation" 
                :disabled="!teacher.isOnline" 
                style="margin-top: 20px; width: 100%;"
              >
                发起咨询
              </el-button>
               <!-- Add other actions like 'Book Appointment' if needed -->
          </el-col>
          <el-col :span="18">
            <h2>{{ teacher.name }}</h2>
            <el-divider></el-divider>
            
            <div class="profile-section">
              <h4><i class="el-icon-collection-tag"></i> 擅长学科</h4>
              <p>
                 <el-tag 
                    v-for="subject in teacher.subjects" 
                    :key="subject" 
                    style="margin-right: 10px; margin-bottom: 5px;"
                 >
                    {{ subject }}
                 </el-tag>
                 <span v-if="!teacher.subjects || teacher.subjects.length === 0">暂未指定</span>
              </p>
            </div>

             <div class="profile-section">
              <h4><i class="el-icon-document"></i> 教师简介</h4>
              <p>{{ teacher.bio || '这位老师很神秘，还没有简介哦~' }}</p>
            </div>

             <div class="profile-section">
               <h4><i class="el-icon-time"></i> 可咨询时间 (示例)</h4>
               <p>{{ teacher.availability || '请直接联系老师确认具体时间' }}</p>
            </div>

            <!-- Add more sections like experience, qualifications, contact etc. -->

          </el-col>
        </el-row>
      </div>
       <div v-else class="no-teacher-placeholder">
         <el-empty description="未找到该教师的信息"></el-empty>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'TeacherProfile',
  props: {
    // Get teacherId from route params (defined in router.js)
    teacherId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      teacher: null, // Holds the fetched teacher data
      error: null,
      defaultAvatar: 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png' // Default teacher avatar
    };
  },
  methods: {
    fetchTeacherProfile() {
      this.loading = true;
      this.error = null;
      this.teacher = null;
      // Placeholder API call - Use the teacherId prop
      this.$axios.get(`/teachers/${this.teacherId}`)
        .then(response => {
           // Replace with actual data structure from backend
           this.teacher = response.data;
            // Simulate online status if not provided
           if (this.teacher && this.teacher.isOnline === undefined) {
               this.teacher.isOnline = Math.random() > 0.5; 
            }
            // Simulate subjects/bio/availability if not provided for demo
            if (this.teacher && !this.teacher.subjects) {
                this.teacher.subjects = ['数学', '物理'];
            }
             if (this.teacher && !this.teacher.bio) {
                 this.teacher.bio = '经验丰富的数学和物理老师，致力于帮助学生理解复杂概念。'
            }
            if (this.teacher && !this.teacher.availability) {
                this.teacher.availability = '周一至周五 9:00 - 17:00 (请提前确认)'
            }
        })
        .catch(error => {
          console.error("Error fetching teacher profile:", error);
          this.error = error.response?.data?.message || '加载教师信息时发生错误';
          this.$message.error(this.error);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    goBack() {
      // Go back to the previous page (likely the teacher list)
      this.$router.go(-1);
    },
    initiateConsultation() {
      // Placeholder: Implement logic to start a chat/consultation session
      // This might involve:
      // 1. Checking teacher availability again
      // 2. Navigating to a chat interface route, passing teacherId
      // 3. Using WebSockets to establish connection
      console.log(`Initiating consultation with teacher ${this.teacherId}`);
      this.$message.info(`发起与 ${this.teacher.name} 老师的咨询（功能待实现）`);
      // Example navigation (replace with actual chat route)
      // this.$router.push({ name: 'Chat', params: { teacherId: this.teacherId } });
    }
  },
  created() {
    // Fetch profile when component is created
    this.fetchTeacherProfile();
  },
  watch: {
     // Refetch if the route changes (e.g., navigating from one profile to another)
     teacherId(newId, oldId) {
         if (newId !== oldId) {
             this.fetchTeacherProfile();
         }
     }
  }
};
</script>

<style scoped>
.teacher-profile {
  padding: 20px;
}

.el-page-header {
    margin-bottom: 20px;
}

.profile-section {
  margin-bottom: 30px;
}

.profile-section h4 {
  margin-bottom: 10px;
  color: #303133;
  font-size: 1.1em;
  display: flex;
  align-items: center;
}

.profile-section h4 i {
  margin-right: 8px;
  color: #409EFF;
}

.profile-section p {
  color: #606266;
  line-height: 1.6;
  font-size: 0.95em;
}

.error-message,
.no-teacher-placeholder {
  padding: 40px 0;
  text-align: center;
}
</style> 