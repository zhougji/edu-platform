<template>
  <div class="profile-page">
    <el-card>
      <div slot="header">
        <span>个人资料</span>
      </div>

      <el-tabs v-model="activeTab">
        <!-- Basic Info Tab -->
        <el-tab-pane label="基本信息" name="basic">
          <el-row :gutter="40" style="margin-top: 20px;">
            <el-col :span="6" style="text-align: center;">
              <el-upload
                class="avatar-uploader"
                action="/api/students/upload-avatar" 
                :headers="uploadHeaders"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
                :on-error="handleAvatarError"
              >
                <el-avatar :size="120" :src="profileForm.avatar || defaultAvatar" class="profile-avatar"></el-avatar>
                <div class="upload-overlay">点击上传头像</div>
              </el-upload>
               <p style="color: #909399; font-size: 0.85em; margin-top: 10px;">支持 JPG/PNG 格式, 小于 2MB</p>
            </el-col>
            <el-col :span="18">
              <el-form :model="profileForm" :rules="profileRules" ref="profileForm" label-width="100px">
                <el-form-item label="姓名" prop="name">
                  <el-input v-model="profileForm.name" placeholder="请输入姓名"></el-input>
                </el-form-item>
                <el-form-item label="邮箱">
                  <el-input :value="profileForm.email" disabled></el-input> 
                </el-form-item>
                <!-- Add other non-editable or editable fields like school, grade etc. -->
                <el-form-item>
                  <el-button type="primary" @click="updateProfile" :loading="isSavingProfile">保存基本信息</el-button>
                </el-form-item>
              </el-form>
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- Change Password Tab -->
        <el-tab-pane label="修改密码" name="password">
          <el-form :model="passwordForm" :rules="passwordRules" ref="passwordForm" label-width="120px" style="margin-top: 20px; max-width: 500px;">
             <el-form-item label="当前密码" prop="currentPassword">
              <el-input type="password" v-model="passwordForm.currentPassword" placeholder="请输入当前密码" show-password></el-input>
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input type="password" v-model="passwordForm.newPassword" placeholder="请输入新密码 (至少6位)" show-password></el-input>
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input type="password" v-model="passwordForm.confirmPassword" placeholder="请再次输入新密码" show-password></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="changePassword" :loading="isSavingPassword">确认修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

    </el-card>
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex';

