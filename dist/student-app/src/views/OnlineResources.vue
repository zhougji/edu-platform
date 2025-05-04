<template>
  <div class="online-resources">
    <el-card>
       <div slot="header">
        <span>在线学习资源</span>
      </div>

      <!-- Search and Filter Area -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="12">
          <el-input placeholder="搜索标题、知识点..." v-model="searchQuery" clearable @clear="fetchResources" @keyup.enter.native="fetchResources">
            <el-button slot="append" icon="el-icon-search" @click="fetchResources"></el-button>
          </el-input>
        </el-col>
        <el-col :span="6">
           <el-select v-model="filterSubject" placeholder="筛选科目" clearable @change="fetchResources" style="width: 100%;">
             <el-option v-for="item in subjectOptions" :key="item" :label="item" :value="item"></el-option>
           </el-select>
        </el-col>
         <el-col :span="6">
           <el-select v-model="filterGrade" placeholder="筛选年级" clearable @change="fetchResources" style="width: 100%;">
             <el-option v-for="item in gradeOptions" :key="item" :label="item" :value="item"></el-option>
            </el-select>
        </el-col>
      </el-row>

      <!-- Resource List Area -->
      <div v-loading="loading">
         <div v-if="!loading && resources.length === 0" class="no-resources-placeholder">
           <el-empty description="暂无视频资源或未找到匹配资源"></el-empty>
         </div>
        
         <!-- Video Resources Table -->
         <el-table :data="resources" v-else style="width: 100%">
            <el-table-column prop="title" label="视频标题" width="300" show-overflow-tooltip></el-table-column>
            <el-table-column prop="subject" label="科目" width="100">
               <template slot-scope="scope">
                 <el-tag size="small">{{ scope.row.subject || '未知' }}</el-tag>
               </template>
            </el-table-column>
             <el-table-column prop="grade" label="年级" width="100">
               <template slot-scope="scope">
                 <el-tag size="small" type="success">{{ scope.row.grade || '未知' }}</el-tag>
               </template>
            </el-table-column>
            <el-table-column prop="knowledgePoints" label="知识点" show-overflow-tooltip></el-table-column>
            <el-table-column prop="teacher.name" label="教师" width="120"></el-table-column> 
            <el-table-column prop="createdAt" label="上传时间" width="160">
              <template slot-scope="scope">
                {{ formatDateTime(scope.row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
               <template slot-scope="scope">
                 <el-button size="mini" type="primary" icon="el-icon-video-play" @click="viewResource(scope.row)">观看</el-button>
               </template>
            </el-table-column>
        </el-table>

        <!-- Pagination -->
        <el-pagination
          v-if="totalResources > 0"
          background
          layout="prev, pager, next, total, jumper"
          :total="totalResources"
          :page-size="pageSize"
          :current-page.sync="currentPage"
          @current-change="handlePageChange"
          style="margin-top: 20px; text-align: right;">
        </el-pagination>
      </div>

      <!-- Video Player Dialog -->
      <el-dialog
        :title="selectedVideo.title"
        :visible.sync="videoDialogVisible"
        width="70%"
        @close="stopVideo"
      >
        <div v-if="selectedVideo.videoUrl">
           <video ref="videoPlayer" :src="selectedVideo.videoUrl" controls width="100%">
              您的浏览器不支持 Video 标签。
           </video>
           <div style="margin-top: 10px;">
              <p><strong>科目:</strong> {{ selectedVideo.subject }} | <strong>年级:</strong> {{ selectedVideo.grade }} | <strong>教师:</strong> {{ selectedVideo.teacher?.name }}</p>
              <p><strong>知识点:</strong> {{ selectedVideo.knowledgePoints }}</p>
              <p v-if="selectedVideo.description"><strong>简介:</strong> {{ selectedVideo.description }}</p>
           </div>
        </div>
         <div v-else>
           <p>无法加载视频地址。</p>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-button @click="videoDialogVisible = false">关闭</el-button>
        </span>
      </el-dialog>

    </el-card>
  </div>
</template>

<script>
import { format } from 'date-fns';
import { fetchVideoResources } from '@/services/apiService';

export default {
  name: 'OnlineResources',
  data() {
    return {
      loading: false,
      searchQuery: '',
      filterSubject: '', // Changed from filterCategory
      filterGrade: '',
      resources: [], 
      currentPage: 1,
      pageSize: 10, 
      totalResources: 0,
      subjectOptions: ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography'], // Example options
      gradeOptions: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'], // Example options
      videoDialogVisible: false,
      selectedVideo: {}
    };
  },
  methods: {
    fetchResources() {
      this.loading = true;
      fetchVideoResources()
        .then(res => {
          this.resources = res.data;
        })
        .catch(() => {
          this.$message.error('加载资源失败');
        })
        .finally(() => {
          this.loading = false;
        });
    },
    handlePageChange(newPage) {
      this.currentPage = newPage;
      this.fetchResources();
    },
    viewResource(video) {
      // Assuming the video resource object has a direct URL like 'videoUrl'
      // Adjust if your backend provides URLs differently (e.g., needs signing)
      console.log('Viewing video:', video);
      if(video.videoUrl) { 
        this.selectedVideo = video;
        this.videoDialogVisible = true;
      } else {
        this.$message.warning('该视频暂时无法播放 (缺少视频地址)');
      }
    },
    stopVideo() {
       // Stop video playback when dialog closes
       const player = this.$refs.videoPlayer;
       if (player) {
         player.pause();
         player.currentTime = 0; // Optional: Reset time
       }
    },
    formatDateTime(dateTime) {
      if (!dateTime) return '-';
      try {
        return format(new Date(dateTime), 'yyyy-MM-dd HH:mm');
      } catch (e) {
        return dateTime; 
      }
    }
  },
  created() {
    this.fetchResources();
  }
};
</script>

<style scoped>
.online-resources {
  padding: 20px;
}

.no-resources-placeholder {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

/* Optional: Style for video player container if needed */
.el-dialog__body video {
  max-height: 60vh;
}

</style> 