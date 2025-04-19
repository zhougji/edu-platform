import axios from 'axios';

/**
 * Sends a message to the backend AI chat endpoint.
 *
 * @param {string} message The user's message.
 * @param {Array<object>} history The current chat history (optional). 
 *                                 Example: [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello!' }]
 * @returns {Promise<string>} A promise that resolves with the AI's response text.
 */
export const sendMessageToAI = async (message, history = []) => {
    try {
        // Retrieve the token from local storage
        const token = localStorage.getItem('studentToken');
        if (!token) {
            // Handle cases where the token is missing, e.g., redirect to login or show error
            throw new Error('用户未登录，无法访问 AI 助手。');
        }

        // The backend endpoint URL (make sure this matches your backend route)
        // Note: axios might already have baseURL configured in main.js
        const apiUrl = '/student/ai/chat';

        const payload = {
            message: message,
            history: history,
        };

        const response = await axios.post(apiUrl, payload, {
            headers: {
                'Authorization': `Bearer ${token}`
                // Content-Type is typically application/json, axios handles this
            }
        });

        // Assuming the backend returns the AI's response directly in response.data.reply
        if (response.data && response.data.reply) {
            return response.data.reply;
        } else {
            // Handle cases where the backend response format is unexpected
            console.error('Unexpected response format from backend:', response.data);
            throw new Error('从 AI 助手收到意外的回应格式。');
        }
    } catch (error) {
        console.error('Error sending message to AI:', error.response || error.message || error);
        // Provide a user-friendly error message
        const errorMessage = error.response?.data?.message || error.message || '与 AI 助手通信失败。';
        throw new Error(errorMessage); // Re-throw the error to be caught by the component
    }
};

// You can add other AI-related API calls here in the future 