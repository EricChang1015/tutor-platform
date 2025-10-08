#!/usr/bin/env node

const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3001';

// 模擬前端的apiRequest函數
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    ...options.headers
  };

  // 只有在body不是FormData時才設置Content-Type
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // 添加Authorization header
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  console.log('Request URL:', url);
  console.log('Request Headers:', headers);
  console.log('Request Body Type:', options.body ? options.body.constructor.name : 'undefined');

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Request failed:', error.message);
    throw error;
  }
}

async function testLogin() {
  console.log('\n🔐 測試登入...');
  
  try {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'teacher1@example.com',
        password: 'password'
      })
    });
    
    console.log('✅ 登入成功:', response.user.name);
    return response.accessToken;
  } catch (error) {
    console.error('❌ 登入失敗:', error.message);
    throw error;
  }
}

async function testAvatarUpload(token, userId) {
  console.log('\n📸 測試頭像上傳...');
  
  try {
    // 創建測試圖片
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('file', testImageBuffer, {
      filename: `avatar-${userId}.jpg`,
      contentType: 'image/jpeg'
    });

    const response = await apiRequest(`/users/${userId}/avatar`, {
      method: 'POST',
      body: formData,
      token: token
    });

    console.log('✅ 頭像上傳成功:', response.avatarUrl);
    return response;
  } catch (error) {
    console.error('❌ 頭像上傳失敗:', error.message);
    throw error;
  }
}

async function testJsonRequest(token) {
  console.log('\n📋 測試JSON請求...');
  
  try {
    const response = await apiRequest('/auth/me', {
      method: 'GET',
      token: token
    });

    console.log('✅ JSON請求成功:', response.name);
    return response;
  } catch (error) {
    console.error('❌ JSON請求失敗:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 開始測試前端上傳功能...\n');

  try {
    // 測試登入
    const token = await testLogin();
    
    // 測試JSON請求（確保Content-Type正確設置）
    const userInfo = await testJsonRequest(token);
    
    // 測試頭像上傳（確保不設置Content-Type）
    await testAvatarUpload(token, userInfo.id);

    console.log('\n🎉 所有測試完成！');
  } catch (error) {
    console.error('\n💥 測試失敗:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
