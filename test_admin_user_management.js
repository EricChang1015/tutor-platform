#!/usr/bin/env node

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3001';

// API請求函數
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`請求失敗 ${endpoint}:`, error.message);
    throw error;
  }
}

// 測試登入
async function testAdminLogin() {
  console.log('\n🔐 測試管理員登入...');
  
  try {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'admin@example.com',
        password: 'password'
      })
    });
    
    console.log('✅ 管理員登入成功:', response.user.name);
    return response.accessToken;
  } catch (error) {
    console.error('❌ 管理員登入失敗:', error.message);
    throw error;
  }
}

// 測試獲取用戶列表
async function testGetUsers(token) {
  console.log('\n📋 測試獲取用戶列表...');
  
  try {
    const response = await apiRequest('/admin/users?page=1&pageSize=10', {
      token
    });
    
    console.log(`✅ 用戶列表獲取成功，共 ${response.total} 個用戶`);
    console.log(`   - 當前頁: ${response.page}/${response.totalPages}`);
    console.log(`   - 用戶: ${response.items.map(u => `${u.name}(${u.role})`).join(', ')}`);
    return response;
  } catch (error) {
    console.error('❌ 獲取用戶列表失敗:', error.message);
    throw error;
  }
}

// 測試創建學生
async function testCreateStudent(token) {
  console.log('\n👨‍🎓 測試創建學生...');
  
  const studentData = {
    role: 'student',
    email: `test-student-${Date.now()}@example.com`,
    name: '測試學生',
    password: 'password123',
    phone: '0912345678',
    bio: '這是一個測試學生帳號',
    timezone: 'Asia/Taipei',
    active: true
  };

  try {
    const response = await apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(studentData),
      token
    });
    
    console.log('✅ 學生創建成功:', response.name, response.email);
    return response;
  } catch (error) {
    console.error('❌ 創建學生失敗:', error.message);
    throw error;
  }
}

// 測試創建教師
async function testCreateTeacher(token) {
  console.log('\n👨‍🏫 測試創建教師...');
  
  const teacherData = {
    role: 'teacher',
    email: `test-teacher-${Date.now()}@example.com`,
    name: '測試教師',
    password: 'password123',
    phone: '0987654321',
    bio: '這是一個測試教師帳號',
    timezone: 'Asia/Taipei',
    active: true,
    // 教師檔案
    intro: '我是一位經驗豐富的英語教師',
    certifications: ['TESOL', 'IELTS'],
    experienceYears: 5,
    experienceSince: 2019,
    unitPriceUsd: 30.00,
    domains: ['English', 'Conversation'],
    regions: ['Taiwan', 'Online'],
    languages: ['English', 'Chinese']
  };

  try {
    const response = await apiRequest('/admin/teachers', {
      method: 'POST',
      body: JSON.stringify(teacherData),
      token
    });
    
    console.log('✅ 教師創建成功:', response.name, response.email);
    console.log('   - 教師檔案:', response.profile ? '已創建' : '未創建');
    return response;
  } catch (error) {
    console.error('❌ 創建教師失敗:', error.message);
    throw error;
  }
}

// 測試更新用戶
async function testUpdateUser(token, userId) {
  console.log('\n✏️ 測試更新用戶...');
  
  const updateData = {
    name: '更新後的姓名',
    phone: '0900000000',
    bio: '更新後的個人簡介',
    active: true
  };

  try {
    const response = await apiRequest(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
      token
    });
    
    console.log('✅ 用戶更新成功:', response.name);
    return response;
  } catch (error) {
    console.error('❌ 更新用戶失敗:', error.message);
    throw error;
  }
}

// 測試重置密碼
async function testResetPassword(token, userId) {
  console.log('\n🔑 測試重置密碼...');
  
  const resetData = {
    newPassword: 'newpassword123',
    forceChangeOnNextLogin: false
  };

  try {
    const response = await apiRequest(`/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(resetData),
      token
    });
    
    console.log('✅ 密碼重置成功:', response.message);
    return response;
  } catch (error) {
    console.error('❌ 重置密碼失敗:', error.message);
    throw error;
  }
}

// 測試更新教師檔案
async function testUpdateTeacherProfile(token, teacherId) {
  console.log('\n📝 測試更新教師檔案...');
  
  const profileData = {
    intro: '更新後的教師介紹',
    certifications: ['TESOL', 'IELTS', 'TOEFL'],
    experienceYears: 8,
    experienceSince: 2016,
    unitPriceUsd: 35.00,
    domains: ['English', 'Business English', 'IELTS'],
    regions: ['Taiwan', 'Online', 'Hong Kong'],
    languages: ['English', 'Chinese', 'Japanese']
  };

  try {
    const response = await apiRequest(`/admin/teachers/${teacherId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
      token
    });
    
    console.log('✅ 教師檔案更新成功');
    console.log(`   - 經驗年數: ${response.experienceYears}年`);
    console.log(`   - 價格: $${response.unitPriceUsd}/30分鐘`);
    console.log(`   - 領域: ${response.domains.join(', ')}`);
    return response;
  } catch (error) {
    console.error('❌ 更新教師檔案失敗:', error.message);
    throw error;
  }
}

// 主測試函數
async function main() {
  console.log('🚀 開始測試Admin用戶管理功能...\n');

  try {
    // 1. 管理員登入
    const adminToken = await testAdminLogin();
    
    // 2. 獲取用戶列表
    const usersList = await testGetUsers(adminToken);
    
    // 3. 創建學生
    const newStudent = await testCreateStudent(adminToken);
    
    // 4. 創建教師
    const newTeacher = await testCreateTeacher(adminToken);
    
    // 5. 更新學生資料
    await testUpdateUser(adminToken, newStudent.id);
    
    // 6. 重置學生密碼
    await testResetPassword(adminToken, newStudent.id);
    
    // 7. 更新教師檔案
    await testUpdateTeacherProfile(adminToken, newTeacher.id);
    
    // 8. 再次獲取用戶列表確認變更
    await testGetUsers(adminToken);

    console.log('\n🎉 所有Admin用戶管理功能測試完成！');
    console.log('\n📝 測試摘要:');
    console.log('✅ 管理員登入');
    console.log('✅ 獲取用戶列表');
    console.log('✅ 創建學生');
    console.log('✅ 創建教師（含檔案）');
    console.log('✅ 更新用戶資料');
    console.log('✅ 重置用戶密碼');
    console.log('✅ 更新教師檔案');

  } catch (error) {
    console.error('\n💥 測試失敗:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
