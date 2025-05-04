<template>
  <div class="ai-assistant-container">
    <h1>AI 学习助手</h1>
    <p class="subtitle">与 AI 互动，获取学习帮助和解答疑问。</p>

    <el-card class="chat-card" shadow="never">
      <div class="chat-history" ref="chatHistory">
        <div v-for="(item, index) in chatHistory" :key="index" :class="['chat-message', item.role]">
          <el-avatar :size="30" :icon="item.role === 'user' ? 'el-icon-user-solid' : 'el-icon-cpu'" class="avatar"></el-avatar>
          <div class="message-content">
            <div class="message-bubble">
              <p v-html="formatMessage(item.content)"></p>
            </div>
          </div>
        </div>
        <div v-if="isLoading" class="chat-message assistant loading-indicator">
           <el-avatar :size="30" icon="el-icon-cpu" class="avatar"></el-avatar>
           <div class="message-content">
             <div class="message-bubble">
                <i class="el-icon-loading"></i> 正在思考...
             </div>
           </div>
        </div>
      </div>

      <div class="chat-input-area">
        <el-input
          type="textarea"
          v-model="newMessage"
          placeholder="输入您的问题或想讨论的话题..."
          :rows="2"
          resize="none"
          @keydown.enter.native.prevent="handleEnterKey"
        ></el-input>
        <el-button 
          type="primary" 
          icon="el-icon-s-promotion" 
          @click="sendMessage"
          :loading="isLoading"
          :disabled="!newMessage.trim()"
          class="send-button"
        >
          发送
        </el-button>
      </div>
    </el-card>

  </div>
</template>

<script>
import { sendMessageToAI, testAIServiceConnection } from '../utils/aiService'; // 导入 API 服务
import { setupDebugHelpers, testApiConnectivity } from '../utils/debug'; // 导入调试工具
import DOMPurify from 'dompurify'; // 用于清理HTML，防止XSS
import { marked } from 'marked'; // 用于将Markdown转换为HTML

export default {
  name: 'AIAssistant',
  data() {
    return {
      chatHistory: [ // 示例初始消息
        { role: 'assistant', content: '你好！我是启明隅 AI 学习助手，有什么可以帮助你的吗？' }
      ],
      newMessage: '',
      isLoading: false, // 控制加载状态
      connectionStatus: 'unknown', // 连接状态：unknown, connected, error
      backend: {
        port: 8085,
        url: ''
      },
      debugMode: true // 启用调试模式
    };
  },
  created() {
    // 组件创建时测试连接
    this.testConnection();
    
    // 在调试模式下，设置调试助手
    if (this.debugMode) {
      setupDebugHelpers(this);
    }
  },
  methods: {
    async testConnection() {
      try {
        this.connectionStatus = 'unknown'; // 重置状态为检查中
        
        // 在调试模式下，测试多个端口
        if (this.debugMode) {
          const connectivityResults = await testApiConnectivity([8085, 8086]);
          // 如果找到任何工作端口，更新配置
          const workingPort = connectivityResults.find(r => r.success);
          if (workingPort) {
            this.backend.port = workingPort.port;
            this.backend.url = `http://localhost:${workingPort.port}`;
            console.log(`已自动切换到工作端口: ${workingPort.port}`);
          }
        }
        
        const isConnected = await testAIServiceConnection();
        this.connectionStatus = isConnected ? 'connected' : 'error';
        if (!isConnected) {
          this.chatHistory.push({
            role: 'assistant',
            content: `⚠️ 警告：无法连接到AI服务。请检查后端服务是否正在运行，或联系管理员。\n服务地址: ${this.backend.url}`
          });
        }
      } catch (error) {
        this.connectionStatus = 'error';
        console.error('连接测试出错:', error);
      }
    },
    async sendMessage() {
      const messageText = this.newMessage.trim();
      if (!messageText || this.isLoading) {
        return;
      }

      // 如果是特殊命令
      if (messageText === '/test') {
        this.testConnection();
        this.newMessage = '';
        return;
      }

      // 1. Add user message to history
      this.chatHistory.push({ role: 'user', content: messageText });
      const currentMessage = messageText; // Store before clearing
      this.newMessage = ''; // Clear input immediately
      this.isLoading = true;
      this.scrollToBottom();

      try {
        // Prepare history for the API call (optional, depends on backend needs)
        // You might want to limit the history length sent to the backend
        const historyToSend = this.chatHistory.slice(-10).map(item => ({
          role: item.role,
          content: item.content
        }));

        // 2. Call the AI service
        const aiReply = await sendMessageToAI(currentMessage, historyToSend);

        // 3. Add AI response to history
        this.chatHistory.push({ role: 'assistant', content: aiReply });

      } catch (error) {
        console.error('Error communicating with AI assistant:', error);
        // Add error message to chat history
        this.chatHistory.push({ role: 'assistant', content: `抱歉，与 AI 助手连接时出错: ${error.message}` });
        this.$message.error(`与 AI 助手连接时出错: ${error.message}`);
      } finally {
        this.isLoading = false;
        this.scrollToBottom();
      }
    },

    // Handle Enter key press in textarea
    handleEnterKey(event) {
      if (event.shiftKey) {
        // Allow Shift+Enter for new lines
        return;
      }
      this.sendMessage();
    },

    // Scroll chat history to the bottom
    scrollToBottom() {
      this.$nextTick(() => {
        const chatHistoryDiv = this.$refs.chatHistory;
        if (chatHistoryDiv) {
          chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
        }
      });
    },

    // Format message content (e.g., render Markdown)
    formatMessage(content) {
       // Convert Markdown to HTML
      const rawHtml = marked(content || '', { breaks: true, gfm: true }); 
       // Sanitize HTML to prevent XSS attacks
      const cleanHtml = DOMPurify.sanitize(rawHtml);
      return cleanHtml;
    }
  },
  mounted() {
    this.scrollToBottom(); // Scroll down on initial load
  },
  updated() {
     this.scrollToBottom(); // Scroll down whenever the chat updates
  }
};
</script>

