<template>
  <div>
    <!-- 轮播图 -->
    <el-carousel height="300px" trigger="click" autoplay>
      <el-carousel-item v-for="item in carouselItems" :key="item.id">
        <img :src="item.image" alt="Banner" style="width:100%; height: 300px; object-fit: cover;" />
      </el-carousel-item>
    </el-carousel>
    <!-- 课程列表 -->
    <div class="courses-grid">
      <el-card v-for="course in courses" :key="course._id" class="course-card" shadow="hover">
        <img :src="course.thumbnail || 'https://via.placeholder.com/300x150?text=Course'" alt="course image" class="course-thumbnail" />
        <div class="course-info">
          <h3>{{ course.title }}</h3>
          <p>{{ course.description }}</p>
          <el-tag type="info">{{ course.subject }}</el-tag>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  data() {
    return {
      carouselItems: [
        { id: 1, image: 'https://via.placeholder.com/1200x300?text=Banner+1' },
        { id: 2, image: 'https://via.placeholder.com/1200x300?text=Banner+2' },
        { id: 3, image: 'https://via.placeholder.com/1200x300?text=Banner+3' }
      ],
      courses: []
    }
  },
  mounted() {
    axios.get('http://localhost:5000/api/courses')
        .then(res => {
          // 这里假设每个课程包含 thumbnail, title, description, subject 等字段
          this.courses = res.data;
        })
        .catch(err => console.error(err))
  }
}
</script>

<style scoped>
.courses-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 20px;
  background-color: #f0f2f5;
}
.course-card {
  width: calc(25% - 20px);
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s;
}
.course-card:hover {
  transform: scale(1.05);
}
.course-thumbnail {
  width: 100%;
  height: 150px;
  object-fit: cover;
}
.course-info {
  padding: 10px;
}
.course-info h3 {
  margin: 0;
  font-size: 18px;
}
.course-info p {
  font-size: 14px;
  color: #666;
}
@media (max-width: 1200px) {
  .course-card {
    width: calc(33.33% - 20px);
  }
}
@media (max-width: 768px) {
  .course-card {
    width: calc(50% - 20px);
  }
}
@media (max-width: 480px) {
  .course-card {
    width: 100%;
  }
}
</style>
