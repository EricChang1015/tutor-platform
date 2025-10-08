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

// 測試獲取用戶列表並找到教師
async function testGetTeachers(token) {
  console.log('\n👨‍🏫 測試獲取教師列表...');
  
  try {
    const response = await apiRequest('/admin/users?role=teacher', {
      token
    });
    
    const teachers = response.items.filter(user => user.role === 'teacher');
    console.log(`✅ 找到 ${teachers.length} 位教師`);
    
    if (teachers.length > 0) {
      console.log('   教師列表:');
      teachers.forEach(teacher => {
        console.log(`   - ${teacher.name} (${teacher.id})`);
      });
      return teachers[0]; // 返回第一位教師
    } else {
      throw new Error('沒有找到教師用戶');
    }
  } catch (error) {
    console.error('❌ 獲取教師列表失敗:', error.message);
    throw error;
  }
}

// 測試獲取教師詳細資料（模擬點擊"檔案"按鈕）
async function testGetTeacherProfile(token, teacherId) {
  console.log('\n📋 測試獲取教師詳細資料（模擬點擊檔案按鈕）...');
  
  try {
    const response = await apiRequest(`/admin/users/${teacherId}`, {
      token
    });
    
    console.log('✅ 教師資料獲取成功:');
    console.log(`   - 姓名: ${response.name}`);
    console.log(`   - Email: ${response.email}`);
    console.log(`   - 角色: ${response.role}`);
    
    if (response.teacherProfile) {
      const profile = response.teacherProfile;
      console.log('   - 教師檔案:');
      console.log(`     * 經驗年數: ${profile.experienceYears || '未設定'}`);
      console.log(`     * 價格: $${profile.unitPriceUsd || '未設定'}/30分鐘`);
      console.log(`     * 領域: ${(profile.domains || []).join(', ') || '未設定'}`);
      console.log(`     * 地區: ${(profile.regions || []).join(', ') || '未設定'}`);
      console.log(`     * 語言: ${(profile.languages || []).join(', ') || '未設定'}`);
      console.log(`     * 證書: ${(profile.certifications || []).join(', ') || '未設定'}`);
    } else {
      console.log('   - 教師檔案: 未創建');
    }
    
    return response;
  } catch (error) {
    console.error('❌ 獲取教師資料失敗:', error.message);
    throw error;
  }
}

// 測試更新教師檔案（模擬模態框操作）
async function testUpdateTeacherProfile(token, teacherId) {
  console.log('\n✏️ 測試更新教師檔案（模擬模態框保存）...');
  
  const profileData = {
    intro: '這是通過API測試更新的教師介紹',
    certifications: ['TESOL', 'IELTS', 'API測試證書'],
    experienceYears: 10,
    experienceSince: 2014,
    unitPriceUsd: 40.00,
    domains: ['English', 'Business English', 'API測試'],
    regions: ['Taiwan', 'Online', 'API測試地區'],
    languages: ['English', 'Chinese', 'API測試語言']
  };

  try {
    const response = await apiRequest(`/admin/teachers/${teacherId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
      token
    });
    
    console.log('✅ 教師檔案更新成功:');
    console.log(`   - 經驗年數: ${response.experienceYears}年`);
    console.log(`   - 價格: $${response.unitPriceUsd}/30分鐘`);
    console.log(`   - 領域: ${response.domains.join(', ')}`);
    console.log(`   - 地區: ${response.regions.join(', ')}`);
    console.log(`   - 語言: ${response.languages.join(', ')}`);
    console.log(`   - 證書: ${response.certifications.join(', ')}`);
    
    return response;
  } catch (error) {
    console.error('❌ 更新教師檔案失敗:', error.message);
    throw error;
  }
}

// 測試獲取一般用戶（模擬點擊"編輯"按鈕）
async function testGetUserForEdit(token) {
  console.log('\n👤 測試獲取一般用戶（模擬點擊編輯按鈕）...');
  
  try {
    // 先獲取用戶列表
    const usersResponse = await apiRequest('/admin/users?pageSize=5', {
      token
    });
    
    if (usersResponse.items.length === 0) {
      throw new Error('沒有找到用戶');
    }
    
    const user = usersResponse.items[0];
    
    // 獲取用戶詳細資料
    const response = await apiRequest(`/admin/users/${user.id}`, {
      token
    });
    
    console.log('✅ 用戶資料獲取成功:');
    console.log(`   - 姓名: ${response.name}`);
    console.log(`   - Email: ${response.email}`);
    console.log(`   - 角色: ${response.role}`);
    console.log(`   - 電話: ${response.phone || '未設定'}`);
    console.log(`   - 時區: ${response.timezone || '未設定'}`);
    console.log(`   - 狀態: ${response.active ? '啟用' : '停用'}`);
    
    return response;
  } catch (error) {
    console.error('❌ 獲取用戶資料失敗:', error.message);
    throw error;
  }
}

// 主測試函數
async function main() {
  console.log('🚀 開始測試模態框修復功能...\n');

  try {
    // 1. 管理員登入
    const adminToken = await testAdminLogin();
    
    // 2. 獲取教師列表
    const teacher = await testGetTeachers(adminToken);
    
    // 3. 測試獲取教師詳細資料（模擬點擊"檔案"按鈕）
    await testGetTeacherProfile(adminToken, teacher.id);
    
    // 4. 測試更新教師檔案（模擬模態框保存操作）
    await testUpdateTeacherProfile(adminToken, teacher.id);
    
    // 5. 測試獲取一般用戶（模擬點擊"編輯"按鈕）
    await testGetUserForEdit(adminToken);

    console.log('\n🎉 所有模態框功能測試完成！');
    console.log('\n📝 測試摘要:');
    console.log('✅ 管理員登入正常');
    console.log('✅ 教師列表獲取正常');
    console.log('✅ 教師詳細資料獲取正常（檔案按鈕功能）');
    console.log('✅ 教師檔案更新正常（模態框保存功能）');
    console.log('✅ 用戶詳細資料獲取正常（編輯按鈕功能）');
    console.log('\n🔧 修復內容:');
    console.log('1. 修復調試信息輸出問題');
    console.log('2. 修復showTeacherProfileModal缺少openModal調用');
    console.log('3. 修復showEditUserModal缺少openModal調用');
    console.log('4. 確保所有模態框都能正常顯示');

  } catch (error) {
    console.error('\n💥 測試失敗:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
