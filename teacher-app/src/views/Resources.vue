<template>
  <div class="resources-container">
    <div class="page-header">
      <h1>视频资源</h1>
      <p>上传和管理教学视频资源</p>
    </div>

    <!-- Filters and Actions Row -->
    <el-card shadow="never" class="filter-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select 
            v-model="filters.subject" 
            placeholder="按学科筛选" 
            clearable 
            size="small"
            @change="fetchResources"
          >
            <el-option 
              v-for="item in subjectOptions" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select 
            v-model="filters.grade" 
            placeholder="按年级筛选" 
            clearable 
            size="small"
            @change="fetchResources"
          >
            <el-option 
              v-for="item in gradeOptions" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-input 
            v-model="filters.search" 
            placeholder="搜索标题或知识点" 
            clearable 
            size="small"
          >
            <template #prefix>
              <i class="el-icon-search"></i>
            </template>
          </el-input>
        </el-col>
        <el-col :span="6" class="action-buttons">
          <el-button type="primary" @click="openResourceDialog()" icon="el-icon-plus">
            上传新视频
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- Videos Table View -->
    <el-card shadow="hover" class="resource-card">
      <div slot="header" class="clearfix">
        <span>视频列表</span>
        <span class="resource-count">{{ totalResources }} 个视频</span>
      </div>

      <el-table
        v-loading="loading"
        :data="resources"
        style="width: 100%"
        border
      >
        <el-table-column label="缩略图" width="120">
          <template slot-scope="scope">
            <div class="thumbnail-container">
              <img 
                v-if="scope.row.thumbnailUrl" 
                :src="scope.row.thumbnailUrl" 
                class="resource-thumbnail" 
                alt="视频缩略图"
              />
              <div v-else class="thumbnail-placeholder">
                <i class="el-icon-video-camera"></i>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="title" label="标题" min-width="200">
          <template slot-scope="scope">
            <div class="video-title">{{ scope.row.title }}</div>
            <div class="video-description text-ellipsis">{{ scope.row.description || '无描述' }}</div>
          </template>
        </el-table-column>
        
        <el-table-column prop="subject" label="学科" width="120">
          <template slot-scope="scope">
            <el-tag size="small">{{ scope.row.subject }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="grade" label="年级" width="120">
          <template slot-scope="scope">
            <el-tag size="small" type="info">{{ scope.row.grade }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="上传日期" width="150">
          <template slot-scope="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="primary"
              icon="el-icon-edit"
              circle
              @click="openResourceDialog(scope.row)"
              title="编辑"
            ></el-button>
            <el-button
              size="mini"
              type="danger"
              icon="el-icon-delete"
              circle
              @click="confirmDelete(scope.row)"
              title="删除"
            ></el-button>
            <el-button
              size="mini"
              type="success"
              icon="el-icon-view"
              circle
              @click="previewVideo(scope.row)"
              title="预览"
            ></el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- Empty placeholder -->
      <div v-if="!loading && resources.length === 0" class="empty-placeholder">
        <i class="el-icon-video-camera empty-icon"></i>
        <p>没有找到视频资源</p>
        <el-button type="primary" @click="openResourceDialog()">上传第一个视频</el-button>
      </div>
      
      <!-- Pagination -->
      <div class="pagination-container" v-if="resources.length > 0">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes"
          :current-page.sync="pagination.currentPage"
          :page-sizes="[10, 20, 50]"
          :page-size.sync="pagination.pageSize"
          :total="totalResources"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        >
        </el-pagination>
      </div>
    </el-card>

    <!-- Video Upload/Edit Dialog -->
    <el-dialog
      :title="editMode ? '编辑视频资源' : '上传新视频'"
      :visible.sync="resourceDialogVisible"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="resourceForm" 
        :model="resourceForm" 
        :rules="resourceRules" 
        label-width="100px" 
        label-position="top"
        v-loading="saving"
      >
        <el-form-item label="视频标题" prop="title">
          <el-input v-model="resourceForm.title" placeholder="请输入视频标题"></el-input>
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学科" prop="subject">
              <el-select v-model="resourceForm.subject" placeholder="请选择学科" style="width: 100%">
                <el-option 
                  v-for="item in subjectOptions" 
                  :key="item.value" 
                  :label="item.label" 
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年级" prop="grade">
              <el-select v-model="resourceForm.grade" placeholder="请选择年级" style="width: 100%">
                <el-option 
                  v-for="item in gradeOptions" 
                  :key="item.value" 
                  :label="item.label" 
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="知识点" prop="knowledgePoints">
          <el-input 
            v-model="resourceForm.knowledgePoints" 
            placeholder="例如：代数, 线性方程, 光合作用" 
          ></el-input>
          <div class="form-hint">多个知识点用逗号分隔</div>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            type="textarea" 
            v-model="resourceForm.description" 
            placeholder="视频内容描述" 
            :rows="3"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="上传视频" prop="videoFile" v-if="!editMode || !resourceForm.videoUrl">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleVideoChange"
            :limit="1"
          >
            <el-button type="primary">选择视频文件</el-button>
            <div class="form-hint">支持 MP4, MOV, AVI 等格式, 大小不超过300MB</div>
          </el-upload>
          <div v-if="videoPreview.name" class="file-preview">
            <i class="el-icon-video-camera"></i>
            <span>{{ videoPreview.name }}</span>
            <span class="file-size">({{ formatFileSize(videoPreview.size) }})</span>
            <i class="el-icon-close preview-close" @click="clearVideoFile"></i>
          </div>
          <el-progress 
            v-if="uploading.video && uploadProgress.video > 0" 
            :percentage="uploadProgress.video" 
            :show-text="true"
          ></el-progress>
        </el-form-item>
        
        <el-form-item label="视频缩略图" v-if="!editMode || !resourceForm.thumbnailUrl">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleThumbnailChange"
            :limit="1"
            accept="image/*"
          >
            <el-button type="primary">选择缩略图</el-button>
            <div class="form-hint">支持 JPG, PNG格式, 推荐尺寸 16:9 比例</div>
          </el-upload>
          <div v-if="thumbnailPreview.url" class="thumbnail-preview">
            <img :src="thumbnailPreview.url" alt="缩略图预览" />
            <i class="el-icon-close preview-close" @click="clearThumbnailFile"></i>
          </div>
          <div v-if="!thumbnailPreview.url && !editMode" class="form-hint warning">
            <i class="el-icon-warning"></i>
            如果不提供缩略图，系统将自动生成
          </div>
          <el-progress 
            v-if="uploading.thumbnail && uploadProgress.thumbnail > 0" 
            :percentage="uploadProgress.thumbnail" 
            :show-text="true"
          ></el-progress>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="resourceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveResource" :loading="saving">
          {{ editMode ? '保存修改' : '上传视频' }}
        </el-button>
      </div>
    </el-dialog>

    <!-- Video Preview Dialog -->
    <el-dialog
      title="视频预览"
      :visible.sync="previewDialogVisible"
      width="800px"
    >
      <div v-if="previewVideoData.videoUrl" class="video-preview-container">
        <video controls :src="previewVideoData.videoUrl" class="video-player">
          Your browser does not support the video tag.
        </video>
        <div class="video-preview-info">
          <h3>{{ previewVideoData.title }}</h3>
          <p><b>学科：</b>{{ previewVideoData.subject }}</p>
          <p><b>年级：</b>{{ previewVideoData.grade }}</p>
          <p><b>知识点：</b>{{ previewVideoData.knowledgePoints }}</p>
          <p v-if="previewVideoData.description"><b>描述：</b>{{ previewVideoData.description }}</p>
        </div>
      </div>
      <div v-else class="video-preview-error">
        无法加载视频，请稍后再试
      </div>
    </el-dialog>

    <!-- Delete Confirmation Dialog -->
    <el-dialog
      title="确认删除"
      :visible.sync="deleteDialogVisible"
      width="400px"
    >
      <p>您确定要删除视频 "{{ resourceToDelete.title }}" 吗？</p>
      <p class="delete-warning">此操作不可撤销！</p>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteResource" :loading="deleting">确认删除</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
// 移除 date-fns 依赖
// import { format } from 'date-fns';
import debounce from 'lodash/debounce';

export default {
  name: 'VideoResources',
  data() {
    return {
      // 资源列表和加载状态
      resources: [],
      loading: true,
      totalResources: 0,
      
      // 筛选相关
      filters: {
        subject: '',
        grade: '',
        search: '',
      },
      
      // 分页相关
      pagination: {
        currentPage: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortDesc: true
      },
      
      // 学科和年级选项
      subjectOptions: [
        { value: '数学', label: '数学' },
        { value: '语文', label: '语文' },
        { value: '英语', label: '英语' },
        { value: '物理', label: '物理' },
        { value: '化学', label: '化学' },
        { value: '生物', label: '生物' },
        { value: '历史', label: '历史' },
        { value: '地理', label: '地理' },
        { value: '政治', label: '政治' }
      ],
      gradeOptions: [
        { value: '小学一年级', label: '小学一年级' },
        { value: '小学二年级', label: '小学二年级' },
        { value: '小学三年级', label: '小学三年级' },
        { value: '小学四年级', label: '小学四年级' },
        { value: '小学五年级', label: '小学五年级' },
        { value: '小学六年级', label: '小学六年级' },
        { value: '初中一年级', label: '初中一年级' },
        { value: '初中二年级', label: '初中二年级' },
        { value: '初中三年级', label: '初中三年级' },
        { value: '高中一年级', label: '高中一年级' },
        { value: '高中二年级', label: '高中二年级' },
        { value: '高中三年级', label: '高中三年级' }
      ],
      
      // 资源表单相关
      resourceDialogVisible: false,
      editMode: false,
      resourceId: null,
      resourceForm: {
        title: '',
        subject: '',
        grade: '',
        description: '',
        knowledgePoints: '',
        videoFile: null,
        thumbnailFile: null,
        videoUrl: '',
        thumbnailUrl: ''
      },
      resourceRules: {
        title: [{ required: true, message: '请输入视频标题', trigger: 'blur' }],
        subject: [{ required: true, message: '请选择学科', trigger: 'change' }],
        grade: [{ required: true, message: '请选择年级', trigger: 'change' }],
        knowledgePoints: [{ required: true, message: '请输入知识点', trigger: 'blur' }],
        videoFile: [{ required: true, message: '请上传视频文件', trigger: 'change' }]
      },
      saving: false,
      uploading: {
        video: false,
        thumbnail: false
      },
      uploadProgress: {
        video: 0,
        thumbnail: 0
      },
      videoPreview: {
        name: '',
        size: 0
      },
      thumbnailPreview: {
        url: ''
      },
      
      // 视频预览对话框
      previewDialogVisible: false,
      previewVideoData: {},
      
      // 删除对话框
      deleteDialogVisible: false,
      resourceToDelete: {},
      deleting: false
    };
  },
  
  created() {
    this.fetchResources();
    this.debouncedSearch = debounce(this.fetchResources, 500);
  },
  
  methods: {
    // 格式化日期 - 不使用 date-fns 库，而是使用本地函数
    formatDate(dateString) {
      if (!dateString) return '未知日期';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        // 格式化为 yyyy-MM-dd HH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      } catch (e) {
        console.error('Date formatting error:', e);
        return dateString;
      }
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // 获取资源列表
    async fetchResources() {
      this.loading = true;
      try {
        const params = {
          page: this.pagination.currentPage,
          limit: this.pagination.pageSize,
          sortBy: this.pagination.sortBy,
          sortDesc: this.pagination.sortDesc ? 'desc' : 'asc'
        };
        
        // 添加筛选条件
        if (this.filters.subject) params.subject = this.filters.subject;
        if (this.filters.grade) params.grade = this.filters.grade;
        if (this.filters.search) params.search = this.filters.search;
        
        const response = await axios.get('/api/teachers/videos', { params });
        this.resources = response.data.videos || [];
        this.totalResources = response.data.total || 0;
      } catch (error) {
        console.error('Error fetching resources:', error);
        this.$message.error('获取视频资源失败: ' + (error.response?.data?.message || error.message || '未知错误'));
        this.resources = [];
        this.totalResources = 0;
      } finally {
        this.loading = false;
      }
    },
    
    // 搜索防抖
    debounceSearch() {
      this.debouncedSearch();
    },
    
    // 页码大小变化
    handleSizeChange(size) {
      this.pagination.pageSize = size;
      this.fetchResources();
    },
    
    // 当前页变化
    handleCurrentChange(page) {
      this.pagination.currentPage = page;
      this.fetchResources();
    },
    
    // 打开资源表单对话框
    openResourceDialog(resource = null) {
      if (resource) {
        // 编辑模式
        this.editMode = true;
        this.resourceId = resource.id;
        this.resourceForm = {
          title: resource.title,
          subject: resource.subject,
          grade: resource.grade,
          description: resource.description || '',
          knowledgePoints: resource.knowledgePoints || '',
          videoUrl: resource.videoUrl || '',
          thumbnailUrl: resource.thumbnailUrl || '',
          videoFile: null,
          thumbnailFile: null
        };
      } else {
        // 创建模式
        this.editMode = false;
        this.resourceId = null;
        this.resourceForm = {
          title: '',
          subject: '',
          grade: '',
          description: '',
          knowledgePoints: '',
          videoUrl: '',
          thumbnailUrl: '',
          videoFile: null,
          thumbnailFile: null
        };
        this.videoPreview = { name: '', size: 0 };
        this.thumbnailPreview = { url: '' };
      }
      this.resourceDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.resourceForm && this.$refs.resourceForm.clearValidate();
      });
    },
    
    // 处理视频文件变化
    handleVideoChange(file) {
      const isVideo = file.raw.type.includes('video/');
      const isLt300M = file.raw.size / 1024 / 1024 < 300;
      
      if (!isVideo) {
        this.$message.error('请上传视频文件!');
        return;
      }
      if (!isLt300M) {
        this.$message.error('视频大小不能超过 300MB!');
        return;
      }
      
      // 预览信息
      this.videoPreview = {
        name: file.raw.name,
        size: file.raw.size
      };
      this.resourceForm.videoFile = file.raw;
    },
    
    // 处理缩略图文件变化
    handleThumbnailChange(file) {
      const isImage = file.raw.type.includes('image/');
      const isLt5M = file.raw.size / 1024 / 1024 < 5;
      
      if (!isImage) {
        this.$message.error('请上传图片文件!');
        return;
      }
      if (!isLt5M) {
        this.$message.error('图片大小不能超过 5MB!');
        return;
      }
      
      // 创建预览URL
      this.thumbnailPreview.url = URL.createObjectURL(file.raw);
      this.resourceForm.thumbnailFile = file.raw;
    },
    
    // 清除视频文件
    clearVideoFile() {
      this.videoPreview = { name: '', size: 0 };
      this.resourceForm.videoFile = null;
      this.uploadProgress.video = 0;
    },
    
    // 清除缩略图文件
    clearThumbnailFile() {
      if (this.thumbnailPreview.url && this.thumbnailPreview.url.startsWith('blob:')) {
        URL.revokeObjectURL(this.thumbnailPreview.url);
      }
      this.thumbnailPreview = { url: '' };
      this.resourceForm.thumbnailFile = null;
      this.uploadProgress.thumbnail = 0;
    },
    
    // 保存资源
    saveResource() {
      this.$refs.resourceForm.validate(async (valid) => {
        if (!valid) {
          return false;
        }
        
        // 非编辑模式下，必须上传视频文件
        if (!this.editMode && !this.resourceForm.videoFile) {
          this.$message.error('请选择视频文件');
          return;
        }
        
        this.saving = true;
        
        try {
          const formData = new FormData();
          
          // 添加基本信息
          formData.append('title', this.resourceForm.title);
          formData.append('subject', this.resourceForm.subject);
          formData.append('grade', this.resourceForm.grade);
          formData.append('knowledgePoints', this.resourceForm.knowledgePoints);
          if (this.resourceForm.description) {
            formData.append('description', this.resourceForm.description);
          }
          
          // 添加文件
          if (this.resourceForm.videoFile) {
            formData.append('video', this.resourceForm.videoFile);
            this.uploading.video = true;
          }
          
          if (this.resourceForm.thumbnailFile) {
            formData.append('thumbnail', this.resourceForm.thumbnailFile);
            this.uploading.thumbnail = true;
          }
          
          console.log('正在提交表单数据...', {
            title: this.resourceForm.title,
            subject: this.resourceForm.subject,
            grade: this.resourceForm.grade,
            hasVideo: !!this.resourceForm.videoFile,
            hasThumbnail: !!this.resourceForm.thumbnailFile
          });
          
          // 发送请求
          if (this.editMode) {
            await axios.put(`/api/teachers/videos/${this.resourceId}`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              },
              onUploadProgress: this.trackUploadProgress,
              timeout: 300000 // 5分钟超时，大文件上传需要更长时间
            });
          } else {
            await axios.post('/api/teachers/videos', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              },
              onUploadProgress: this.trackUploadProgress,
              timeout: 300000 // 5分钟超时，大文件上传需要更长时间
            });
          }
          
          this.$message.success(this.editMode ? '视频资源更新成功' : '视频资源上传成功');
          this.resourceDialogVisible = false;
          this.fetchResources();
        } catch (error) {
          console.error('Error saving resource:', error);
          let errorMessage;
          
          if (error.message && error.message.includes('timeout')) {
            errorMessage = '上传超时，请检查您的网络连接或尝试上传较小的文件';
          } else if (error.message && error.message.includes('Network Error')) {
            errorMessage = '网络错误，请检查您的网络连接和后端服务器是否正常运行';
          } else {
            errorMessage = (this.editMode ? '更新视频资源失败' : '上传视频资源失败') + ': ' + 
              (error.response?.data?.message || error.message || '未知错误');
          }
          
          this.$message.error(errorMessage);
          // 不关闭对话框，让用户有机会重试
        } finally {
          this.saving = false;
          this.uploading = { video: false, thumbnail: false };
          this.uploadProgress = { video: 0, thumbnail: 0 };
        }
      });
    },
    
    // 跟踪上传进度
    trackUploadProgress(progressEvent) {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      
      // 简单假设：根据文件类型判断是视频还是缩略图上传
      if (this.resourceForm.videoFile && this.resourceForm.thumbnailFile) {
        // 如果两种文件都有，假设前75%是视频上传，后25%是缩略图
        if (percentCompleted <= 75) {
          this.uploadProgress.video = Math.round(percentCompleted * (100/75));
        } else {
          this.uploadProgress.video = 100;
          this.uploadProgress.thumbnail = Math.round((percentCompleted - 75) * 4);
        }
      } else if (this.resourceForm.videoFile) {
        this.uploadProgress.video = percentCompleted;
      } else if (this.resourceForm.thumbnailFile) {
        this.uploadProgress.thumbnail = percentCompleted;
      }
    },
    
    // 预览视频
    previewVideo(video) {
      this.previewVideoData = { ...video };
      this.previewDialogVisible = true;
    },
    
    // 确认删除
    confirmDelete(resource) {
      this.resourceToDelete = resource;
      this.deleteDialogVisible = true;
    },
    
    // 执行删除
    async deleteResource() {
      this.deleting = true;
      try {
        await axios.delete(`/api/teachers/videos/${this.resourceToDelete.id}`);
        this.$message.success('视频资源删除成功');
        this.deleteDialogVisible = false;
        this.fetchResources();
      } catch (error) {
        console.error('Error deleting resource:', error);
        this.$message.error('删除视频资源失败: ' + 
          (error.response?.data?.message || error.message || '未知错误'));
        this.deleteDialogVisible = false;
      } finally {
        this.deleting = false;
      }
    }
  }
};
</script>

