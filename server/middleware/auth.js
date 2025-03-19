const jwt = require('jsonwebtoken');

/**
 * Middleware to validate JWT token and add user data to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        return res.status(401).json({ message: '无访问令牌，认证失败' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Add user from payload
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        res.status(401).json({ message: '令牌无效' });
    }
}; 