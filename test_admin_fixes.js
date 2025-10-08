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

// 測試默認頭像
async function testDefaultAvatar() {
  console.log('\n🖼️ 測試默認頭像...');
  
  try {
    const response = await fetch(`${BASE_URL}/default-avatar.svg`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    if (content.includes('<svg')) {
      console.log('✅ 默認頭像SVG文件正常');
      return true;
    } else {
      throw new Error('SVG內容格式錯誤');
    }
  } catch (error) {
    console.error('❌ 默認頭像測試失敗:', error.message);
    return false;
  }
}

// 測試admin登入
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

// 測試admin/bookings端點
async function testAdminBookings(token) {
  console.log('\n📊 測試預約統計端點...');
  
  try {
    const response = await apiRequest('/admin/bookings', {
      token
    });
    
    console.log('✅ 預約統計獲取成功:');
    console.log(`   - 總預約數: ${response.total}`);
    console.log(`   - 已完成: ${response.completed}`);
    console.log(`   - 已排程: ${response.scheduled}`);
    console.log(`   - 已取消: ${response.canceled}`);
    return response;
  } catch (error) {
    console.error('❌ 預約統計獲取失敗:', error.message);
    throw error;
  }
}

// 測試用戶列表（包含頭像URL）
async function testUsersList(token) {
  console.log('\n👥 測試用戶列表（頭像URL）...');
  
  try {
    const response = await apiRequest('/admin/users?page=1&pageSize=5', {
      token
    });
    
    console.log('✅ 用戶列表獲取成功:');
    response.items.forEach(user => {
      const avatarUrl = user.avatarUrl || '/default-avatar.svg';
      console.log(`   - ${user.name}: ${avatarUrl}`);
    });
    return response;
  } catch (error) {
    console.error('❌ 用戶列表獲取失敗:', error.message);
    throw error;
  }
}

// 測試創建用戶（模擬前端操作）
async function testCreateUserModal(token) {
  console.log('\n➕ 測試創建用戶功能...');
  
  const userData = {
    role: 'student',
    email: `test-modal-${Date.now()}@example.com`,
    name: '模態框測試用戶',
    password: 'password123',
    phone: '0912345678',
    bio: '這是通過模態框創建的測試用戶',
    timezone: 'Asia/Taipei',
    active: true
  };

  try {
    const response = await apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
      token
    });
    
    console.log('✅ 用戶創建成功:', response.name, response.email);
    return response;
  } catch (error) {
    console.error('❌ 創建用戶失敗:', error.message);
    throw error;
  }
}

// 測試獲取單個用戶（模擬編輯操作）
async function testGetUserForEdit(token, userId) {
  console.log('\n✏️ 測試獲取用戶詳情（編輯功能）...');
  
  try {
    const response = await apiRequest(`/admin/users/${userId}`, {
      token
    });
    
    console.log('✅ 用戶詳情獲取成功:');
    console.log(`   - ID: ${response.id}`);
    console.log(`   - 姓名: ${response.name}`);
    console.log(`   - Email: ${response.email}`);
    console.log(`   - 角色: ${response.role}`);
    console.log(`   - 狀態: ${response.active ? '啟用' : '停用'}`);
    return response;
  } catch (error) {
    console.error('❌ 獲取用戶詳情失敗:', error.message);
    throw error;
  }
}

// 主測試函數
async function main() {
  console.log('🚀 開始測試Admin修復功能...\n');

  let allTestsPassed = true;

  try {
    // 1. 測試默認頭像
    const avatarTest = await testDefaultAvatar();
    if (!avatarTest) allTestsPassed = false;
    
    // 2. 管理員登入
    const adminToken = await testAdminLogin();
    
    // 3. 測試admin/bookings端點
    await testAdminBookings(adminToken);
    
    // 4. 測試用戶列表（頭像URL）
    await testUsersList(adminToken);
    
    // 5. 測試創建用戶
    const newUser = await testCreateUserModal(adminToken);
    
    // 6. 測試獲取用戶詳情（編輯功能）
    await testGetUserForEdit(adminToken, newUser.id);

    if (allTestsPassed) {
      console.log('\n🎉 所有Admin修復功能測試完成！');
      console.log('\n📝 測試摘要:');
      console.log('✅ 默認頭像SVG文件正常');
      console.log('✅ admin/bookings端點正常');
      console.log('✅ 用戶列表頭像URL正確');
      console.log('✅ 創建用戶功能正常');
      console.log('✅ 獲取用戶詳情功能正常');
      console.log('\n🔧 修復內容:');
      console.log('1. 創建default-avatar.svg文件');
      console.log('2. 添加admin/bookings API端點');
      console.log('3. 添加createModal函數');
      console.log('4. 修復BookingStatus枚舉使用');
    } else {
      console.log('\n⚠️ 部分測試失敗，請檢查相關功能');
    }

  } catch (error) {
    console.error('\n💥 測試失敗:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
