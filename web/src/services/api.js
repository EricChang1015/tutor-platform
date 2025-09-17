// API 基礎配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 錯誤類型
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// 獲取存儲的 token
function getToken() {
  return localStorage.getItem('auth_token');
}

// 設置 token
export function setToken(token) {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

// 基礎請求函數
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // 添加認證 header
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    
    // 處理 401 未授權
    if (response.status === 401) {
      setToken(null);
      window.location.href = '/login';
      throw new ApiError('未授權訪問', 401);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || '請求失敗',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // 網絡錯誤
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new ApiError('網絡連接失敗，請檢查網絡設置', 0);
    }
    
    throw new ApiError('未知錯誤', 0, error);
  }
}

// HTTP 方法封裝
export const api = {
  get: (endpoint, options = {}) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, data, options = {}) => request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  }),
  put: (endpoint, data, options = {}) => request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  }),
  patch: (endpoint, data, options = {}) => request(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options,
  }),
  delete: (endpoint, options = {}) => request(endpoint, { method: 'DELETE', ...options }),
};

// 認證相關 API
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
    setToken(null);
    return Promise.resolve();
  },
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
};

// 用戶管理 API
export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  getRecommendedTeachers: (limit = 4) => api.get(`/users/teachers/recommended?limit=${limit}`),
};

// 課程管理 API
export const coursesApi = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (courseData) => api.post('/courses', courseData),
  update: (id, courseData) => api.put(`/courses/${id}`, courseData),
  delete: (id) => api.delete(`/courses/${id}`),
  getRecommended: (limit = 6) => api.get(`/courses/recommended?limit=${limit}`),
};

// 定價管理 API
export const pricingApi = {
  getAll: () => api.get('/pricing'),
  getById: (id) => api.get(`/pricing/${id}`),
  create: (pricingData) => api.post('/pricing', pricingData),
  update: (id, pricingData) => api.put(`/pricing/${id}`, pricingData),
  delete: (id) => api.delete(`/pricing/${id}`),
};

// 課程包管理 API
export const packagesApi = {
  getAll: () => api.get('/packages'),
  getById: (id) => api.get(`/packages/${id}`),
  getMy: () => api.get('/packages/my-packages'),
  create: (packageData) => api.post('/packages', packageData),
  update: (id, packageData) => api.put(`/packages/${id}`, packageData),
  delete: (id) => api.delete(`/packages/${id}`),
  purchase: (id) => api.post(`/packages/${id}/purchase`),
};

// 可用時段 API
export const availabilityApi = {
  getMy: () => api.get('/availability/my-slots'),
  getByTeacher: (teacherId) => api.get(`/availability/teacher/${teacherId}`),
  create: (slotData) => api.post('/availability', slotData),
  update: (id, slotData) => api.put(`/availability/${id}`, slotData),
  delete: (id) => api.delete(`/availability/${id}`),
};

// 預約管理 API
export const bookingApi = {
  getMyBookings: () => api.get('/booking/my-bookings'),
  getMySessions: () => api.get('/booking/my-sessions'),
  create: (bookingData) => api.post('/booking', bookingData),
  update: (id, bookingData) => api.put(`/booking/${id}`, bookingData),
  cancel: (id) => api.delete(`/booking/${id}`),
};

// 課程會議 API
export const sessionsApi = {
  getById: (id) => api.get(`/sessions/${id}`),
  updateMeeting: (id, meetingData) => api.put(`/sessions/${id}/meeting`, meetingData),
  submitTeacherReport: (id, reportData) => api.post(`/sessions/${id}/teacher-report`, reportData),
  submitStudentGoal: (id, goalData) => api.post(`/sessions/${id}/student-goal`, goalData),
  uploadProof: (id, proofData) => api.post(`/sessions/${id}/proof`, proofData),
};

// 檔案存儲 API
export const storageApi = {
  getUploadUrl: (fileData) => api.post('/storage/upload-url', fileData),
  getMyFiles: () => api.get('/storage/my-files'),
  deleteFile: (id) => api.delete(`/storage/${id}`),
};

// 通知管理 API
export const notificationsApi = {
  sendBookingConfirmation: (sessionId) => api.post(`/notifications/booking-confirmation/${sessionId}`),
  sendSessionReminder: (sessionId, type) => api.post(`/notifications/session-reminder/${sessionId}/${type}`),
};

// 結算管理 API
export const payoutsApi = {
  getAll: () => api.get('/payouts'),
  getMy: () => api.get('/payouts/my-payouts'),
  getById: (id) => api.get(`/payouts/${id}`),
  generate: (payoutData) => api.post('/payouts', payoutData),
  update: (id, payoutData) => api.put(`/payouts/${id}`, payoutData),
  generateMonthly: (year, month) => api.post(`/payouts/generate-monthly?year=${year}&month=${month}`),
};

// 健康檢查 API
export const healthApi = {
  check: () => api.get('/health'),
};

// 導出所有 API
export default {
  auth: authApi,
  users: usersApi,
  courses: coursesApi,
  pricing: pricingApi,
  packages: packagesApi,
  availability: availabilityApi,
  booking: bookingApi,
  sessions: sessionsApi,
  storage: storageApi,
  notifications: notificationsApi,
  payouts: payoutsApi,
  health: healthApi,
};
