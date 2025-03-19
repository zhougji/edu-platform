<template>
  <div class="profile-container" v-if="profile">
    <el-card class="profile-card">
      <h2 style="text-align:center;">个人资料</h2>
      <el-form :model="form" label-width="100px">
        <el-form-item label="昵称">
          <el-input v-model="form.nickname"></el-input>
        </el-form-item>
        <el-form-item label="头像">
          <el-upload
              class="avatar-uploader"
              action="https://jsonplaceholder.typicode.com/posts/"  <!-- 请替换为实际上传接口 -->
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload">
          <img v-if="form.avatar" :src="form.avatar" class="avatar" alt="avatar">
          <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
        </el-form-item>
      </el-form>
      <div style="text-align:center; margin-top: 20px;">
        <el-button type="primary" @click="saveProfile">保存</el-button>
        <el-button @click="cancelEdit">取消</el-button>
      </div>
    </el-card>
  </div>
  <div v-else class="loading-container">
    <el-skeleton animated />
  </div>
</template>

<script>
import axios from 'axios'
export default {
  name: "Profile",
  data() {
    return {
      profile: null,
      form: {
        nickname: '',
        avatar: ''
      }
    }
  },
  mounted() {
    const token = localStorage.getItem('token')
    axios.get('http://localhost:5000/api/student/profile', {
      headers: { 'x-auth-token': token }
    }).then(res => {
      this.profile = res.data
      this.form.nickname = res.data.nickname || res.data.name
      this.form.avatar = res.data.avatar || ''
    }).catch(err => {
      console.error(err)
    })
  },
  methods: {
    handleAvatarSuccess(response, file) {
      this.form.avatar = response.url || URL.createObjectURL(file.raw)
    },
    beforeAvatarUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isImage) {
        this.$message.error('上传头像图片只能是图片格式!')
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!')
      }
      return isImage && isLt2M
    },
    saveProfile() {
      const token = localStorage.getItem('token')
      axios.put('http://localhost:5000/api/student/profile', {
        nickname: this.form.nickname,
        avatar: this.form.avatar
      }, {
        headers: { 'x-auth-token': token }
      }).then(res => {
        this.$message.success('资料更新成功')
        this.profile = res.data
        localStorage.setItem('user', JSON.stringify(res.data))
        this.$router.push('/');
      }).catch(err => {
        this.$message.error('更新失败')
      })
    },
    cancelEdit() {
      this.form.nickname = this.profile.nickname || this.profile.name
      this.form.avatar = this.profile.avatar || ''
    }
  }
}
</script>

<style scoped>
.profile-container {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}
.profile-card {
  width: 100%;
  max-width: 500px;
  border-radius: 8px;
  padding: 20px;
}
.avatar-uploader {
  display: block;
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100%;
  height: 100%;
  line-height: 100px;
  text-align: center;
}
.avatar {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 50%;
}
.loading-container {
  text-align: center;
  padding: 40px;
}
</style>