export default {
  name: 'UserProfile',
  data() {
     // Validator for confirm new password
    const validatePassConfirm = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入新密码'));
      } else if (value !== this.passwordForm.newPassword) {
        callback(new Error('两次输入的新密码不一致!'));
      } else {
        callback();
      }
    };
    
    return {
      activeTab: 'basic',
      isSavingProfile: false,
      isSavingPassword: false,
      profileForm: { // Initialize with current student info
        name: '',
        email: '',
        avatar: ''
      },
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      profileRules: {
        name: [
          { required: true, message: '请输入姓名', trigger: 'blur' }
        ]
        // Add rules for other editable fields if any
      },
      passwordRules: {
         currentPassword: [
          { required: true, message: '请输入当前密码', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请再次输入新密码', trigger: 'blur' },
          { validator: validatePassConfirm, trigger: 'blur' }
        ]
      },
      defaultAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png', // Default user avatar
      uploadHeaders: { // Set auth token for upload requests
         Authorization: `Bearer ${localStorage.getItem('studentToken')}`
      }
    };
  },
  computed: {
    ...mapGetters(['studentInfo'])
  },
  methods: {
    ...mapActions(['updateStudentInfo', 'showSnackbar', 'logout']),

    // --- Profile Update --- 
    updateProfile() {
      this.$refs.profileForm.validate((valid) => {
        if (valid) {
          this.isSavingProfile = true;
          const updatedData = { name: this.profileForm.name }; // Only send editable fields
          
          // Placeholder API call
          this.$axios.put('/students/profile', updatedData)
            .then(response => {
               // Update Vuex store with potentially updated info from backend
              this.updateStudentInfo(response.data || updatedData); 
              this.showSnackbar({ text: '基本信息更新成功!', color: 'success' });
            })
            .catch(error => {
              console.error("Profile update failed:", error.response?.data || error.message);
              const errorMsg = error.response?.data?.message || '信息更新失败';
              this.showSnackbar({ text: errorMsg, color: 'error' });
            })
            .finally(() => {
              this.isSavingProfile = false;
            });
        }
      });
    },

    // --- Avatar Upload --- 
    handleAvatarSuccess(res, file) {
      // Assuming backend returns the new avatar URL in res.url or similar
      const newAvatarUrl = res.url || URL.createObjectURL(file.raw);
      this.profileForm.avatar = newAvatarUrl;
      // Update avatar in Vuex store as well
      this.updateStudentInfo({ avatar: newAvatarUrl });
      this.showSnackbar({ text: '头像上传成功!', color: 'success' });
    },
    beforeAvatarUpload(file) {
      const isJPG = file.type === 'image/jpeg';
      const isPNG = file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG && !isPNG) {
        this.$message.error('上传头像图片只能是 JPG 或 PNG 格式!');
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!');
      }
      return (isJPG || isPNG) && isLt2M;
    },
     handleAvatarError(err) {
       console.error("Avatar upload failed:", err);
       this.showSnackbar({ text: '头像上传失败，请重试', color: 'error' });
    },

    // --- Password Change ---
    changePassword() {
      this.$refs.passwordForm.validate((valid) => {
        if (valid) {
          this.isSavingPassword = true;
          const passwordData = {
             currentPassword: this.passwordForm.currentPassword,
             newPassword: this.passwordForm.newPassword
          };
          // Placeholder API call
          this.$axios.put('/students/password', passwordData)
            .then(() => {
              this.showSnackbar({ text: '密码修改成功！请重新登录。', color: 'success' });
              this.$refs.passwordForm.resetFields(); // Clear form
              // Force logout after password change for security
              setTimeout(() => {
                  this.logout(); // Call Vuex logout action
                  this.$router.push('/login').catch(()=>{});
              }, 1500);
            })
            .catch(error => {
              console.error("Password change failed:", error.response?.data || error.message);
              const errorMsg = error.response?.data?.message || '密码修改失败，请检查当前密码是否正确';
              this.showSnackbar({ text: errorMsg, color: 'error' });
            })
            .finally(() => {
              this.isSavingPassword = false;
            });
        }
      });
    },

    // --- Initialization ---
    setInitialData() {
        if (this.studentInfo) {
            this.profileForm.name = this.studentInfo.name || '';
            this.profileForm.email = this.studentInfo.email || '';
            this.profileForm.avatar = this.studentInfo.avatar || '';
        }
    }
  },
  created() {
    this.setInitialData();
  },
  watch: {
      // Update form if studentInfo changes (e.g., after initial load)
      studentInfo(newInfo) {
          if (newInfo) {
            this.setInitialData();
          }
      }
  }
};
</script>

<style scoped>
.profile-page {
  padding: 20px;
}

.avatar-uploader {
  position: relative;
  display: inline-block;
  border-radius: 50%;
  overflow: hidden; /* Ensures overlay stays within bounds */
  cursor: pointer;
}

.avatar-uploader:hover .upload-overlay {
  opacity: 1;
}

.profile-avatar {
  display: block; /* Prevent extra space below avatar */
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  font-size: 0.9em;
  text-align: center;
  padding: 5px;
}

/* Remove default upload styles */
.avatar-uploader .el-upload {
  border: none;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 120px; /* Match avatar size */
  height: 120px; /* Match avatar size */
}

/* Style form for password change */
.el-tab-pane[name="password"] .el-form {
    padding: 20px;
    border: 1px solid #eee;
    border-radius: 4px;
    background-color: #fdfdfd;
}

</style> 