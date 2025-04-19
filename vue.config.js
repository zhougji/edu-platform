module.exports = {
    publicPath: '/',
    devServer: {
        historyApiFallback: true,
        proxy: {
            '/api': {
                target: 'http://localhost:5000', // 修改为实际的后端服务器地址和端口
                changeOrigin: true,
                pathRewrite: {
                    '^/api': '/api' // 不移除/api前缀，因为后端API路径也包含/api
                }
            }
        }
    }
} 