<style scoped>
.ai-assistant-container {
  padding: 25px;
  max-width: 900px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  color: #303133;
  margin-bottom: 10px;
}

.subtitle {
  text-align: center;
  color: #606266;
  margin-bottom: 25px;
}

.chat-card {
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.chat-history {
  height: 400px;
  overflow-y: auto;
  padding: 20px;
  background-color: #f9f9f9;
}

.chat-message {
  display: flex;
  margin-bottom: 15px;
}

.chat-message.user {
  flex-direction: row-reverse;
}

.avatar {
  flex-shrink: 0;
  margin: 0 12px;
}

.message-content {
  flex: 1;
  max-width: 80%;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
  display: inline-block;
  max-width: 100%;
  word-wrap: break-word;
}

.user .message-bubble {
  background-color: #ecf5ff;
  color: #303133;
  border-bottom-right-radius: 4px;
  float: right;
}

.assistant .message-bubble {
  background-color: white;
  color: #303133;
  border: 1px solid #ebeef5;
  border-bottom-left-radius: 4px;
}

.message-bubble p {
  margin: 0;
  line-height: 1.5;
}

.message-bubble p + p {
  margin-top: 10px;
}

.chat-input-area {
  padding: 15px;
  border-top: 1px solid #ebeef5;
  display: flex;
  align-items: flex-end;
}

.send-button {
  margin-left: 10px;
  height: 42px;
  width: 80px;
}

.loading-indicator .message-bubble {
  background-color: #f5f7fa;
  color: #909399;
}

/* 代码块样式 */
:deep(pre) {
  background-color: #f8f8f8;
  border-radius: 4px;
  padding: 12px;
  overflow-x: auto;
  margin: 10px 0;
}

:deep(code) {
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
}

:deep(p code) {
  background-color: #f0f0f0;
  padding: 2px 4px;
  border-radius: 3px;
}

:deep(ul, ol) {
  padding-left: 20px;
}

:deep(li) {
  margin-bottom: 5px;
}

:deep(a) {
  color: #409eff;
  text-decoration: none;
}

:deep(a:hover) {
  text-decoration: underline;
}

:deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 10px 0;
}

:deep(th, td) {
  border: 1px solid #dcdfe6;
  padding: 8px;
  text-align: left;
}
</style> 