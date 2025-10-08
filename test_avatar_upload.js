#!/usr/bin/env node

const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3001';

// 測試用戶
const USERS = {
  teacher: { username: 'teacher1@example.com', password: 'password' },
  student: { username: 'student1@example.com', password: 'password' },
  admin: { username: 'admin@example.com', password: 'password' }
};

let tokens = {};

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return await response.json();
}

async function login(role) {
  console.log(`\n🔐 測試 ${role} 登入...`);
  const user = USERS[role];
  
  try {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(user)
    });
    
    tokens[role] = response.accessToken;
    console.log(`✅ ${role} 登入成功: ${response.user.name}`);
    return response;
  } catch (error) {
    console.error(`❌ ${role} 登入失敗:`, error.message);
    throw error;
  }
}

async function testAvatarUpload(role, userId) {
  console.log(`\n📸 測試 ${role} 頭像上傳...`);
  
  try {
    // 創建測試圖片
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('file', testImageBuffer, {
      filename: `avatar-${userId}.png`,
      contentType: 'image/png'
    });

    const response = await fetch(`${BASE_URL}/users/${userId}/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens[role]}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ ${role} 頭像上傳成功: ${result.avatarUrl}`);
    return result;
  } catch (error) {
    console.error(`❌ ${role} 頭像上傳失敗:`, error.message);
    throw error;
  }
}

async function testGalleryUpload(teacherId) {
  console.log(`\n🖼️ 測試教師相簿上傳...`);
  
  try {
    // 創建測試圖片
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('file', testImageBuffer, {
      filename: `gallery-${teacherId}.png`,
      contentType: 'image/png'
    });

    const response = await fetch(`${BASE_URL}/teachers/${teacherId}/gallery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.teacher}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ 教師相簿上傳成功: ${result.url}`);
    return result;
  } catch (error) {
    console.error(`❌ 教師相簿上傳失敗:`, error.message);
    throw error;
  }
}

async function testGetGallery(teacherId) {
  console.log(`\n📂 測試獲取教師相簿...`);
  
  try {
    const response = await apiRequest(`/teachers/${teacherId}/gallery`);
    console.log(`✅ 教師相簿獲取成功，共 ${response.items.length} 個檔案`);
    return response;
  } catch (error) {
    console.error(`❌ 教師相簿獲取失敗:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 開始測試頭像和相簿上傳功能...\n');

  try {
    // 登入所有角色
    const teacherLogin = await login('teacher');
    const studentLogin = await login('student');
    const adminLogin = await login('admin');

    // 測試頭像上傳
    await testAvatarUpload('teacher', teacherLogin.user.id);
    await testAvatarUpload('student', studentLogin.user.id);
    await testAvatarUpload('admin', adminLogin.user.id);

    // 測試教師相簿
    await testGalleryUpload(teacherLogin.user.id);
    await testGetGallery(teacherLogin.user.id);

    console.log('\n🎉 所有測試完成！');
  } catch (error) {
    console.error('\n💥 測試失敗:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
