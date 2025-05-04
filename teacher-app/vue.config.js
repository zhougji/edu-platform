module.exports = {
    lintOnSave: false,  // 关闭保存时的lint检查

    // 添加开发服务器配置，解决跨域问题
    devServer: {
        proxy: {
            '/api': {
                target: 'http://localhost:8085',
                changeOrigin: true,
                pathRewrite: {
                    '^/api': '/api'
                }
            }
        }
    }
} 