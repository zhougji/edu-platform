<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="profile-card">
          <div class="profile-header">
            <el-avatar :size="100" :src="teacherInfo.avatar || defaultAvatar">
              {{ teacherInfo.name ? teacherInfo.name.charAt(0).toUpperCase() : 'T' }}
            </el-avatar>
            <h2>{{ teacherInfo.name }}</h2>
            <p class="profile-role">教师</p>
          </div>
          
          <div class="profile-info">
            <div class="info-item">
              <i class="el-icon-message"></i>
              <span>{{ teacherInfo.email }}</span>
            </div>
            <div class="info-item">
              <i class="el-icon-phone"></i>
              <span>{{ teacherInfo.phone || '未设置' }}</span>
            </div>
            <div class="info-item">
              <i class="el-icon-office-building"></i>
              <span>{{ teacherInfo.school || '未设置' }}</span>
            </div>
            <div class="info-item">
              <i class="el-icon-user"></i>
              <span>{{ teacherInfo.title || '未设置' }}</span>
            </div>
          </div>
          
          <div class="profile-stats">
            <div class="stat-item">
              <div class="stat-value">{{ stats.resourceCount }}</div>
              <div class="stat-label">上传资源</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ stats.consultCount }}</div>
              <div class="stat-label">已完成咨询</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ stats.rating }}</div>
              <div class="stat-label">平均评分</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
              <el-button
                type="text"
                @click="isEditing = true"
                v-if="!isEditing">
                编辑
              </el-button>
            </div>
          </template>
          
          <div v-if="!isEditing" class="info-display">
            <div class="info-row">
              <div class="info-label">姓名</div>
              <div class="info-value">{{ teacherInfo.name }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">邮箱</div>
              <div class="info-value">{{ teacherInfo.email }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">手机</div>
              <div class="info-value">{{ teacherInfo.phone || '未设置' }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">学校</div>
              <div class="info-value">{{ teacherInfo.school || '未设置' }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">职称</div>
              <div class="info-value">{{ teacherInfo.title || '未设置' }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">教授科目</div>
              <div class="info-value">
                <el-tag
                  v-for="subject in teacherInfo.subjects"
                  :key="subject"
                  size="small"
                  class="subject-tag">
                  {{ getSubjectLabel(subject) }}
                </el-tag>
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">个人简介</div>
              <div class="info-value">{{ teacherInfo.bio || '未设置' }}</div>
            </div>
          </div>
          
          <el-form
            v-else
            :model="editForm"
            :rules="rules"
            ref="editFormRef"
            label-width="80px">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="editForm.name"></el-input>
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="editForm.email"></el-input>
            </el-form-item>
            <el-form-item label="手机" prop="phone">
              <el-input v-model="editForm.phone"></el-input>
            </el-form-item>
            <el-form-item label="学校" prop="school">
              <el-input v-model="editForm.school"></el-input>
            </el-form-item>
            <el-form-item label="职称" prop="title">
              <el-input v-model="editForm.title"></el-input>
            </el-form-item>
            <el-form-item label="教授科目" prop="subjects">
              <el-select
                v-model="editForm.subjects"
                multiple
                placeholder="请选择教授科目">
                <el-option
                  v-for="item in subjectOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value">
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="个人简介" prop="bio">
              <el-input
                type="textarea"
                :rows="4"
                v-model="editForm.bio">
              </el-input>
            </el-form-item>
            <el-form-item label="头像">
              <el-upload
                class="avatar-uploader"
                action="http://localhost:5000/api/teachers/upload-avatar"
                :headers="uploadHeaders"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload">
                <img v-if="editForm.avatar" :src="editForm.avatar" class="avatar">
                <i v-else class="el-icon-plus avatar-uploader-icon"></i>
              </el-upload>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitForm">保存</el-button>
              <el-button @click="cancelEdit">取消</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <el-card class="security-card">
          <template #header>
            <div class="card-header">
              <span>安全设置</span>
            </div>
          </template>
          
          <div class="security-item">
            <div>
              <div class="security-title">修改密码</div>
              <div class="security-desc">定期更改密码可以保护您的账户安全</div>
            </div>
            <el-button size="small" @click="showPasswordDialog = true">修改</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 修改密码对话框 -->
    <el-dialog
      title="修改密码"
      v-model="showPasswordDialog"
      width="30%">
      <el-form
        :model="passwordForm"
        :rules="passwordRules"
        ref="passwordFormRef"
        label-width="100px">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            type="password"
            v-model="passwordForm.currentPassword"
            show-password>
          </el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            type="password"
            v-model="passwordForm.newPassword"
            show-password>
          </el-input>
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            type="password"
            v-model="passwordForm.confirmPassword"
            show-password>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPasswordDialog = false">取消</el-button>
          <el-button type="primary" @click="submitPasswordForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

export default {
  name: 'TeacherProfile',
  setup() {
    const store = useStore()
    const isEditing = ref(false)
    const editFormRef = ref(null)
    const passwordFormRef = ref(null)
    const showPasswordDialog = ref(false)
    
    const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    
    const teacherInfo = computed(() => store.state.teacher || {})
    
    const stats = reactive({
      resourceCount: 0,
      consultCount: 0,
      rating: 0
    })
    
    const editForm = reactive({
      name: '',
      email: '',
      phone: '',
      school: '',
      title: '',
      subjects: [],
      bio: '',
      avatar: ''
    })
    
    const passwordForm = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    
    const rules = {
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
      ],
      phone: [
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
      ]
    }
    
    const passwordRules = {
      currentPassword: [
        { required: true, message: '请输入当前密码', trigger: 'blur' }
      ],
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请再次输入新密码', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value !== passwordForm.newPassword) {
              callback(new Error('两次输入的密码不一致'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    }
    
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
    
    const uploadHeaders = computed(() => {
      return {
        Authorization: `Bearer ${localStorage.getItem('teacherToken')}`
      }
    })
    
    onMounted(async () => {
      // 获取教师统计数据
      try {
        // 这里应该从API获取数据，暂时使用模拟数据
        stats.resourceCount = 25
        stats.consultCount = 132
        stats.rating = 4.8
      } catch (error) {
        console.error('获取教师统计数据失败:', error)
      }
      
      // 初始化编辑表单
      if (teacherInfo.value) {
        editForm.name = teacherInfo.value.name || ''
        editForm.email = teacherInfo.value.email || ''
        editForm.phone = teacherInfo.value.phone || ''
        editForm.school = teacherInfo.value.school || ''
        editForm.title = teacherInfo.value.title || ''
        editForm.subjects = teacherInfo.value.subjects || []
        editForm.bio = teacherInfo.value.bio || ''
        editForm.avatar = teacherInfo.value.avatar || ''
      }
    })
    
    const getSubjectLabel = (value) => {
      const option = subjectOptions.find(item => item.value === value)
      return option ? option.label : value
    }
    
    const cancelEdit = () => {
      isEditing.value = false
      // 重置表单为当前教师信息
      editForm.name = teacherInfo.value.name || ''
      editForm.email = teacherInfo.value.email || ''
      editForm.phone = teacherInfo.value.phone || ''
      editForm.school = teacherInfo.value.school || ''
      editForm.title = teacherInfo.value.title || ''
      editForm.subjects = teacherInfo.value.subjects || []
      editForm.bio = teacherInfo.value.bio || ''
      editForm.avatar = teacherInfo.value.avatar || ''
    }
    
    const submitForm = () => {
      if (editFormRef.value) {
        editFormRef.value.validate(async (valid) => {
          if (valid) {
            try {
              // 这里应该调用API更新教师信息
              // 暂时使用本地更新模拟
              store.commit('updateTeacher', {
                ...teacherInfo.value,
                name: editForm.name,
                email: editForm.email,
                phone: editForm.phone,
                school: editForm.school,
                title: editForm.title,
                subjects: editForm.subjects,
                bio: editForm.bio,
                avatar: editForm.avatar
              })
              
              ElMessage.success('个人信息更新成功')
              isEditing.value = false
            } catch (error) {
              console.error('更新教师信息失败:', error)
              ElMessage.error('更新失败，请重试')
            }
          } else {
            return false
          }
        })
      }
    }
    
    const handleAvatarSuccess = (res, file) => {
      editForm.avatar = res.avatarUrl
      ElMessage.success('头像上传成功')
    }
    
    const beforeAvatarUpload = (file) => {
      const isJPG = file.type === 'image/jpeg'
      const isPNG = file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2
      
      if (!isJPG && !isPNG) {
        ElMessage.error('头像只能是 JPG 或 PNG 格式!')
        return false
      }
      if (!isLt2M) {
        ElMessage.error('头像大小不能超过 2MB!')
        return false
      }
      return true
    }
    
    const submitPasswordForm = () => {
      if (passwordFormRef.value) {
        passwordFormRef.value.validate(async (valid) => {
          if (valid) {
            try {
              // 这里应该调用API更新密码
              ElMessage.success('密码修改成功')
              showPasswordDialog.value = false
              // 重置密码表单
              passwordForm.currentPassword = ''
              passwordForm.newPassword = ''
              passwordForm.confirmPassword = ''
            } catch (error) {
              console.error('修改密码失败:', error)
              ElMessage.error('修改失败，请重试')
            }
          } else {
            return false
          }
        })
      }
    }
    
    return {
      isEditing,
      teacherInfo,
      stats,
      editForm,
      rules,
      editFormRef,
      passwordForm,
      passwordRules,
      passwordFormRef,
      showPasswordDialog,
      subjectOptions,
      uploadHeaders,
      defaultAvatar,
      getSubjectLabel,
      cancelEdit,
      submitForm,
      handleAvatarSuccess,
      beforeAvatarUpload,
      submitPasswordForm
    }
  }
}
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card {
  height: 100%;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
}

.profile-header h2 {
  margin: 10px 0 5px;
  font-size: 20px;
}

.profile-role {
  color: #909399;
  margin: 0;
}

.profile-info {
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.info-item i {
  margin-right: 8px;
  font-size: 18px;
  color: #409EFF;
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-display {
  padding: 10px 0;
}

.info-row {
  display: flex;
  margin-bottom: 20px;
}

.info-label {
  width: 100px;
  color: #909399;
}

.info-value {
  flex: 1;
}

.security-card {
  margin-top: 20px;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.security-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.security-desc {
  color: #909399;
  font-size: 14px;
}

.subject-tag {
  margin-right: 5px;
  margin-bottom: 5px;
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