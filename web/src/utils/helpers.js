// 日期格式化
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'YYYY-MM-DD HH:mm':
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'HH:mm':
      return `${hours}:${minutes}`;
    default:
      return d.toLocaleDateString();
  }
}

// 相對時間
export function formatRelativeTime(date) {
  if (!date) return '';
  
  const now = new Date();
  const target = new Date(date);
  const diffMs = now - target;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return '剛剛';
  if (diffMins < 60) return `${diffMins} 分鐘前`;
  if (diffHours < 24) return `${diffHours} 小時前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  
  return formatDate(date);
}

// 金額格式化
export function formatCurrency(amount, currency = 'TWD') {
  if (amount === null || amount === undefined) return '';
  
  const formatter = new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(amount);
}

// 數字格式化
export function formatNumber(number, decimals = 0) {
  if (number === null || number === undefined) return '';
  
  return new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
}

// 文件大小格式化
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 截斷文字
export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// 生成隨機 ID
export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 深拷貝
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

// 防抖函數
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 節流函數
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 驗證 Email
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 驗證手機號碼
export function isValidPhone(phone) {
  const phoneRegex = /^09\d{8}$/;
  return phoneRegex.test(phone);
}

// 驗證密碼強度
export function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('密碼長度至少 8 個字符');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密碼必須包含至少一個大寫字母');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密碼必須包含至少一個小寫字母');
  }
  
  if (!/\d/.test(password)) {
    errors.push('密碼必須包含至少一個數字');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// 狀態顏色映射
export function getStatusColor(status) {
  const colorMap = {
    // 通用狀態
    'active': 'green',
    'inactive': 'gray',
    'pending': 'yellow',
    'approved': 'green',
    'rejected': 'red',
    'cancelled': 'red',
    'completed': 'green',
    'draft': 'gray',
    
    // 預約狀態
    'confirmed': 'green',
    'scheduled': 'blue',
    'in_progress': 'blue',
    'finished': 'green',
    
    // 支付狀態
    'paid': 'green',
    'unpaid': 'red',
    'processing': 'yellow',
    'failed': 'red',
    
    // 用戶角色
    'admin': 'purple',
    'teacher': 'blue',
    'student': 'green',
  };
  
  return colorMap[status] || 'gray';
}

// 狀態顯示名稱
export function getStatusLabel(status) {
  const labelMap = {
    // 通用狀態
    'active': '啟用',
    'inactive': '停用',
    'pending': '待處理',
    'approved': '已批准',
    'rejected': '已拒絕',
    'cancelled': '已取消',
    'completed': '已完成',
    'draft': '草稿',
    
    // 預約狀態
    'confirmed': '已確認',
    'scheduled': '已排程',
    'in_progress': '進行中',
    'finished': '已結束',
    
    // 支付狀態
    'paid': '已付款',
    'unpaid': '未付款',
    'processing': '處理中',
    'failed': '失敗',
    
    // 用戶角色
    'admin': '管理員',
    'teacher': '老師',
    'student': '學生',
  };
  
  return labelMap[status] || status;
}

// 排序函數
export function sortBy(array, key, direction = 'asc') {
  return [...array].sort((a, b) => {
    let aVal = key.split('.').reduce((obj, k) => obj?.[k], a);
    let bVal = key.split('.').reduce((obj, k) => obj?.[k], b);
    
    // 處理日期
    if (aVal instanceof Date) aVal = aVal.getTime();
    if (bVal instanceof Date) bVal = bVal.getTime();
    
    // 處理字符串
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// 過濾函數
export function filterBy(array, filters) {
  return array.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === '' || value === null || value === undefined) return true;
      
      const itemValue = key.split('.').reduce((obj, k) => obj?.[k], item);
      
      if (typeof value === 'string') {
        return String(itemValue).toLowerCase().includes(value.toLowerCase());
      }
      
      return itemValue === value;
    });
  });
}

// 分頁函數
export function paginate(array, page = 1, pageSize = 10) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    data: array.slice(startIndex, endIndex),
    total: array.length,
    page,
    pageSize,
    totalPages: Math.ceil(array.length / pageSize),
    hasNext: endIndex < array.length,
    hasPrev: page > 1
  };
}
