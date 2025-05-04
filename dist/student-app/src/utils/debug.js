/**
 * 调试工具 - 帮助识别和解决API连接问题
 */

import axios from 'axios';

// 测试不同端口的连接性
export const testApiConnectivity = async (ports = [8085, 8086]) => {
    console.log('🔍 开始API连接测试...');
    const results = [];

    for (const port of ports) {
        try {
            console.log(`测试端口 ${port}...`);
            const testUrl = `http://localhost:${port}/api/ai/test`;

            const response = await axios.get(testUrl, {
                timeout: 3000
            });

            results.push({
                port,
                success: true,
                status: response.status,
                data: response.data
            });

            console.log(`✅ 端口 ${port} 测试成功`, response.data);
        } catch (error) {
            results.push({
                port,
                success: false,
                error: error.message,
                details: error.response ? {
                    status: error.response.status,
                    data: error.response.data
                } : 'No response'
            });

            console.log(`❌ 端口 ${port} 测试失败:`, error.message);
        }
    }

    console.log('📊 API测试结果摘要:', results);
    return results;
};

// 显示连接调试信息
export const showDebugInfo = (apiConfig) => {
    const debugInfo = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        api: apiConfig,
        browser: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform
        }
    };

    console.log('🛠️ 调试信息:', debugInfo);
    return debugInfo;
};

// 添加到Vue组件中使用的调试方法
export const setupDebugHelpers = (vueComponent) => {
    // 添加到window对象以便在控制台访问
    window.$debug = {
        testApiConnectivity,
        showDebugInfo,
        api: vueComponent.$data.backend,
        reload: () => {
            vueComponent.testConnection();
            return '正在重新测试连接...';
        }
    };

    console.log('🔧 调试助手已启用，在控制台尝试 $debug 对象');
}; 