<template>
  <div class="resource-management">
    <div class="page-header">
      <el-button type="primary" @click="dialogVisible = true">上传资源</el-button>
      
      <div class="filters">
        <el-select v-model="filters.subject" placeholder="科目" clearable>
          <el-option
            v-for="item in subjectOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
        
        <el-select v-model="filters.type" placeholder="类型" clearable>
          <el-option
            v-for="item in typeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
        
        <el-select v-model="filters.level" placeholder="级别" clearable>
          <el-option
            v-for="item in levelOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
        
        <el-input
          placeholder="搜索资源"
          v-model="filters.keyword"
          class="search-input"
          clearable>
          <template #suffix>
            <i class="el-icon-search"></i>
          </template>
        </el-input>
      </div>
    </div>
    
    <el-table
      :data="filteredResources"
      style="width: 100%"
      v-loading="loading">
      <el-table-column
        prop="title"
        label="标题"
        min-width="200">
      </el-table-column>
      <el-table-column
        prop="subject"
        label="科目"
        width="100">
      </el-table-column>
      <el-table-column
        prop="type"
        label="类型"
        width="100">
      </el-table-column>
      <el-table-column
        prop="level"
        label="级别"
        width="100">
      </el-table-column>
      <el-table-column
        prop="uploadDate"
        label="上传时间"
        width="160">
      </el-table-column>
      <el-table-column
        prop="viewCount"
        label="浏览量"
        width="100">
      </el-table-column>
      <el-table-column
        prop="downloadCount"
        label="下载量"
        width="100">
      </el-table-column>
      <el-table-column
        fixed="right"
        label="操作"
        width="150">
        <template #default="scope">
          <el-button
            size="small"
            @click="handleEdit(scope.row)">编辑</el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination-container">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pagination.currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total">
      </el-pagination>
    </div>
    
    <!-- 上传资源对话框 -->
    <el-dialog
      title="上传资源"
      v-model="dialogVisible"
      width="50%">
      <el-form :model="resourceForm" label-width="80px" :rules="rules" ref="resourceFormRef">
        <el-form-item label="标题" prop="title">
          <el-input v-model="resourceForm.title"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="resourceForm.description" rows="3"></el-input>
        </el-form-item>
        <el-form-item label="科目" prop="subject">
          <el-select v-model="resourceForm.subject" placeholder="请选择科目">
            <el-option
              v-for="item in subjectOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="resourceForm.type" placeholder="请选择资源类型">
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="级别" prop="level">
          <el-select v-model="resourceForm.level" placeholder="请选择适用级别">
            <el-option
              v-for="item in levelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="resourceForm.keywords" placeholder="多个关键词用逗号分隔"></el-input>
        </el-form-item>
        <el-form-item label="文件" prop="file" v-if="resourceForm.type !== 'link'">
          <el-upload
            class="upload-demo"
            drag
            action="http://localhost:5000/api/resources/upload"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">支持各种文档、图片、视频等文件类型，单个文件不超过50MB</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="外部链接" v-if="resourceForm.type === 'link'" prop="url">
          <el-input v-model="resourceForm.url" placeholder="请输入资源外部链接"></el-input>
        </el-form-item>
        <el-form-item label="缩略图">
          <el-upload
            class="avatar-uploader"
            action="http://localhost:5000/api/resources/upload-thumbnail"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleThumbnailSuccess"
            :before-upload="beforeThumbnailUpload">
            <img v-if="resourceForm.thumbnail" :src="resourceForm.thumbnail" class="avatar">
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 编辑资源对话框 -->
    <el-dialog
      title="编辑资源"
      v-model="editDialogVisible"
      width="50%">
      <el-form :model="editForm" label-width="80px" :rules="rules" ref="editFormRef">
        <el-form-item label="标题" prop="title">
          <el-input v-model="editForm.title"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="editForm.description" rows="3"></el-input>
        </el-form-item>
        <el-form-item label="科目" prop="subject">
          <el-select v-model="editForm.subject" placeholder="请选择科目">
            <el-option
              v-for="item in subjectOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="级别" prop="level">
          <el-select v-model="editForm.level" placeholder="请选择适用级别">
            <el-option
              v-for="item in levelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="editForm.keywords" placeholder="多个关键词用逗号分隔"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'ResourceManagement',
  setup() {
    const resources = ref([])
    const loading = ref(true)
    const dialogVisible = ref(false)
    const editDialogVisible = ref(false)
    const resourceFormRef = ref(null)
    const editFormRef = ref(null)
    
    const subjectOptions = [
      { value: 'math', label: '数学' },
      { value: 'chinese', label: '语文' },
      { value: 'english', label: '英语' },
      { value: 'physics', label: '物理' },
      { value: 'chemistry', label: '化学' },
      { value: 'biology', label: '生物' },
      { value: 'history', label: '历史' },
      { value: 'geography', label: '地理' },
      { value: 'politics', label: '政治' }
    ]
    
    const typeOptions = [
      { value: 'document', label: '文档' },
      { value: 'video', label: '视频' },
      { value: 'audio', label: '音频' },
      { value: 'image', label: '图片' },
      { value: 'exercise', label: '习题' },
      { value: 'link', label: '外部链接' }
    ]
    
    const levelOptions = [
      { value: 'primary', label: '小学' },
      { value: 'junior', label: '初中' },
      { value: 'senior', label: '高中' },
      { value: 'college', label: '大学' }
    ]
    
    const resourceForm = reactive({
      title: '',
      description: '',
      subject: '',
      type: '',
      level: '',
      keywords: '',
      file: null,
      url: '',
      thumbnail: ''
    })
    
    const editForm = reactive({
      id: '',
      title: '',
      description: '',
      subject: '',
      level: '',
      keywords: ''
    })
    
    const rules = {
      title: [
        { required: true, message: '请输入标题', trigger: 'blur' },
        { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
      ],
      description: [
        { required: true, message: '请输入描述', trigger: 'blur' }
      ],
      subject: [
        { required: true, message: '请选择科目', trigger: 'change' }
      ],
      type: [
        { required: true, message: '请选择类型', trigger: 'change' }
      ],
      level: [
        { required: true, message: '请选择级别', trigger: 'change' }
      ],
      file: [
        { required: true, message: '请上传文件', trigger: 'change' }
      ],
      url: [
        { required: true, message: '请输入外部链接', trigger: 'blur' }
      ]
    }
    
    const filters = reactive({
      subject: '',
      type: '',
      level: '',
      keyword: ''
    })
    
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10,
      total: 0
    })
    
    const uploadHeaders = computed(() => {
      return {
        Authorization: `Bearer ${localStorage.getItem('teacherToken')}`
      }
    })
    
    const filteredResources = computed(() => {
      let result = resources.value
      
      if (filters.subject) {
        result = result.filter(item => item.subject === filters.subject)
      }
      
      if (filters.type) {
        result = result.filter(item => item.type === filters.type)
      }
      
      if (filters.level) {
        result = result.filter(item => item.level === filters.level)
      }
      
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase()
        result = result.filter(item => 
          item.title.toLowerCase().includes(keyword) ||
          item.description.toLowerCase().includes(keyword) ||
          (item.keywords && item.keywords.some(k => k.toLowerCase().includes(keyword)))
        )
      }
      
      // 计算总数
      pagination.total = result.length
      
      // 分页
      const start = (pagination.currentPage - 1) * pagination.pageSize
      const end = start + pagination.pageSize
      
      return result.slice(start, end)
    })
    
    onMounted(() => {
      fetchResources()
    })
    
    const fetchResources = async () => {
      loading.value = true
      try {
        // 模拟获取数据
        setTimeout(() => {
          resources.value = [
            {
              id: 1,
              title: '高中数学必修一知识点',
              description: '高中数学必修一重要知识点总结',
              subject: 'math',
              type: 'document',
              level: 'senior',
              uploadDate: '2023-03-16 10:30',
              viewCount: 156,
              downloadCount: 45,
              keywords: ['高中数学', '知识点', '必修一']
            },
            {
              id: 2,
              title: '初中英语语法练习',
              description: '初中英语语法练习题及答案',
              subject: 'english',
              type: 'exercise',
              level: 'junior',
              uploadDate: '2023-03-15 14:20',
              viewCount: 230,
              downloadCount: 120,
              keywords: ['初中英语', '语法', '练习题']
            },
            {
              id: 3,
              title: '物理实验视频教程',
              description: '高中物理实验演示视频',
              subject: 'physics',
              type: 'video',
              level: 'senior',
              uploadDate: '2023-03-14 16:45',
              viewCount: 189,
              downloadCount: 73,
              keywords: ['物理实验', '视频教程', '高中物理']
            }
          ]
          pagination.total = resources.value.length
          loading.value = false
        }, 500)
      } catch (error) {
        console.error('获取资源列表失败:', error)
        loading.value = false
      }
    }
    
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      pagination.currentPage = 1
    }
    
    const handleCurrentChange = (page) => {
      pagination.currentPage = page
    }
    
    const handleUploadSuccess = (res, file) => {
      ElMessage.success('文件上传成功')
      resourceForm.file = res.filePath
    }
    
    const handleUploadError = () => {
      ElMessage.error('文件上传失败')
    }
    
    const beforeUpload = (file) => {
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        ElMessage.error('文件大小不能超过50MB')
        return false
      }
      return true
    }
    
    const handleThumbnailSuccess = (res, file) => {
      resourceForm.thumbnail = res.thumbnailPath
      ElMessage.success('缩略图上传成功')
    }
    
    const beforeThumbnailUpload = (file) => {
      const isJPG = file.type === 'image/jpeg'
      const isPNG = file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2
      
      if (!isJPG && !isPNG) {
        ElMessage.error('缩略图只能是 JPG 或 PNG 格式!')
        return false
      }
      if (!isLt2M) {
        ElMessage.error('缩略图大小不能超过 2MB!')
        return false
      }
      return true
    }
    
    const submitForm = () => {
      if (resourceFormRef.value) {
        resourceFormRef.value.validate(async (valid) => {
          if (valid) {
            try {
              // 模拟提交表单
              ElMessage.success('资源上传成功')
              dialogVisible.value = false
              // 刷新资源列表
              fetchResources()
              // 重置表单
              resourceForm.title = ''
              resourceForm.description = ''
              resourceForm.subject = ''
              resourceForm.type = ''
              resourceForm.level = ''
              resourceForm.keywords = ''
              resourceForm.file = null
              resourceForm.url = ''
              resourceForm.thumbnail = ''
            } catch (error) {
              console.error('上传资源失败:', error)
              ElMessage.error('上传资源失败')
            }
          } else {
            return false
          }
        })
      }
    }
    
    const handleEdit = (row) => {
      editForm.id = row.id
      editForm.title = row.title
      editForm.description = row.description
      editForm.subject = row.subject
      editForm.level = row.level
      editForm.keywords = row.keywords ? row.keywords.join(',') : ''
      
      editDialogVisible.value = true
    }
    
    const submitEditForm = () => {
      if (editFormRef.value) {
        editFormRef.value.validate(async (valid) => {
          if (valid) {
            try {
              // 模拟更新资源
              ElMessage.success('资源更新成功')
              editDialogVisible.value = false
              // 刷新资源列表
              fetchResources()
            } catch (error) {
              console.error('更新资源失败:', error)
              ElMessage.error('更新资源失败')
            }
          } else {
            return false
          }
        })
      }
    }
    
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        '确定要删除该资源吗？',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          // 模拟删除资源
          ElMessage.success('资源删除成功')
          // 刷新资源列表
          fetchResources()
        } catch (error) {
          console.error('删除资源失败:', error)
          ElMessage.error('删除资源失败')
        }
      }).catch(() => {
        // 取消删除
      })
    }
    
    return {
      resources,
      loading,
      dialogVisible,
      editDialogVisible,
      resourceFormRef,
      editFormRef,
      resourceForm,
      editForm,
      rules,
      subjectOptions,
      typeOptions,
      levelOptions,
      filters,
      pagination,
      uploadHeaders,
      filteredResources,
      handleSizeChange,
      handleCurrentChange,
      handleUploadSuccess,
      handleUploadError,
      beforeUpload,
      handleThumbnailSuccess,
      beforeThumbnailUpload,
      submitForm,
      handleEdit,
      submitEditForm,
      handleDelete
    }
  }
}
</script>

<style scoped>
.resource-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 10px;
}

.search-input {
  width: 200px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.avatar {
  width: 120px;
  height: 120px;
  display: block;
}
</style> 