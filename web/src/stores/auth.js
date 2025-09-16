import { writable, derived } from 'svelte/store';
import { authApi, setToken } from '../services/api.js';

// 用戶狀態
export const user = writable(null);
export const isLoading = writable(false);
export const error = writable(null);

// 計算屬性
export const isAuthenticated = derived(user, $user => !!$user);
export const userRole = derived(user, $user => $user?.role || null);
export const isAdmin = derived(userRole, $role => $role === 'admin');
export const isTeacher = derived(userRole, $role => $role === 'teacher');
export const isStudent = derived(userRole, $role => $role === 'student');

// 權限檢查函數
export function hasPermission(requiredRoles) {
  let currentRole;
  userRole.subscribe(role => currentRole = role)();
  
  if (!currentRole) return false;
  if (!Array.isArray(requiredRoles)) requiredRoles = [requiredRoles];
  
  return requiredRoles.includes(currentRole);
}

// 認證操作
export const auth = {
  // 登入
  async login(credentials) {
    isLoading.set(true);
    error.set(null);
    
    try {
      const response = await authApi.login(credentials);
      
      if (response.access_token) {
        setToken(response.access_token);
        user.set(response.user);
        return response.user;
      } else {
        throw new Error('登入失敗：未收到有效的認證令牌');
      }
    } catch (err) {
      error.set(err.message || '登入失敗');
      throw err;
    } finally {
      isLoading.set(false);
    }
  },

  // 註冊
  async register(userData) {
    isLoading.set(true);
    error.set(null);
    
    try {
      const response = await authApi.register(userData);
      
      if (response.access_token) {
        setToken(response.access_token);
        user.set(response.user);
        return response.user;
      } else {
        throw new Error('註冊失敗：未收到有效的認證令牌');
      }
    } catch (err) {
      error.set(err.message || '註冊失敗');
      throw err;
    } finally {
      isLoading.set(false);
    }
  },

  // 登出
  async logout() {
    isLoading.set(true);
    
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('登出時發生錯誤:', err);
    } finally {
      user.set(null);
      error.set(null);
      isLoading.set(false);
    }
  },

  // 獲取用戶資料
  async fetchProfile() {
    isLoading.set(true);
    error.set(null);
    
    try {
      const profile = await authApi.getProfile();
      user.set(profile);
      return profile;
    } catch (err) {
      error.set(err.message || '獲取用戶資料失敗');
      // 如果是 401 錯誤，清除用戶狀態
      if (err.status === 401) {
        user.set(null);
        setToken(null);
      }
      throw err;
    } finally {
      isLoading.set(false);
    }
  },

  // 更新用戶資料
  async updateProfile(profileData) {
    isLoading.set(true);
    error.set(null);
    
    try {
      const updatedProfile = await authApi.updateProfile(profileData);
      user.set(updatedProfile);
      return updatedProfile;
    } catch (err) {
      error.set(err.message || '更新用戶資料失敗');
      throw err;
    } finally {
      isLoading.set(false);
    }
  },

  // 初始化認證狀態
  async init() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return;
    }

    try {
      await this.fetchProfile();
    } catch (err) {
      console.warn('初始化認證狀態失敗:', err);
      // 清除無效的 token
      setToken(null);
    }
  },

  // 清除錯誤
  clearError() {
    error.set(null);
  }
};

// 路由守衛
export function requireAuth(requiredRoles = null) {
  return new Promise((resolve, reject) => {
    const unsubscribe = user.subscribe(currentUser => {
      if (currentUser === null) {
        // 未登入
        reject(new Error('需要登入'));
        return;
      }

      if (requiredRoles) {
        const userHasPermission = hasPermission(requiredRoles);
        if (!userHasPermission) {
          reject(new Error('權限不足'));
          return;
        }
      }

      resolve(currentUser);
      unsubscribe();
    });
  });
}

// 角色常量
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student'
};

// 角色顯示名稱
export const ROLE_NAMES = {
  [ROLES.ADMIN]: '管理員',
  [ROLES.TEACHER]: '老師',
  [ROLES.STUDENT]: '學生'
};

// 角色權限映射
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ['*'], // 管理員有所有權限
  [ROLES.TEACHER]: [
    'courses.view',
    'courses.create',
    'courses.update',
    'availability.manage',
    'sessions.manage',
    'payouts.view'
  ],
  [ROLES.STUDENT]: [
    'courses.view',
    'booking.create',
    'booking.view',
    'sessions.view'
  ]
};

// 檢查特定權限
export function checkPermission(permission) {
  let currentRole;
  userRole.subscribe(role => currentRole = role)();
  
  if (!currentRole) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[currentRole] || [];
  return rolePermissions.includes('*') || rolePermissions.includes(permission);
}
