/**
 * 启明隅教育平台前端配置文件
 * 根据不同环境自动选择合适的API地址
 */

// 不同环境的基础URL
const CONFIG = {
    development: {
        baseURL: 'http://localhost:8085',
        wsURL: 'ws://localhost:8085/ws'
    },
    production: {
        baseURL: 'https://qimingyu.xyz',
        wsURL: 'wss://qimingyu.xyz/ws'
    }
};

// 根据当前URL自动判断环境
const isProduction = () => {
    return window.location.hostname === 'qimingyu.xyz' ||
        window.location.hostname === 'www.qimingyu.xyz';
};

// 导出当前环境的配置
const currentConfig = isProduction() ? CONFIG.production : CONFIG.development;

// 全局API配置
window.API_CONFIG = {
    baseURL: currentConfig.baseURL,
    wsURL: currentConfig.wsURL,
    timeout: 30000
};

console.log(`当前运行环境: ${isProduction() ? '生产环境' : '开发环境'}`);
console.log(`API基础URL: ${window.API_CONFIG.baseURL}`); 