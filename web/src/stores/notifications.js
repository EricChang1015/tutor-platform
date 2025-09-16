import { writable } from 'svelte/store';

// 通知類型
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// 通知 store
export const notifications = writable([]);

let notificationId = 0;

// 添加通知
export function addNotification(message, type = NOTIFICATION_TYPES.INFO, duration = 5000) {
  const id = ++notificationId;
  const notification = {
    id,
    message,
    type,
    timestamp: Date.now()
  };

  notifications.update(items => [...items, notification]);

  // 自動移除通知
  if (duration > 0) {
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  }

  return id;
}

// 移除通知
export function removeNotification(id) {
  notifications.update(items => items.filter(item => item.id !== id));
}

// 清除所有通知
export function clearNotifications() {
  notifications.set([]);
}

// 便捷方法
export const notify = {
  success: (message, duration) => addNotification(message, NOTIFICATION_TYPES.SUCCESS, duration),
  error: (message, duration) => addNotification(message, NOTIFICATION_TYPES.ERROR, duration),
  warning: (message, duration) => addNotification(message, NOTIFICATION_TYPES.WARNING, duration),
  info: (message, duration) => addNotification(message, NOTIFICATION_TYPES.INFO, duration)
};

// 處理 API 錯誤的通知
export function notifyApiError(error) {
  let message = '操作失敗';
  
  if (error.message) {
    message = error.message;
  } else if (error.data && error.data.message) {
    message = error.data.message;
  }
  
  notify.error(message);
}

// 處理 API 成功的通知
export function notifyApiSuccess(message = '操作成功') {
  notify.success(message);
}
