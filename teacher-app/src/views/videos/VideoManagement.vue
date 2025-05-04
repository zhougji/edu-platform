<!-- eslint-disable no-unused-vars -->
<template>
  <div class="video-management">
    <h2>教学资源管理</h2>
    
    <!-- 视频上传区域 -->
    <el-card class="upload-section">
      <div slot="header">
        <span>上传新视频</span>
      </div>
      <el-form :model="uploadForm" :rules="uploadRules" ref="uploadForm" label-width="80px">
        <el-form-item label="视频标题" prop="title">
          <el-input v-model="uploadForm.title" placeholder="请输入视频标题"></el-input>
        </el-form-item>
        <el-form-item label="学科分类" prop="subject">
          <el-select v-model="uploadForm.subject" placeholder="请选择学科分类">
            <el-option label="数学" value="math"></el-option>
            <el-option label="物理" value="physics"></el-option>
            <el-option label="化学" value="chemistry"></el-option>
            <el-option label="生物" value="biology"></el-option>
            <el-option label="英语" value="english"></el-option>
            <el-option label="历史" value="history"></el-option>
            <el-option label="地理" value="geography"></el-option>
            <el-option label="政治" value="politics"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-select v-model="uploadForm.grade" placeholder="请选择年级">
            <el-option label="一年级" value="1"></el-option>
            <el-option label="二年级" value="2"></el-option>
            <el-option label="三年级" value="3"></el-option>
            <el-option label="四年级" value="4"></el-option>
            <el-option label="五年级" value="5"></el-option>
            <el-option label="六年级" value="6"></el-option>
            <el-option label="初一" value="7"></el-option>
            <el-option label="初二" value="8"></el-option>
            <el-option label="初三" value="9"></el-option>
            <el-option label="高一" value="10"></el-option>
            <el-option label="高二" value="11"></el-option>
            <el-option label="高三" value="12"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="简介" prop="description">
          <el-input type="textarea" v-model="uploadForm.description" rows="3" placeholder="请输入视频简介"></el-input>
        </el-form-item>
        <el-form-item label="封面图" prop="coverImage">
          <el-upload
            class="cover-uploader"
            action="/api/upload/image"
            name="file"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleCoverSuccess"
            :on-error="(err, file) => handleUploadError(err, file, '封面')"
            :before-upload="beforeCoverUpload">
            <img v-if="uploadForm.coverImageUrl" :src="uploadForm.coverImageUrl" class="cover-image">
            <i v-else class="el-icon-plus cover-uploader-icon"></i>
          </el-upload>
          <div class="upload-tip">请上传视频封面图片，建议尺寸16:9</div>
        </el-form-item>
        <el-form-item label="视频文件" prop="videoFile">
          <el-upload
            class="video-uploader"
            action="/api/upload/video"
            name="file"
            :headers="uploadHeaders"
            :on-progress="onVideoUploadProgress"
            :on-success="handleVideoSuccess"
            :on-error="(err, file) => handleUploadError(err, file, '视频')"
            :before-upload="beforeVideoUpload"
            :limit="1"
            :file-list="videoList">
            <el-button size="small" type="primary">选择视频</el-button>
            <div class="upload-tip">支持MP4, MOV格式，最大500MB</div>
          </el-upload>
          <el-progress v-if="uploadProgress > 0 && uploadProgress < 100" :percentage="uploadProgress" :stroke-width="5"></el-progress>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitUploadForm" :loading="uploading" :disabled="!uploadForm.videoUrl">保存视频</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 视频列表区域 -->
    <el-card class="video-list-section">
      <div slot="header">
        <span>我的视频</span>
        <el-input 
          placeholder="搜索视频..." 
          v-model="searchQuery" 
          class="search-input" 
          clearable 
          @clear="fetchVideos"
          @keyup.enter.native="fetchVideos">
          <el-button slot="append" icon="el-icon-search" @click="fetchVideos"></el-button>
        </el-input>
      </div>
      
      <!-- 过滤器 -->
      <div class="filter-section">
        <el-select v-model="filterSubject" placeholder="学科" clearable @change="fetchVideos">
          <el-option label="全部学科" value=""></el-option>
          <el-option label="数学" value="math"></el-option>
          <el-option label="物理" value="physics"></el-option>
          <el-option label="化学" value="chemistry"></el-option>
          <el-option label="生物" value="biology"></el-option>
          <el-option label="英语" value="english"></el-option>
          <el-option label="历史" value="history"></el-option>
          <el-option label="地理" value="geography"></el-option>
          <el-option label="政治" value="politics"></el-option>
        </el-select>
        <el-select v-model="filterGrade" placeholder="年级" clearable @change="fetchVideos">
          <el-option label="全部年级" value=""></el-option>
          <el-option label="一年级" value="1"></el-option>
          <el-option label="二年级" value="2"></el-option>
          <el-option label="三年级" value="3"></el-option>
          <el-option label="四年级" value="4"></el-option>
          <el-option label="五年级" value="5"></el-option>
          <el-option label="六年级" value="6"></el-option>
          <el-option label="初一" value="7"></el-option>
          <el-option label="初二" value="8"></el-option>
          <el-option label="初三" value="9"></el-option>
          <el-option label="高一" value="10"></el-option>
          <el-option label="高二" value="11"></el-option>
          <el-option label="高三" value="12"></el-option>
        </el-select>
        <el-select v-model="sortBy" placeholder="排序" @change="fetchVideos">
          <el-option label="最新上传" value="createdAt_desc"></el-option>
          <el-option label="最早上传" value="createdAt_asc"></el-option>
          <el-option label="播放量高" value="viewCount_desc"></el-option>
          <el-option label="标题排序" value="title_asc"></el-option>
        </el-select>
      </div>
      
      <div v-loading="loading">
        <!-- 空状态 -->
        <div v-if="videos.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无视频"></el-empty>
        </div>
        
        <!-- 视频列表 -->
        <div v-else class="video-grid">
          <el-card class="video-card" v-for="video in videos" :key="video._id" shadow="hover">
            <div class="video-thumbnail" @click="previewVideo(video)">
              <img :src="video.coverImageUrl || defaultCover" alt="视频封面">
              <div class="video-duration">{{ formatDuration(video.duration) }}</div>
              <div class="video-play-icon"><i class="el-icon-video-play"></i></div>
            </div>
            <div class="video-info">
              <h3 class="video-title" :title="video.title">{{ video.title }}</h3>
              <p class="video-meta">
                <span>学科: {{ getSubjectLabel(video.subject) }}</span>
                <span>年级: {{ getGradeLabel(video.grade) }}</span>
              </p>
              <p class="video-stats">
                <span><i class="el-icon-view"></i> {{ video.viewCount || 0 }}</span>
                <span><i class="el-icon-time"></i> {{ formatDate(video.createdAt) }}</span>
              </p>
            </div>
            <div class="video-actions">
              <el-dropdown @command="handleVideoAction($event, video)">
                <span class="el-dropdown-link">
                  操作<i class="el-icon-arrow-down el-icon--right"></i>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </el-card>
        </div>
        
        <!-- 分页控件 -->
        <div class="pagination" v-if="videos.length > 0">
          <el-pagination
            background
            layout="prev, pager, next, total"
            :total="totalVideos"
            :page-size="pageSize"
            :current-page.sync="currentPage"
            @current-change="handlePageChange">
          </el-pagination>
        </div>
      </div>
    </el-card>
    
    <!-- 视频编辑对话框 -->
    <el-dialog title="编辑视频" :visible.sync="editDialogVisible" width="50%">
      <el-form :model="editForm" :rules="uploadRules" ref="editForm" label-width="80px">
        <el-form-item label="视频标题" prop="title">
          <el-input v-model="editForm.title" placeholder="请输入视频标题"></el-input>
        </el-form-item>
        <el-form-item label="学科分类" prop="subject">
          <el-select v-model="editForm.subject" placeholder="请选择学科分类">
            <el-option label="数学" value="math"></el-option>
            <el-option label="物理" value="physics"></el-option>
            <el-option label="化学" value="chemistry"></el-option>
            <el-option label="生物" value="biology"></el-option>
            <el-option label="英语" value="english"></el-option>
            <el-option label="历史" value="history"></el-option>
            <el-option label="地理" value="geography"></el-option>
            <el-option label="政治" value="politics"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-select v-model="editForm.grade" placeholder="请选择年级">
            <el-option label="一年级" value="1"></el-option>
            <el-option label="二年级" value="2"></el-option>
            <el-option label="三年级" value="3"></el-option>
            <el-option label="四年级" value="4"></el-option>
            <el-option label="五年级" value="5"></el-option>
            <el-option label="六年级" value="6"></el-option>
            <el-option label="初一" value="7"></el-option>
            <el-option label="初二" value="8"></el-option>
            <el-option label="初三" value="9"></el-option>
            <el-option label="高一" value="10"></el-option>
            <el-option label="高二" value="11"></el-option>
            <el-option label="高三" value="12"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="简介" prop="description">
          <el-input type="textarea" v-model="editForm.description" rows="3" placeholder="请输入视频简介"></el-input>
        </el-form-item>
        <el-form-item label="封面图">
          <el-upload
            class="cover-uploader"
            :action="offlineTestMode ? '#' : '/api/upload/image'"
            :http-request="offlineTestMode ? handleOfflineCoverUpload : undefined"
            :show-file-list="false"
            :on-success="(res, file) => handleEditCoverSuccess(res, file)"
            :before-upload="beforeCoverUpload">
            <img v-if="editForm.coverImageUrl" :src="editForm.coverImageUrl" class="cover-image">
            <i v-else class="el-icon-plus cover-uploader-icon"></i>
          </el-upload>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditForm">保存</el-button>
      </span>
    </el-dialog>
    
    <!-- 视频预览对话框 -->
    <el-dialog title="视频预览" :visible.sync="previewDialogVisible" width="80%" custom-class="video-preview-dialog">
      <div v-if="currentVideo" class="video-preview-container">
        <video
          ref="videoPlayer"
          class="video-player"
          controls
          autoplay
          :src="currentVideo.videoUrl"
          @timeupdate="onVideoTimeUpdate">
        </video>
        <div class="video-preview-info">
          <h2>{{ currentVideo.title }}</h2>
          <p class="video-preview-meta">
            <span>学科: {{ getSubjectLabel(currentVideo.subject) }}</span>
            <span>年级: {{ getGradeLabel(currentVideo.grade) }}</span>
            <span>上传时间: {{ formatDate(currentVideo.createdAt) }}</span>
            <span>播放次数: {{ currentVideo.viewCount || 0 }}</span>
          </p>
          <p class="video-preview-description">{{ currentVideo.description }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'VideoManagement',
  data() {
    return {
      // 上传表单
      uploadForm: {
        title: '',
        subject: '',
        grade: '',
        description: '',
        coverImageUrl: '',
        videoUrl: '',
        duration: 0
      },
      uploadRules: {
        title: [
          { required: true, message: '请输入视频标题', trigger: 'blur' },
          { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
        ],
        subject: [
          { required: true, message: '请选择学科分类', trigger: 'change' }
        ],
        grade: [
          { required: true, message: '请选择年级', trigger: 'change' }
        ],
        description: [
          { required: true, message: '请输入视频简介', trigger: 'blur' },
          { min: 5, max: 500, message: '长度在 5 到 500 个字符', trigger: 'blur' }
        ]
      },
      uploading: false,
      uploadProgress: 0,
      videoList: [],
      defaultCover: 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
      
      // 视频列表
      loading: false,
      videos: [],
      totalVideos: 0,
      currentPage: 1,
      pageSize: 12,
      searchQuery: '',
      filterSubject: '',
      filterGrade: '',
      sortBy: 'createdAt_desc',
      
      // 编辑对话框
      editDialogVisible: false,
      editForm: {
        _id: '',
        title: '',
        subject: '',
        grade: '',
        description: '',
        coverImageUrl: ''
      },
      
      // 预览对话框
      previewDialogVisible: false,
      currentVideo: null,
      
      // 离线测试模式
      offlineTestMode: false,
      
      // 上传相关
      uploadHeaders: {}
    };
  },
  methods: {
    // ===== 文件上传相关方法 =====
    handleCoverSuccess(res, file) {
      if (this.offlineTestMode) {
        // 模拟响应
        const mockResponse = {
          success: true,
          message: '封面上传成功',
          data: {
            url: URL.createObjectURL(file.raw)
          }
        };
        this.uploadForm.coverImageUrl = mockResponse.data.url;
        this.$message.success('封面上传成功');
      } else {
        this.uploadForm.coverImageUrl = res.data.url;
      }
    },
    
    beforeCoverUpload(file) {
      const isImage = file.type.indexOf('image/') === 0;
      const isLt2M = file.size / 1024 / 1024 < 2;
      
      if (!isImage) {
        this.$message.error('只能上传图片文件!');
      }
      if (!isLt2M) {
        this.$message.error('图片大小不能超过 2MB!');
      }
      
      return isImage && isLt2M;
    },
    
    onVideoUploadProgress(event) {
      if (event.percent) {
        this.uploadProgress = parseInt(event.percent);
      }
    },
    
    handleVideoSuccess(res, file) {
      this.uploadProgress = 100;
      if (this.offlineTestMode) {
        // 模拟响应
        this.uploadForm.videoUrl = URL.createObjectURL(file.raw);
        this.uploadForm.duration = 120; // 模拟2分钟
        this.$message.success('视频上传成功');
      } else {
        this.uploadForm.videoUrl = res.data.url;
        this.uploadForm.duration = res.data.duration || 0;
      }
      
      setTimeout(() => {
        this.uploadProgress = 0;
      }, 2000);
    },
    
    handleVideoError(err) {
      this.uploadProgress = 0;
      this.$message.error('视频上传失败，请重试');
      console.error('视频上传失败:', err);
    },
    
    beforeVideoUpload(file) {
      const isVideo = file.type.indexOf('video/') === 0;
      const isLt500M = file.size / 1024 / 1024 < 500;
      
      if (!isVideo) {
        this.$message.error('只能上传视频文件!');
      }
      if (!isLt500M) {
        this.$message.error('视频大小不能超过 500MB!');
      }
      
      return isVideo && isLt500M;
    },
    
    submitUploadForm() {
      this.$refs.uploadForm.validate((valid) => {
        if (valid) {
          if (!this.uploadForm.videoUrl) {
            this.$message.error('请先上传视频文件');
            return;
          }
          
          this.uploading = true;
          
          // 构建请求数据
          const videoData = {
            title: this.uploadForm.title,
            subject: this.uploadForm.subject,
            grade: this.uploadForm.grade,
            description: this.uploadForm.description,
            coverImageUrl: this.uploadForm.coverImageUrl || this.defaultCover,
            videoUrl: this.uploadForm.videoUrl,
            duration: this.uploadForm.duration
          };
          
          if (this.offlineTestMode) {
            // 模拟保存成功
            console.log('离线测试模式: 模拟视频保存', videoData);
            this.$message.success('视频保存成功');
            this.resetUploadForm();
            this.uploading = false;
            this.fetchVideos(); // 刷新列表
          } else {
            // 发送到后端
            this.$http.post('/api/videos', videoData)
              .then(() => {
                this.$message.success('视频保存成功');
                this.resetUploadForm();
                this.fetchVideos(); // 刷新列表
              })
              .catch(error => {
                console.error('保存视频失败:', error);
                this.$message.error('保存视频失败，请重试');
              })
              .finally(() => {
                this.uploading = false;
              });
          }
        }
      });
    },
    
    resetUploadForm() {
      this.$refs.uploadForm.resetFields();
      this.uploadForm.coverImageUrl = '';
      this.uploadForm.videoUrl = '';
      this.uploadForm.duration = 0;
      this.videoList = [];
    },
    
    // ===== 视频列表相关方法 =====
    fetchVideos() {
      this.loading = true;
      
      if (this.offlineTestMode) {
        // 模拟数据
        setTimeout(() => {
          this.videos = Array(12).fill().map((_, index) => ({
            _id: `video_${index}`,
            title: `示例视频 ${index + 1}`,
            subject: ['math', 'physics', 'chemistry', 'biology', 'english'][index % 5],
            grade: String(7 + (index % 6)),
            description: `这是一个示例视频的详细描述，用于测试界面显示效果。第 ${index + 1} 个视频。`,
            coverImageUrl: `https://via.placeholder.com/320x180?text=Video+${index + 1}`,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            duration: 60 + index * 30,
            viewCount: Math.floor(Math.random() * 1000),
            createdAt: new Date(Date.now() - index * 86400000).toISOString()
          }));
          this.totalVideos = 36;
          this.loading = false;
        }, 500);
        return;
      }
      
      // 构建请求参数
      const params = {
        page: this.currentPage,
        limit: this.pageSize,
        search: this.searchQuery,
        subject: this.filterSubject,
        grade: this.filterGrade,
        sort: this.sortBy
      };
      
      this.$http.get('/api/videos', { params })
        .then(response => {
          this.videos = response.data.videos || [];
          this.totalVideos = response.data.total || 0;
        })
        .catch(error => {
          console.error('获取视频列表失败:', error);
          this.$message.error('获取视频列表失败，请重试');
          this.videos = [];
          this.totalVideos = 0;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchVideos();
    },
    
    handleVideoAction(command, video) {
      if (command === 'edit') {
        this.editVideo(video);
      } else if (command === 'delete') {
        this.confirmDeleteVideo(video);
      }
    },
    
    editVideo(video) {
      this.editForm = { ...video };
      this.editDialogVisible = true;
    },
    
    handleEditCoverSuccess(res, file) {
      if (this.offlineTestMode) {
        const mockResponse = {
          success: true,
          message: '封面上传成功',
          data: {
            url: URL.createObjectURL(file.raw)
          }
        };
        this.editForm.coverImageUrl = mockResponse.data.url;
        this.$message.success('封面上传成功');
      } else {
        this.editForm.coverImageUrl = res.data.url;
      }
    },
    
    submitEditForm() {
      this.$refs.editForm.validate((valid) => {
        if (valid) {
          if (this.offlineTestMode) {
            // 模拟更新成功
            console.log('离线测试模式: 模拟视频更新', this.editForm);
            const index = this.videos.findIndex(v => v._id === this.editForm._id);
            if (index !== -1) {
              this.videos[index] = { ...this.videos[index], ...this.editForm };
            }
            this.$message.success('视频更新成功');
            this.editDialogVisible = false;
          } else {
            this.$http.put(`/api/videos/${this.editForm._id}`, this.editForm)
              .then(() => {
                this.$message.success('视频更新成功');
                this.editDialogVisible = false;
                this.fetchVideos(); // 刷新列表
              })
              .catch(error => {
                console.error('更新视频失败:', error);
                this.$message.error('更新视频失败，请重试');
              });
          }
        }
      });
    },
    
    confirmDeleteVideo(video) {
      this.$confirm(`确定要删除视频"${video.title}"吗？删除后不可恢复。`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteVideo(video._id);
      }).catch(() => {});
    },
    
    deleteVideo(videoId) {
      if (this.offlineTestMode) {
        // 模拟删除成功
        console.log('离线测试模式: 模拟视频删除', videoId);
        this.videos = this.videos.filter(v => v._id !== videoId);
        this.$message.success('视频删除成功');
      } else {
        this.$http.delete(`/api/videos/${videoId}`)
          .then(() => {
            this.$message.success('视频删除成功');
            this.fetchVideos(); // 刷新列表
          })
          .catch(error => {
            console.error('删除视频失败:', error);
            this.$message.error('删除视频失败，请重试');
          });
      }
    },
    
    // ===== 视频预览相关方法 =====
    previewVideo(video) {
      this.currentVideo = video;
      this.previewDialogVisible = true;
      if (!this.offlineTestMode) {
        // 记录播放次数
        this.$http.post(`/api/videos/${video._id}/view`)
          .catch(error => console.error('记录播放次数失败:', error));
      }
    },
    
    onVideoTimeUpdate() {
      if (this.$refs.videoPlayer) {
        // 这里可以添加视频播放进度记录逻辑
      }
    },
    
    // ===== 辅助方法 =====
    formatDuration(seconds) {
      if (!seconds) return '00:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    },
    
    getSubjectLabel(value) {
      const subjects = {
        'math': '数学',
        'physics': '物理',
        'chemistry': '化学',
        'biology': '生物',
        'english': '英语',
        'history': '历史',
        'geography': '地理',
        'politics': '政治'
      };
      return subjects[value] || value;
    },
    
    getGradeLabel(value) {
      const grades = {
        '1': '一年级',
        '2': '二年级',
        '3': '三年级',
        '4': '四年级',
        '5': '五年级',
        '6': '六年级',
        '7': '初一',
        '8': '初二',
        '9': '初三',
        '10': '高一',
        '11': '高二',
        '12': '高三'
      };
      return grades[value] || value;
    },
    
    handleOfflineUpload(options) {
      const { file, onProgress, onSuccess, onError } = options;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        const percent = Math.min(99, this.uploadProgress + 10);
        this.uploadProgress = percent;
        onProgress({ percent });
      }, 300);

      // Simulate server processing time
      setTimeout(() => {
        clearInterval(progressInterval);
        
        try {
          // Check file type
          if (file.type.indexOf('video/') !== 0) {
            onError(new Error('只能上传视频文件'));
            return;
          }
          
          // Simulate successful response
          const mockResponse = {
            success: true,
            message: '视频上传成功',
            data: {
              url: URL.createObjectURL(file),
              duration: Math.floor(Math.random() * 300) + 60 // 模拟1~6分钟的视频长度
            }
          };
          
          onSuccess(mockResponse, file);
          this.$message.success('视频上传成功');
        } catch (error) {
          onError(error);
          this.$message.error('视频上传失败');
        }
      }, 2000);
    },
    
    handleOfflineCoverUpload(options) {
      const { file, onProgress, onSuccess, onError } = options;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        const percent = Math.min(99, this.uploadProgress + 10);
        this.uploadProgress = percent;
        onProgress({ percent });
      }, 300);

      // Simulate server processing time
      setTimeout(() => {
        clearInterval(progressInterval);
        
        try {
          // Check file type
          if (file.type.indexOf('image/') !== 0) {
            onError(new Error('只能上传图片文件'));
            return;
          }
          
          // Simulate successful response
          const mockResponse = {
            success: true,
            message: '封面上传成功',
            data: {
              url: URL.createObjectURL(file)
            }
          };
          
          onSuccess(mockResponse, file);
          this.$message.success('封面上传成功');
        } catch (error) {
          onError(error);
          this.$message.error('封面上传失败');
        }
      }, 2000);
    },
    
    handleUploadError(err, file, type) {
      console.error(`${type}上传失败:`, err);
      this.$message.error(`${type}上传失败，请重试`);
    }
  },
  created() {
    this.fetchVideos();
    
    // 设置上传请求头，包含认证信息
    const token = localStorage.getItem('token');
    if (token) {
      this.uploadHeaders = {
        'Authorization': `Bearer ${token}`
      };
    }
  }
};
</script>