<style scoped>
.resources-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  margin: 0 0 10px 0;
  font-weight: 500;
}

.page-header p {
  color: #606266;
  margin: 0;
}

.filter-card {
  margin-bottom: 20px;
  padding: 15px;
}

.action-buttons {
  text-align: right;
}

.resource-card {
  margin-bottom: 30px;
}

.resource-count {
  float: right;
  color: #909399;
  font-size: 14px;
}

.thumbnail-container {
  width: 100px;
  height: 56px;
  overflow: hidden;
  border-radius: 4px;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resource-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
}

.thumbnail-placeholder i {
  font-size: 24px;
}

.video-title {
  font-weight: 500;
  margin-bottom: 5px;
}

.video-description {
  font-size: 12px;
  color: #909399;
}

.text-ellipsis {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.form-hint.warning {
  color: #E6A23C;
}

.form-hint.warning i {
  margin-right: 5px;
}

.file-preview {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.file-preview i {
  margin-right: 10px;
  color: #409EFF;
}

.file-size {
  color: #909399;
  margin-left: 5px;
}

.thumbnail-preview {
  margin-top: 10px;
  position: relative;
  display: inline-block;
}

.thumbnail-preview img {
  width: 200px;
  height: 112px;
  object-fit: cover;
  border-radius: 4px;
}

.preview-close {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #f56c6c;
  color: white;
  border-radius: 50%;
  padding: 2px;
  font-size: 12px;
  cursor: pointer;
}

.empty-placeholder {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  color: #dcdfe6;
  margin-bottom: 15px;
}

.video-preview-container {
  text-align: center;
}

.video-player {
  width: 100%;
  max-height: 450px;
  margin-bottom: 15px;
}

.video-preview-info {
  text-align: left;
  padding: 0 15px;
}

.video-preview-info h3 {
  margin-top: 0;
}

.delete-warning {
  color: #f56c6c;
  font-weight: bold;
}

.el-table .el-button+.el-button {
  margin-left: 5px;
}
</style> 