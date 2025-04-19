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
import { sendMessageToAI } from '../utils/aiService'; // 导入 API 服务
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
    };
  },
  methods: {
    async sendMessage() {
      const messageText = this.newMessage.trim();
      if (!messageText || this.isLoading) {
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
        const historyToSend = this.chatHistory.slice(-10); // Example: send last 10 messages

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
  border: none;
  border-radius: 8px;
  overflow: hidden; /* Ensures children respect border radius */
}

.chat-history {
  height: 500px; /* Adjust height as needed */
  overflow-y: auto;
  padding: 15px;
  border-bottom: 1px solid #ebeef5;
  background-color: #f9f9f9;
}

.chat-message {
  display: flex;
  margin-bottom: 15px;
}

.chat-message .avatar {
  margin-right: 10px;
  flex-shrink: 0; /* Prevent avatar from shrinking */
}

.chat-message .message-content {
  display: flex;
  flex-direction: column;
  max-width: 80%; /* Prevent messages from taking full width */
}

.message-bubble {
  padding: 10px 15px;
  border-radius: 15px;
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  word-wrap: break-word;
  white-space: pre-wrap; /* Respect newlines and spaces */
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.chat-message.user {
  justify-content: flex-end; /* Align user messages to the right */
}

.chat-message.user .avatar {
  order: 2; /* Move avatar to the right */
  margin-right: 0;
  margin-left: 10px;
}

.chat-message.user .message-content {
  align-items: flex-end;
}

.chat-message.user .message-bubble {
  background-color: #409EFF; /* Element UI primary color */
  color: white;
  border: none;
}

.chat-message.assistant .message-bubble {
  background-color: #f0f2f5;
  border: none;
}

.chat-message p {
  margin: 0;
  line-height: 1.6;
}

/* Ensure code blocks within messages are styled appropriately */
.message-bubble ::v-deep pre {
  background-color: #2d2d2d;
  color: #ccc;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
}
.message-bubble ::v-deep code {
   font-family: 'Courier New', Courier, monospace;
}
.message-bubble ::v-deep p > code {
  background-color: #e9eaec;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}

.loading-indicator .message-bubble {
  color: #606266;
  font-style: italic;
}

.chat-input-area {
  display: flex;
  padding: 15px;
  align-items: flex-end; /* Align items to bottom */
  border-top: 1px solid #ebeef5;
}

.chat-input-area .el-textarea {
  margin-right: 10px;
}

.send-button {
  height: 54px; /* Match textarea height for 2 rows */
  margin-left: 10px;
}

/* Custom scrollbar */
.chat-history::-webkit-scrollbar {
  width: 6px;
}
.chat-history::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}
.chat-history::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}
.chat-history::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 