<style scoped>
.video-management {
  padding: 20px;
}

.upload-section {
  margin-bottom: 30px;
}

.search-input {
  float: right;
  width: 250px;
}

.filter-section {
  display: flex;
  margin-bottom: 20px;
  gap: 15px;
}

.filter-section .el-select {
  width: 120px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.video-card {
  position: relative;
  transition: all 0.3s;
  height: 100%;
}

.video-thumbnail {
  position: relative;
  cursor: pointer;
  height: 158px;
  overflow: hidden;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.video-thumbnail:hover img {
  transform: scale(1.05);
}

.video-duration {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 5px;
  border-radius: 2px;
  font-size: 12px;
}

.video-play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 40px;
  opacity: 0;
  transition: opacity 0.3s;
}

.video-thumbnail:hover .video-play-icon {
  opacity: 1;
}

.video-info {
  padding: 10px 0;
}

.video-title {
  margin: 5px 0;
  font-size: 16px;
  height: 44px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.video-meta, .video-stats {
  display: flex;
  justify-content: space-between;
  color: #909399;
  font-size: 12px;
  margin: 5px 0;
}

.video-stats span {
  display: flex;
  align-items: center;
}

.video-stats i {
  margin-right: 3px;
}

.video-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
}

.cover-uploader {
  width: 320px;
}

.cover-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.cover-uploader .el-upload:hover {
  border-color: #409EFF;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 320px;
  height: 180px;
  line-height: 180px;
  text-align: center;
}

.cover-image {
  width: 320px;
  height: 180px;
  display: block;
  object-fit: cover;
}

.upload-tip {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
}

.pagination {
  text-align: center;
  margin-top: 20px;
}

.empty-state {
  padding: 40px 0;
}

.video-preview-container {
  display: flex;
  flex-direction: column;
}

.video-player {
  width: 100%;
  max-height: 60vh;
  background-color: #000;
}

.video-preview-info {
  padding: 15px 0;
}

.video-preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  color: #606266;
  margin: 10px 0;
}

.video-preview-description {
  margin-top: 10px;
  color: #303133;
  white-space: pre-line;
}

.video-preview-dialog .el-dialog__body {
  padding: 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
  
  .filter-section {
    flex-wrap: wrap;
  }
  
  .cover-uploader, .cover-uploader-icon, .cover-image {
    width: 100%;
    max-width: 320px;
  }
}
</style> 