<template>
  <div class="consultations">
    <div class="page-header">
      <h1>在线辅导</h1>
      <p>管理您的学生辅导请求</p>
    </div>

    <!-- Status Tabs -->
    <el-tabs v-model="activeTab" @tab-click="fetchConsultations">
      <el-tab-pane label="待处理" name="0">
        <template #label>
          <span><i class="el-icon-time"></i> 待处理</span>
        </template>
      </el-tab-pane>
      <el-tab-pane label="即将进行" name="1">
        <template #label>
          <span><i class="el-icon-date"></i> 即将进行</span>
        </template>
      </el-tab-pane>
      <el-tab-pane label="已完成" name="2">
        <template #label>
          <span><i class="el-icon-check"></i> 已完成</span>
        </template>
      </el-tab-pane>
      <el-tab-pane label="已拒绝" name="3">
        <template #label>
          <span><i class="el-icon-close"></i> 已拒绝</span>
        </template>
      </el-tab-pane>
      <el-tab-pane label="全部" name="4">
        <template #label>
          <span><i class="el-icon-folder"></i> 全部</span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <el-card class="filter-card">
      <!-- Filters -->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-select
            v-model="filters.subject"
            placeholder="按学科筛选"
            clearable
            style="width: 100%"
            @change="fetchConsultations"
          >
            <el-option
              v-for="subject in subjectOptions"
              :key="subject"
              :label="subject"
              :value="subject"
            ></el-option>
          </el-select>
        </el-col>
        <el-col :span="16">
          <el-input
            v-model="filters.search"
            placeholder="搜索学生姓名或主题"
            prefix-icon="el-icon-search"
            clearable
            @input="debounceSearch"
          ></el-input>
        </el-col>
      </el-row>

      <!-- Consultations Table -->
      <el-table
        :data="consultations"
        style="width: 100%; margin-top: 20px"
        v-loading="loading"
        border
      >
        <!-- Date and Time Column -->
        <el-table-column label="日期和时间" width="180">
          <template #default="scope">
            <div>{{ formatDate(scope.row.scheduledFor) }}</div>
            <div class="time-text">{{ formatTime(scope.row.scheduledFor) }}</div>
            <el-tag
              size="mini"
              :type="getDurationType(scope.row.duration)"
              class="duration-tag"
            >
              {{ scope.row.duration }} 分钟
            </el-tag>
          </template>
        </el-table-column>

        <!-- Student Column -->
        <el-table-column label="学生" width="220">
          <template #default="scope">
            <div class="student-info">
              <el-avatar
                :size="32"
                :src="scope.row.student.avatar"
                icon="el-icon-user"
              ></el-avatar>
              <div class="student-details">
                <div>{{ scope.row.student.name }}</div>
                <div class="email-text">{{ scope.row.student.email }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Subject Column -->
        <el-table-column label="学科" width="150">
          <template #default="scope">
            <el-tag
              :type="getSubjectType(scope.row.subject)"
              effect="plain"
            >
              {{ scope.row.subject }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Topic Column -->
        <el-table-column label="主题">
          <template #default="scope">
            <div>{{ scope.row.topic }}</div>
            <div class="description-text">{{ scope.row.description }}</div>
          </template>
        </el-table-column>

        <!-- Status Column -->
        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-tag
              :type="getStatusType(scope.row.status)"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Actions Column -->
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <!-- View Details Button -->
              <el-tooltip content="查看详情" placement="top">
                <el-button
                  type="primary"
                  icon="el-icon-view"
                  size="mini"
                  circle
                  @click="viewConsultationDetails(scope.row)"
                ></el-button>
              </el-tooltip>

              <!-- Accept Button (for pending consultations) -->
              <el-tooltip content="接受请求" placement="top" v-if="scope.row.status === 'pending'">
                <el-button
                  type="success"
                  icon="el-icon-check"
                  size="mini"
                  circle
                  @click="updateConsultationStatus(scope.row, 'accepted')"
                ></el-button>
              </el-tooltip>

              <!-- Decline Button (for pending consultations) -->
              <el-tooltip content="拒绝请求" placement="top" v-if="scope.row.status === 'pending'">
                <el-button
                  type="danger"
                  icon="el-icon-close"
                  size="mini"
                  circle
                  @click="openDeclineDialog(scope.row)"
                ></el-button>
              </el-tooltip>

              <!-- Complete Button (for accepted/upcoming consultations) -->
              <el-tooltip content="标记为已完成" placement="top" v-if="scope.row.status === 'accepted'">
                <el-button
                  type="info"
                  icon="el-icon-check"
                  size="mini"
                  circle
                  @click="openCompleteDialog(scope.row)"
                ></el-button>
              </el-tooltip>

              <!-- Reschedule Button (for accepted/upcoming consultations) -->
              <el-tooltip content="重新安排" placement="top" v-if="scope.row.status === 'accepted'">
                <el-button
                  type="warning"
                  icon="el-icon-date"
                  size="mini"
                  circle
                  @click="openRescheduleDialog(scope.row)"
                ></el-button>
              </el-tooltip>

              <!-- Start Meeting Button (for accepted/upcoming consultations) -->
              <el-tooltip content="开始会议" placement="top" v-if="scope.row.status === 'accepted' && isWithinTimeWindow(scope.row.scheduledFor)">
                <el-button
                  type="primary"
                  icon="el-icon-video-camera"
                  size="mini"
                  circle
                  @click="startMeeting(scope.row)"
                ></el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <div class="empty-data">
            <i class="el-icon-date" style="font-size: 48px; color: #909399;"></i>
            <p>未找到辅导请求</p>
          </div>
        </template>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50]"
          :page-size="pagination.itemsPerPage"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalConsultations"
        >
        </el-pagination>
      </div>
    </el-card>

    <!-- Consultation Details Dialog -->
    <el-dialog
      title="辅导详情"
      :visible.sync="detailsDialog"
      width="600px"
      :close-on-click-modal="false"
      custom-class="custom-dialog"
    >
      <div v-if="selectedConsultation" class="details-container">
        <div class="student-header">
          <el-avatar
            :size="40"
            :src="selectedConsultation.student.avatar"
            icon="el-icon-user"
          ></el-avatar>
          <div class="student-info">
            <h3>{{ selectedConsultation.student.name }}</h3>
            <p>{{ selectedConsultation.student.email }}</p>
          </div>
        </div>

        <el-divider></el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <span class="detail-label"><i class="el-icon-date"></i> 日期:</span>
              <span class="detail-value">{{ formatDate(selectedConsultation.scheduledFor) }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <span class="detail-label"><i class="el-icon-time"></i> 时间:</span>
              <span class="detail-value">{{ formatTime(selectedConsultation.scheduledFor) }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <span class="detail-label"><i class="el-icon-timer"></i> 时长:</span>
              <span class="detail-value">{{ selectedConsultation.duration }} 分钟</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <span class="detail-label"><i class="el-icon-document"></i> 状态:</span>
              <span class="detail-value">
                <el-tag :type="getStatusType(selectedConsultation.status)">
                  {{ getStatusText(selectedConsultation.status) }}
                </el-tag>
              </span>
            </div>
          </el-col>
          <el-col :span="24">
            <div class="detail-item">
              <span class="detail-label"><i class="el-icon-collection-tag"></i> 学科:</span>
              <span class="detail-value">
                <el-tag :type="getSubjectType(selectedConsultation.subject)" effect="plain">
                  {{ selectedConsultation.subject }}
                </el-tag>
              </span>
            </div>
          </el-col>
          <el-col :span="24">
            <div class="detail-item">
              <span class="detail-label"><i class="el-icon-tickets"></i> 主题:</span>
              <span class="detail-value">{{ selectedConsultation.topic }}</span>
            </div>
          </el-col>
          <el-col :span="24">
            <div class="detail-item">
              <span class="detail-label"><i class="el-icon-document-copy"></i> 描述:</span>
              <p class="detail-text">{{ selectedConsultation.description }}</p>
            </div>
          </el-col>
          <el-col :span="24" v-if="selectedConsultation.notes">
            <div class="detail-item">
              <span class="detail-label"><i class="el-icon-notebook-2"></i> 备注:</span>
              <p class="detail-text">{{ selectedConsultation.notes }}</p>
            </div>
          </el-col>
        </el-row>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="detailsDialog = false">关闭</el-button>

        <!-- Action buttons based on status -->
        <template v-if="selectedConsultation && selectedConsultation.status === 'pending'">
          <el-button type="success" @click="updateConsultationStatus(selectedConsultation, 'accepted')">
            接受
          </el-button>
          <el-button type="danger" @click="openDeclineDialog(selectedConsultation)">
            拒绝
          </el-button>
        </template>

        <template v-if="selectedConsultation && selectedConsultation.status === 'accepted'">
          <el-button type="warning" @click="openRescheduleDialog(selectedConsultation)">
            重新安排
          </el-button>
          <el-button
            type="primary"
            @click="startMeeting(selectedConsultation)"
            :disabled="!isWithinTimeWindow(selectedConsultation.scheduledFor)"
          >
            <i class="el-icon-video-camera"></i> 开始会议
          </el-button>
        </template>
      </span>
    </el-dialog>

    <!-- Decline Consultation Dialog -->
    <el-dialog
      title="拒绝辅导请求"
      :visible.sync="declineDialog"
      width="500px"
      :close-on-click-modal="false"
      custom-class="decline-dialog"
    >
      <p>您确定要拒绝这个辅导请求吗？</p>
      <el-input
        type="textarea"
        v-model="declineReason"
        placeholder="向学生提供拒绝原因（可选）"
        :rows="3"
      ></el-input>
      <span slot="footer" class="dialog-footer">
        <el-button @click="declineDialog = false">取消</el-button>
        <el-button type="danger" @click="updateConsultationStatus(selectedConsultation, 'declined')">
          拒绝
        </el-button>
      </span>
    </el-dialog>

    <!-- Complete Consultation Dialog -->
    <el-dialog
      title="完成辅导"
      :visible.sync="completeDialog"
      width="500px"
      :close-on-click-modal="false"
      custom-class="complete-dialog"
    >
      <p>将此辅导标记为已完成并提供备注:</p>
      <el-input
        type="textarea"
        v-model="completionNotes"
        placeholder="总结讨论内容和后续行动"
        :rows="5"
      ></el-input>
      <span slot="footer" class="dialog-footer">
        <el-button @click="completeDialog = false">取消</el-button>
        <el-button type="success" @click="updateConsultationStatus(selectedConsultation, 'completed')">
          完成
        </el-button>
      </span>
    </el-dialog>

    <!-- Reschedule Dialog -->
    <el-dialog
      title="重新安排辅导"
      :visible.sync="rescheduleDialog"
      width="500px"
      :close-on-click-modal="false"
      custom-class="reschedule-dialog"
    >
      <el-form ref="rescheduleForm" :model="rescheduleForm" :rules="rescheduleRules" label-width="100px">
        <el-form-item label="新日期" prop="date">
          <el-date-picker
            v-model="rescheduleDate"
            type="date"
            placeholder="选择日期"
            :picker-options="{disabledDate(time) { return time.getTime() < Date.now() - 8.64e7; }}"
            style="width: 100%"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="新时间" prop="time">
          <el-time-picker
            v-model="rescheduleTime"
            placeholder="选择时间"
            format="HH:mm"
            style="width: 100%"
          ></el-time-picker>
        </el-form-item>
        <el-form-item label="时长" prop="duration">
          <el-select v-model="rescheduleDuration" placeholder="选择时长" style="width: 100%">
            <el-option
              v-for="duration in durationOptions"
              :key="duration"
              :label="`${duration} 分钟`"
              :value="duration"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input
            type="textarea"
            v-model="rescheduleReason"
            placeholder="解释为什么需要重新安排这次辅导"
            :rows="3"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="rescheduleDialog = false">取消</el-button>
        <el-button type="warning" @click="rescheduleConsultation" :disabled="!rescheduleFormValid">
          重新安排
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import { format } from 'date-fns'
import io from 'socket.io-client'

export default {
  name: 'Consultations',
  data() {
    return {
      // Main data
      consultations: [],
      totalConsultations: 0,
      loading: true,
      activeTab: '0', // Default to pending consultations

      // Filters
      filters: {
        search: '',
        subject: '',
      },

      // Pagination
      pagination: {
        page: 1,
        itemsPerPage: 10,
      },

      // Dialogs
      detailsDialog: false,
      declineDialog: false,
      completeDialog: false,
      rescheduleDialog: false,

      // Selected consultation
      selectedConsultation: null,

      // Form data
      declineReason: '',
      completionNotes: '',
      rescheduleDate: null,
      rescheduleTime: null,
      rescheduleDuration: null,
      rescheduleReason: '',

      // Options
      subjectOptions: ['数学', '物理', '化学', '生物', '英语', '历史', '计算机科学'],
      durationOptions: [15, 30, 45, 60, 90],

      // WebSocket
      socket: null,

      // Debounce timer
      searchDebounce: null,

      // Reschedule Form (Add this for the dialog)
      rescheduleForm: {
        date: null,
        time: null,
        duration: null,
        reason: ''
      },
      rescheduleRules: {
        date: [{ required: true, message: '请选择新日期', trigger: 'change' }],
        time: [{ required: true, message: '请选择新时间', trigger: 'change' }],
        duration: [{ required: true, message: '请选择时长', trigger: 'change' }],
        reason: [{ required: true, message: '请输入重新安排的原因', trigger: 'blur' }]
      }
    }
  },

  computed: {
    // Subject coloring
    subjectColors() {
      return {
        '数学': '',
        '物理': 'success',
        '化学': 'warning',
        '生物': 'info',
        '英语': 'primary',
        '历史': 'danger',
        '计算机科学': ''
      }
    },

    // Check if reschedule form is valid (using Element UI form validation)
    rescheduleFormValid() {
      // This computed property might not be strictly needed if using Element UI's validation,
      // but can be useful for disabling the button more explicitly.
      // A simpler check might be to rely on the form's overall validity state.
      return this.rescheduleDate && this.rescheduleTime && this.rescheduleDuration && this.rescheduleReason;
    }
  },

  created() {
    // Check for tab query parameter from route
    const tabQuery = this.$route.query.tab;
    if (tabQuery && ['0', '1', '2', '3', '4'].includes(tabQuery)) {
      this.activeTab = tabQuery;
    }

    // Fetch initial data when component is created
    this.fetchConsultations()

    // Setup WebSocket connection
    this.setupWebSocket()
  },

  beforeDestroy() {
    // Clean up WebSocket connection when component is destroyed
    if (this.socket) {
      this.socket.disconnect()
    }

    // Clear any pending timers
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce)
    }
  },

  methods: {
    /**
     * Fetch consultations based on current filters and pagination
     */
    fetchConsultations() {
      this.loading = true

      // Get status from active tab (0=pending, 1=accepted, 2=completed, 3=declined, 4=all)
      const statusMap = { '0': 'pending', '1': 'accepted', '2': 'completed', '3': 'declined', '4': '' };
      const status = statusMap[this.activeTab] || '';

      // Make API request
      axios.get('/api/teacher/consultations', { // Assuming API endpoint
        params: {
          page: this.pagination.page,
          limit: this.pagination.itemsPerPage,
          status: status,
          subject: this.filters.subject,
          search: this.filters.search,
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}` // Use teacher token
        }
      })
      .then(response => {
        this.consultations = response.data.consultations || []; // Ensure it's an array
        this.totalConsultations = response.data.total || 0;
      })
      .catch(error => {
        console.error('Error fetching consultations:', error);
        this.$message.error('获取辅导列表失败');
        this.consultations = []; // Reset on error
        this.totalConsultations = 0;
      })
      .finally(() => {
        this.loading = false
      })
    },

    /**
     * Debounce search input to prevent too many API calls
     */
    debounceSearch() {
      if (this.searchDebounce) {
        clearTimeout(this.searchDebounce)
      }

      this.searchDebounce = setTimeout(() => {
        this.pagination.page = 1; // Reset to first page on search
        this.fetchConsultations()
      }, 500) // Increased debounce time
    },

    /**
     * Handle pagination size change
     */
    handleSizeChange(size) {
      this.pagination.itemsPerPage = size
      this.pagination.page = 1; // Reset to first page
      this.fetchConsultations()
    },

    /**
     * Handle pagination page change
     */
    handleCurrentChange(page) {
      this.pagination.page = page
      this.fetchConsultations()
    },

    /**
     * Format date from ISO string
     */
    formatDate(dateString) {
      if (!dateString) return ''
      try {
        return format(new Date(dateString), 'yyyy-MM-dd') // Adjusted format
      } catch (e) {
        console.error("Error formatting date:", e);
        return dateString; // Return original if error
      }
    },

    /**
     * Format time from ISO string
     */
    formatTime(dateString) {
      if (!dateString) return ''
       try {
        return format(new Date(dateString), 'HH:mm') // Adjusted format
      } catch (e) {
        console.error("Error formatting time:", e);
        return dateString; // Return original if error
      }
    },

    /**
     * Get type for subject tag
     */
    getSubjectType(subject) {
      return this.subjectColors[subject] || 'info' // Default to info
    },

    /**
     * Get type for status tag
     */
    getStatusType(status) {
      const types = {
        'pending': 'warning',
        'accepted': 'primary',
        'completed': 'success',
        'declined': 'danger'
      }

      return types[status] || 'info'
    },

     /**
     * Get Chinese text for status
     */
    getStatusText(status) {
      const statusMap = {
        'pending': '待处理',
        'accepted': '即将进行',
        'completed': '已完成',
        'declined': '已拒绝'
      }

      return statusMap[status] || status
    },


    /**
     * Get type for duration tag
     */
    getDurationType(duration) {
      if (!duration) return 'info';
      if (duration <= 15) return 'info'
      if (duration <= 30) return '' // Element UI default type
      if (duration <= 60) return 'warning'
      return 'danger'
    },

    /**
     * Check if consultation is within time window for starting
     */
    isWithinTimeWindow(scheduledFor) {
      if (!scheduledFor) return false

      try {
        const now = new Date()
        const consultationTime = new Date(scheduledFor)

        // Allow starting meeting 15 minutes before scheduled time
        const startWindow = new Date(consultationTime)
        startWindow.setMinutes(startWindow.getMinutes() - 15)

        // Allow up to 30 minutes after scheduled time (adjust as needed)
        const endWindow = new Date(consultationTime)
        endWindow.setMinutes(endWindow.getMinutes() + consultationTime.getMinutes() + 30) // Assuming duration is not added here

        return now >= startWindow && now <= endWindow
      } catch (e) {
        console.error("Error checking time window:", e);
        return false;
      }
    },

    /**
     * View consultation details
     */
    viewConsultationDetails(consultation) {
      this.selectedConsultation = {...consultation} // Use spread to avoid modifying original object directly
      this.detailsDialog = true
    },

    /**
     * Open decline dialog
     */
    openDeclineDialog(consultation) {
      this.selectedConsultation = {...consultation}
      this.declineReason = '' // Reset reason
      this.declineDialog = true
    },

    /**
     * Open complete dialog
     */
    openCompleteDialog(consultation) {
      this.selectedConsultation = {...consultation}
      this.completionNotes = consultation.notes || '' // Pre-fill if notes exist
      this.completeDialog = true
    },

    /**
     * Open reschedule dialog
     */
    openRescheduleDialog(consultation) {
      this.selectedConsultation = {...consultation}

      // Initialize reschedule form with current values, ensure date object for pickers
       try {
        const consultationDate = new Date(consultation.scheduledFor)
        this.rescheduleDate = consultationDate
        this.rescheduleTime = consultationDate // Time picker might need a specific time object/string
        this.rescheduleDuration = consultation.duration
        this.rescheduleReason = ''
      } catch (e) {
        console.error("Error initializing reschedule form:", e);
         this.rescheduleDate = null;
         this.rescheduleTime = null;
         this.rescheduleDuration = null;
      }


      this.rescheduleDialog = true;
      // Reset validation state when opening the dialog
      this.$nextTick(() => {
        if (this.$refs.rescheduleForm) {
          this.$refs.rescheduleForm.clearValidate();
        }
      });
    },

    /**
     * Update consultation status
     */
    updateConsultationStatus(consultation, newStatus) {
      if (!consultation || !consultation._id) return;

      let payload = {
        status: newStatus
      };

      // Add notes based on status change
      if (newStatus === 'declined') {
        payload.notes = this.declineReason;
        this.declineDialog = false; // Close dialog on action
      } else if (newStatus === 'completed') {
        payload.notes = this.completionNotes;
        this.completeDialog = false; // Close dialog on action
      }

      // Close details dialog if open and action was triggered from there
       if (this.detailsDialog && this.selectedConsultation?._id === consultation._id) {
         this.detailsDialog = false;
       }


      // Send API request
      axios.patch(`/api/teacher/consultations/${consultation._id}/status`, payload, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        }
      })
      .then(() => { // Removed unused 'response'
        this.$message.success(`辅导状态已更新为: ${this.getStatusText(newStatus)}`)
        this.fetchConsultations() // Refresh list after update
      })
      .catch(error => {
        console.error(`Error updating consultation status:`, error)
        this.$message.error(`更新辅导状态失败`)
      })
    },

    /**
     * Reschedule consultation
     */
    rescheduleConsultation() {
       this.$refs.rescheduleForm.validate((valid) => {
        if (valid) {
           if (!this.selectedConsultation || !this.selectedConsultation._id) {
             this.$message.error('无法确定要重新安排哪个辅导');
             return;
           }
            if (!this.rescheduleDate || !this.rescheduleTime || !this.rescheduleDuration) {
              this.$message.warning('请选择完整的新日期、时间和时长')
              return
            }

            // Combine date and time parts correctly
            const newDate = new Date(this.rescheduleDate);
            const timeDate = new Date(this.rescheduleTime); // Assuming time picker gives a Date object

            // Set hours and minutes from time picker onto the date picker's date
            newDate.setHours(
              timeDate.getHours(),
              timeDate.getMinutes(),
              0, 0 // Reset seconds and milliseconds
            );

            if (isNaN(newDate.getTime())) {
                this.$message.error('无效的日期或时间');
                return;
            }


            // Send API request
            axios.patch(`/api/teacher/consultations/${this.selectedConsultation._id}/reschedule`, {
              scheduledFor: newDate.toISOString(),
              duration: this.rescheduleDuration,
              notes: this.rescheduleReason // Changed 'reason' to 'notes' if backend expects that
            }, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
              }
            })
            .then(() => { // Removed unused 'response'
              this.$message.success('辅导已成功重新安排')
              this.rescheduleDialog = false
              this.fetchConsultations() // Refresh list
            })
            .catch(error => {
              console.error('Error rescheduling consultation:', error)
              this.$message.error('重新安排辅导失败')
            })
        } else {
          console.log('Reschedule form validation failed');
          this.$message.warning('请检查表单输入');
          return false;
        }
      });
    },

    /**
     * Start meeting with student
     */
    startMeeting(consultation) {
      if (!consultation || !consultation._id) return

      // Placeholder: Ideally, this would call an API to get a meeting URL
      console.log(`Starting meeting for consultation ID: ${consultation._id}`);
      // Example: window.open(`your-meeting-platform.com/meet/${consultation._id}`, '_blank');
      this.$message.info(`开始会议功能待实现 (ID: ${consultation._id})`);

      // You might want to call an API endpoint to log the start time or update status
      // axios.post(`/api/teacher/consultations/${consultation._id}/start-meeting`, {}, { ... })
    },

    /**
     * Setup WebSocket connection for real-time updates
     */
    setupWebSocket() {
      const token = localStorage.getItem('teacherToken')
      if (!token) {
          console.warn("No teacher token found, WebSocket connection skipped.");
          return;
      }

      // Connect to WebSocket server (adjust URL if needed)
      // Ensure VUE_APP_SOCKET_URL is defined in your .env files
      const socketUrl = process.env.VUE_APP_SOCKET_URL || 'http://localhost:3000';
      this.socket = io(socketUrl, {
        query: { token }
      });

      this.socket.on('connect', () => {
          console.log("WebSocket connected successfully.");
          // Optional: Authenticate or join teacher-specific room if needed
          // this.socket.emit('authenticate_teacher', { teacherId: localStorage.getItem('teacherId') });
      });

      // Listen for consultation updates relevant to the teacher
      this.socket.on('consultation_update', (data) => {
        console.log("WebSocket received consultation_update:", data);
        // Simple approach: Refresh the list if any update occurs
        // More specific: Check if the update involves this teacher or a relevant consultation
        this.fetchConsultations();
        // Optional: Show a notification
        this.$message.info('辅导列表已更新');
      });

      // Listen for new consultation requests specifically for this teacher
      this.socket.on('new_consultation_request', (data) => {
         console.log("WebSocket received new_consultation_request:", data);
         // Optional: Check if the request is for the currently logged-in teacher if not handled server-side
         this.$notify({
            title: '新辅导请求',
            message: `收到来自 ${data.studentName || '学生'} 的新辅导请求`,
            type: 'info',
            duration: 5000
         });
         // Refresh if viewing pending or all tabs
         if (this.activeTab === '0' || this.activeTab === '4') {
            this.fetchConsultations();
         } else {
             // Maybe just update the count visually without full refresh
             this.pendingRequestCount++; // Need to fetch this count properly
         }
      });

      // Handle connection errors
      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
         this.$message.error('WebSocket 连接失败');
      });

      this.socket.on('disconnect', (reason) => {
          console.log(`WebSocket disconnected: ${reason}`);
           if (reason === 'io server disconnect') {
            // Potentially trigger re-authentication or manual reconnection
            this.socket.connect();
          }
          // else, the client initiated the disconnect
      });

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    }
  }
}
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
  color: #409EFF; /* Element UI primary color */
}

.filter-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.action-buttons .el-button {
  margin: 0 3px; /* Spacing between action buttons */
}

.time-text {
  font-size: 0.9em;
  color: #909399;
}

.duration-tag {
  margin-top: 4px;
  display: inline-block;
}

.student-info {
  display: flex;
  align-items: center;
}

.student-details {
  margin-left: 10px;
}

.email-text {
  font-size: 0.9em;
  color: #909399;
}

.description-text {
  font-size: 0.9em;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px; /* Adjust as needed */
}

.empty-data {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}
.empty-data i {
  font-size: 50px;
  margin-bottom: 15px;
  display: block;
}

/* Dialog Styles */
.custom-dialog .el-dialog__body {
  padding: 20px 25px;
}

.details-container .student-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}
.details-container .student-header .el-avatar {
  margin-right: 15px;
}
.details-container .student-header h3 {
  margin: 0;
  font-size: 1.2em;
}
.details-container .student-header p {
  margin: 0;
  color: #606266;
  font-size: 0.9em;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
  align-items: baseline;
}
.detail-label {
  width: 100px; /* Fixed width for labels */
  font-weight: bold;
  color: #606266;
  margin-right: 10px;
}
.detail-label i {
  margin-right: 5px;
}
.detail-value {
  flex: 1;
}
.detail-text {
  white-space: pre-wrap; /* Allow description/notes to wrap */
  line-height: 1.5;
  margin-top: 5px;
  font-size: 0.95em;
}

.dialog-footer {
  text-align: right;
  margin-top: 10px; /* Reduce space before footer */
}

.el-dialog__footer {
    padding: 10px 25px 20px;
}

/* Ensure Tabs have some spacing */
.el-tabs {
  margin-bottom: 15px;
}
</style>
