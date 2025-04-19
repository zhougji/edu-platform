<template>
  <div class="exercise-item" :class="{'exercise-item--completed': exercise.status === 'completed'}">
    <div class="exercise-item__info">
      <div class="exercise-item__title">{{ exercise.title }}</div>
      <div class="exercise-item__meta">
        <span class="subject">
          <i class="el-icon-collection-tag"></i> {{ exercise.subject }}
        </span>
        <span class="teacher">
          <i class="el-icon-user"></i> {{ exercise.teacher }}
        </span>
        <span v-if="exercise.status === 'pending'" class="due-date" :class="{'due-date--soon': isCloseToDue}">
          <i class="el-icon-time"></i> 截止: {{ formatDueDate(exercise.dueDate) }}
        </span>
        <span v-else class="submission-date">
          <i class="el-icon-check"></i> 提交于: {{ formatTime(exercise.submittedAt) }}
        </span>
        <span v-if="exercise.status === 'completed'" class="score">
          <i class="el-icon-trophy"></i> 得分: {{ exercise.score }}/{{ exercise.totalScore }}
        </span>
      </div>
    </div>
    <div class="exercise-item__actions">
      <el-button 
        v-if="exercise.status === 'pending'" 
        type="primary" 
        size="small" 
        @click="$emit('start', exercise)"
      >
        开始练习
      </el-button>
      <el-button 
        v-else 
        type="info" 
        size="small" 
        @click="$emit('view', exercise)"
      >
        查看结果
      </el-button>
    </div>
  </div>
</template>

<script>
import { formatTimeAgo } from '@/utils/dateFormat';

export default {
  name: 'ExerciseItem',
  props: {
    exercise: {
      type: Object,
      required: true
    }
  },
  computed: {
    isCloseToDue() {
      if (!this.exercise.dueDate) return false;
      const now = new Date();
      const dueDate = new Date(this.exercise.dueDate);
      // 如果截止日期在24小时内
      const hoursDiff = (dueDate - now) / (1000 * 60 * 60);
      return hoursDiff <= 24 && hoursDiff > 0;
    }
  },
  methods: {
    formatDueDate(date) {
      const dueDate = new Date(date);
      const now = new Date();
      const diffTime = dueDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return '已过期';
      } else if (diffDays === 0) {
        return '今天';
      } else if (diffDays === 1) {
        return '明天';
      } else if (diffDays <= 7) {
        return `${diffDays}天后`;
      } else {
        return dueDate.toLocaleDateString();
      }
    },
    formatTime(date) {
      return formatTimeAgo(date);
    }
  }
};
</script>

<style scoped>
.exercise-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
}

.exercise-item:hover {
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1);
}

.exercise-item--completed {
  background-color: #f9f9f9;
}

.exercise-item__info {
  flex: 1;
}

.exercise-item__title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.exercise-item__meta {
  display: flex;
  flex-wrap: wrap;
  color: #909399;
  font-size: 13px;
}

.exercise-item__meta span {
  margin-right: 15px;
  display: inline-flex;
  align-items: center;
}

.exercise-item__meta i {
  margin-right: 4px;
}

.due-date--soon {
  color: #e6a23c;
  font-weight: 600;
}

.score {
  color: #67c23a;
  font-weight: 600;
}

.exercise-item__actions {
  margin-left: 20px;
}

@media (max-width: 768px) {
  .exercise-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .exercise-item__meta {
    margin-bottom: 15px;
  }
  
  .exercise-item__actions {
    margin-left: 0;
    align-self: flex-end;
  }
}
</style> 