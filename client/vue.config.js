module.exports = {
    devServer: {
        allowedHosts: 'all',
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                ws: true
            }
        }
    },
    // 保持与原React项目相同的输出目录
    outputDir: 'build',
    // 确保CSS正确处理
    css: {
        loaderOptions: {
            sass: {
                additionalData: `@import "@/styles/variables.scss";`
            }
        }
    }
} 