/**
 * 将日期格式化为相对时间字符串（如：刚刚、5分钟前、2小时前等）
 * @param {Date|string|number} date - 要格式化的日期
 * @returns {string} - 格式化后的相对时间字符串
 */
export function formatTimeAgo(date) {
    if (!date) return '';

    const now = new Date();
    const timeDate = new Date(date);
    const diff = now.getTime() - timeDate.getTime();

    // 将毫秒转换为秒
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) {
        return '刚刚';
    }

    // 将秒转换为分钟
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}分钟前`;
    }

    // 将分钟转换为小时
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours}小时前`;
    }

    // 将小时转换为天
    const days = Math.floor(hours / 24);
    if (days < 7) {
        return `${days}天前`;
    }

    // 将天转换为周
    const weeks = Math.floor(days / 7);
    if (weeks < 4) {
        return `${weeks}周前`;
    }

    // 将周转换为月
    const months = Math.floor(days / 30);
    if (months < 12) {
        return `${months}个月前`;
    }

    // 将月转换为年
    const years = Math.floor(days / 365);
    return `${years}年前`;
}

/**
 * 将日期格式化为指定格式的字符串
 * @param {Date|string|number} date - 要格式化的日期
 * @param {string} format - 格式化字符串 (YYYY-MM-DD HH:mm:ss)
 * @returns {string} - 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return '';

    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * 获取日期的简短表示（例如：今天、昨天、前天、或日期）
 * @param {Date|string|number} date - 要格式化的日期
 * @returns {string} - 简短日期表示
 */
export function getRelativeDay(date) {
    if (!date) return '';

    const now = new Date();
    const timeDate = new Date(date);

    // 清除时间部分，只保留日期
    now.setHours(0, 0, 0, 0);
    timeDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((now - timeDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return '今天';
    } else if (diffDays === 1) {
        return '昨天';
    } else if (diffDays === 2) {
        return '前天';
    } else if (diffDays > 2 && diffDays <= 7) {
        return `${diffDays}天前`;
    } else {
        return formatDate(date, 'MM-DD');
    }
} 