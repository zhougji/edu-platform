// Token key name in local storage
const TOKEN_KEY = 'auth_token';
const USER_INFO_KEY = 'user_info';

/**
 * Set the authentication token in local storage
 * @param {string} token - The JWT token
 */
export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Get the authentication token from local storage
 * @returns {string|null} The JWT token or null if not found
 */
export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Remove the authentication token from local storage
 */
export function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
}

/**
 * Check if the user is authenticated (has a token)
 * @returns {boolean} True if authenticated, false otherwise
 */
export function isAuthenticated() {
    return !!getToken();
}

/**
 * Set user information in local storage
 * @param {Object} userInfo - User information object
 */
export function setUserInfo(userInfo) {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
}

/**
 * Get user information from local storage
 * @returns {Object|null} User information or null if not found
 */
export function getUserInfo() {
    const userInfo = localStorage.getItem(USER_INFO_KEY);
    return userInfo ? JSON.parse(userInfo) : null;
}

/**
 * Get user ID from stored user information
 * @returns {string|null} User ID or null if not found
 */
export function getUserId() {
    const userInfo = getUserInfo();
    return userInfo ? userInfo._id : null;
}

/**
 * Get user role from stored user information
 * @returns {string|null} User role or null if not found
 */
export function getUserRole() {
    const userInfo = getUserInfo();
    return userInfo ? userInfo.role : null;
}

/**
 * Check if the current user has a specific role
 * @param {string} role - The role to check
 * @returns {boolean} True if the user has the role, false otherwise
 */
export function hasRole(role) {
    const userRole = getUserRole();
    return userRole === role;
} 