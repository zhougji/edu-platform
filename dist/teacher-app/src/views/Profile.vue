<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <!-- 左侧个人资料卡片 -->
      <el-col :span="8">
        <el-card class="profile-card">
          <div slot="header" class="header">
            <span>个人资料</span>
            <el-button type="text" @click="editAvatar" style="float: right; padding: 3px 0">
              <i class="el-icon-edit"></i> 修改头像
            </el-button>
          </div>
          
          <div class="profile-avatar-container">
            <el-avatar :size="120" :src="profile.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'"></el-avatar>
          </div>
          
          <div class="profile-info">
            <h2>{{ profile.realName || '未设置' }}</h2>
            <p><i class="el-icon-user"></i> {{ profile.username || '未设置' }}</p>
            <p><i class="el-icon-message"></i> {{ profile.email || '未设置' }}</p>
            <el-tag v-if="profile.verificationStatus === 'verified'" type="success">实名已认证</el-tag>
            <el-tag v-else-if="profile.verificationStatus === 'pending'" type="warning">认证审核中</el-tag>
            <el-tag v-else type="info">未认证</el-tag>
          </div>
          
          <div class="profile-subjects" v-if="profile.subjects && profile.subjects.length">
            <h3>教学学科</h3>
            <el-tag v-for="subject in displaySubjects" :key="subject" style="margin-right: 5px; margin-bottom: 5px;">{{ subject }}</el-tag>
          </div>
        </el-card>
      </el-col>
      
      <!-- 右侧编辑表单 -->
      <el-col :span="16">
        <el-card>
          <div slot="header" class="header">
            <span>编辑个人信息</span>
          </div>
          
          <el-tabs v-model="activeTab">
            <!-- 基本信息 -->
            <el-tab-pane label="基本信息" name="basic">
              <el-form :model="editForm.basic" ref="basicForm" label-width="100px" :rules="rules.basic">
                <el-form-item label="用户名" prop="username">
                  <el-input v-model="editForm.basic.username"></el-input>
                </el-form-item>
                
                <el-form-item label="电子邮箱" prop="email">
                  <el-input v-model="editForm.basic.email"></el-input>
                </el-form-item>
                
                <el-form-item label="手机号码" prop="phone">
                  <el-input v-model="editForm.basic.phone"></el-input>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="updateBasic" :loading="loading.basic">保存更改</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            
            <!-- 专业信息 -->
            <el-tab-pane label="专业信息" name="professional">
              <el-form :model="editForm.professional" ref="professionalForm" label-width="100px" :rules="rules.professional">
                <el-form-item label="教学学科" prop="subjects">
                  <el-select v-model="editForm.professional.subjects" multiple placeholder="请选择教学学科" style="width: 100%;">
                    <el-option label="数学" value="数学"></el-option>
                    <el-option label="语文" value="语文"></el-option>
                    <el-option label="英语" value="英语"></el-option>
                    <el-option label="物理" value="物理"></el-option>
                    <el-option label="化学" value="化学"></el-option>
                    <el-option label="生物" value="生物"></el-option>
                    <el-option label="历史" value="历史"></el-option>
                    <el-option label="地理" value="地理"></el-option>
                    <el-option label="政治" value="政治"></el-option>
                    <el-option label="其他" value="其他"></el-option>
                  </el-select>
                </el-form-item>
                
                <el-form-item label="擅长领域" prop="specialties">
                  <el-input type="textarea" v-model="editForm.professional.specialties" rows="3"></el-input>
                </el-form-item>
                
                <el-form-item label="教学经验" prop="experience">
                  <el-input-number v-model="editForm.professional.experience" :min="0" :max="50"></el-input-number>
                  <span style="margin-left: 10px;">年</span>
                </el-form-item>
                
                <el-form-item label="个人简介" prop="introduction">
                  <el-input type="textarea" v-model="editForm.professional.introduction" rows="5" placeholder="请输入您的个人简介，包括所教学科、特长、教学风格等"></el-input>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="updateProfessional" :loading="loading.professional">保存更改</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            
            <!-- 安全设置 -->
            <el-tab-pane label="安全设置" name="security">
              <el-form :model="editForm.security" ref="securityForm" label-width="100px" :rules="rules.security">
                <el-form-item label="当前密码" prop="currentPassword">
                  <el-input type="password" v-model="editForm.security.currentPassword" placeholder="请输入当前密码"></el-input>
                </el-form-item>
                
                <el-form-item label="新密码" prop="newPassword">
                  <el-input type="password" v-model="editForm.security.newPassword" placeholder="请输入新密码"></el-input>
                </el-form-item>
                
                <el-form-item label="确认新密码" prop="confirmPassword">
                  <el-input type="password" v-model="editForm.security.confirmPassword" placeholder="请再次输入新密码"></el-input>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="updatePassword" :loading="loading.security">更新密码</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 头像上传对话框 -->
    <el-dialog title="更新头像" :visible.sync="dialogVisible" width="400px">
      <el-upload
        class="avatar-uploader"
        action="http://localhost:3000/api/teachers/avatar"
        :headers="uploadHeaders"
        :show-file-list="false"
        :on-success="handleAvatarSuccess"
        :on-error="handleAvatarError"
        :before-upload="beforeAvatarUpload">
        <img v-if="tempAvatar" :src="tempAvatar" class="avatar">
        <i v-else class="el-icon-plus avatar-uploader-icon"></i>
      </el-upload>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAvatar" :loading="loading.avatar">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'Profile',
  data() {
    // 密码确认验证
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.editForm.security.newPassword) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }
    
    return {
      activeTab: 'basic',
      dialogVisible: false,
      tempAvatar: '',
      
      // 教师个人资料
      profile: {
        username: '',
        email: '',
        phone: '',
        realName: '',
        subjects: [],
        specialties: '',
        experience: 0,
        introduction: '',
        avatar: '',
        verificationStatus: ''
      },
      
      // 编辑表单
      editForm: {
        basic: {
          username: '',
          email: '',
          phone: ''
        },
        professional: {
          subjects: [],
          specialties: '',
          experience: 0,
          introduction: ''
        },
        security: {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
      },
      
      // 表单验证规则
      rules: {
        basic: {
          username: [
            { required: true, message: '请输入用户名', trigger: 'blur' },
            { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
          ],
          email: [
            { required: true, message: '请输入电子邮箱', trigger: 'blur' },
            { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
          ],
          phone: [
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
          ]
        },
        professional: {
          subjects: [
            { required: true, message: '请至少选择一个教学学科', trigger: 'change' }
          ],
          introduction: [
            { required: true, message: '请输入个人简介', trigger: 'blur' },
            { min: 50, message: '简介内容至少50个字符', trigger: 'blur' }
          ]
        },
        security: {
          currentPassword: [
            { required: true, message: '请输入当前密码', trigger: 'blur' }
          ],
          newPassword: [
            { required: true, message: '请输入新密码', trigger: 'blur' },
            { min: 6, message: '密码长度至少6个字符', trigger: 'blur' }
          ],
          confirmPassword: [
            { required: true, message: '请再次输入新密码', trigger: 'blur' },
            { validator: validateConfirmPassword, trigger: 'blur' }
          ]
        }
      },
      
      // 加载状态
      loading: {
        basic: false,
        professional: false,
        security: false,
        avatar: false
      }
    }
  },
  computed: {
    // 上传头像的请求头
    uploadHeaders() {
      return {
        Authorization: `Bearer ${localStorage.getItem('teacherToken')}`
      }
    },
    
    // 显示的学科名称
    displaySubjects() {
      return this.profile.subjects || []
    }
  },
  methods: {
    // 获取教师个人资料
    fetchProfile() {
      const teacherId = JSON.parse(localStorage.getItem('teacherInfo'))?.id
      if (!teacherId) return
      
      this.$axios.get(`/teachers/${teacherId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('teacherToken')}` }
      })
        .then(response => {
          this.profile = response.data
          // 初始化编辑表单
          this.editForm.basic = {
            username: this.profile.username || '',
            email: this.profile.email || '',
            phone: this.profile.phone || ''
          }
          this.editForm.professional = {
            subjects: this.profile.subjects || [],
            specialties: this.profile.specialties || '',
            experience: this.profile.experience || 0,
            introduction: this.profile.introduction || ''
          }
        })
        .catch(error => {
          console.error('Error fetching profile:', error)
          this.$message.error('获取个人资料失败')
        })
    },
    
    // 更新基本信息
    updateBasic() {
      this.$refs.basicForm.validate(valid => {
        if (valid) {
          this.loading.basic = true
          
          this.$axios.put('/teachers/profile', this.editForm.basic, {
            headers: { Authorization: `Bearer ${localStorage.getItem('teacherToken')}` }
          })
            .then(() => {
              this.$message.success('基本信息更新成功')
              this.fetchProfile() // 刷新个人资料
            })
            .catch(error => {
              console.error('Error updating basic info:', error)
              this.$message.error(error.response?.data?.message || '更新失败')
            })
            .finally(() => {
              this.loading.basic = false
            })
        }
      })
    },
    
    // 更新专业信息
    updateProfessional() {
      this.$refs.professionalForm.validate(valid => {
        if (valid) {
          this.loading.professional = true
          
          this.$axios.put('/teachers/professional', this.editForm.professional, {
            headers: { Authorization: `Bearer ${localStorage.getItem('teacherToken')}` }
          })
            .then(() => {
              this.$message.success('专业信息更新成功')
              this.fetchProfile() // 刷新个人资料
            })
            .catch(error => {
              console.error('Error updating professional info:', error)
              this.$message.error(error.response?.data?.message || '更新失败')
            })
            .finally(() => {
              this.loading.professional = false
            })
        }
      })
    },
    
    // 更新密码
    updatePassword() {
      this.$refs.securityForm.validate(valid => {
        if (valid) {
          this.loading.security = true
          
          this.$axios.put('/teachers/password', this.editForm.security, {
            headers: { Authorization: `Bearer ${localStorage.getItem('teacherToken')}` }
          })
            .then(() => {
              this.$message.success('密码更新成功')
              this.editForm.security = {
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              }
            })
            .catch(error => {
              console.error('Error updating password:', error)
              this.$message.error(error.response?.data?.message || '更新失败')
            })
            .finally(() => {
              this.loading.security = false
            })
        }
      })
    },
    
    // 打开头像编辑对话框
    editAvatar() {
      this.dialogVisible = true
      this.tempAvatar = this.profile.avatar
    },
    
    // 处理头像上传成功
    handleAvatarSuccess(res, file) {
      this.tempAvatar = URL.createObjectURL(file.raw)
    },
    
    // 处理头像上传错误
    handleAvatarError() {
      this.$message.error('头像上传失败')
    },
    
    // 上传前验证头像文件
    beforeAvatarUpload(file) {
      const isImage = file.type.indexOf('image/') === 0
      const isLt2M = file.size / 1024 / 1024 < 2
      
      if (!isImage) {
        this.$message.error('上传头像只能是图片格式!')
      }
      if (!isLt2M) {
        this.$message.error('上传头像大小不能超过 2MB!')
      }
      return isImage && isLt2M
    },
    
    // 保存头像
    saveAvatar() {
      this.loading.avatar = true
      this.profile.avatar = this.tempAvatar
      this.dialogVisible = false
      this.loading.avatar = false
      this.$message.success('头像更新成功')
    }
  },
  created() {
    this.fetchProfile()
  }
}
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.header {
  font-weight: bold;
}

.profile-card {
  margin-bottom: 20px;
}

.profile-avatar-container {
  text-align: center;
  margin: 20px 0;
}

.profile-info {
  text-align: center;
  margin-bottom: 20px;
}

.profile-info h2 {
  margin: 10px 0;
}

.profile-info p {
  margin: 5px 0;
  color: #606266;
}

.profile-subjects {
  margin-top: 20px;
}

.profile-subjects h3 {
  font-size: 16px;
  margin-bottom: 10px;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100%;
  text-align: center;
}

.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
  margin: 0 auto;
}
</style> 