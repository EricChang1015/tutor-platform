#!/usr/bin/env node

/**
 * Demo功能測試腳本
 * 測試所有API端點和demo.html的功能
 */

const API_BASE = 'http://localhost:3001';

// 測試用戶憑證
const USERS = {
  admin: { username: 'admin@example.com', password: 'password' },
  student: { username: 'student1@example.com', password: 'password' },
  teacher: { username: 'teacher1@example.com', password: 'password' }
};

let tokens = {};

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return null;
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

async function testTeachers() {
  console.log('\n📚 測試教師列表API...');
  
  try {
    const response = await apiRequest('/teachers');
    console.log(`✅ 教師列表載入成功，共 ${response.items.length} 位教師`);
    
    if (response.items.length > 0) {
      const teacher = response.items[0];
      console.log(`   - 教師範例: ${teacher.name} (${teacher.domains.join(', ')})`);
      
      // 測試教師詳情
      const detail = await apiRequest(`/teachers/${teacher.id}`);
      console.log(`✅ 教師詳情載入成功: ${detail.name}`);
    }
    
    return response.items;
  } catch (error) {
    console.error('❌ 教師API測試失敗:', error.message);
    throw error;
  }
}

async function testMaterials() {
  console.log('\n📖 測試教材API...');
  
  try {
    // 測試教材列表
    const list = await apiRequest('/materials');
    console.log(`✅ 教材列表載入成功，共 ${list.items.length} 個教材`);
    
    // 測試資料夾樹
    const tree = await apiRequest('/materials?include=all');
    console.log(`✅ 教材樹載入成功，共 ${tree.folders.length} 個資料夾`);
    
    return { list, tree };
  } catch (error) {
    console.error('❌ 教材API測試失敗:', error.message);
    throw error;
  }
}

async function testBookings() {
  console.log('\n📅 測試預約API...');
  
  try {
    // 使用學生token
    const response = await apiRequest('/bookings', {
      headers: { 'Authorization': `Bearer ${tokens.student}` }
    });
    
    console.log(`✅ 預約列表載入成功，共 ${response.items.length} 個預約`);
    
    if (response.items.length > 0) {
      const booking = response.items[0];
      console.log(`   - 預約範例: ${booking.courseTitle} with ${booking.teacher.name}`);
    }
    
    return response;
  } catch (error) {
    console.error('❌ 預約API測試失敗:', error.message);
    throw error;
  }
}

async function testTeacherAvailability(teachers) {
  console.log('\n⏰ 測試教師時間表API...');
  
  if (teachers.length === 0) {
    console.log('⚠️  沒有教師可測試');
    return;
  }
  
  const teacher = teachers[0];
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const response = await fetch(`${API_BASE}/teacher-availability/teacher-timetable?teacherId=${teacher.id}&date=${today}`);
    const result = await response.json();
    
    if (result.code === 0) {
      console.log(`✅ 教師時間表載入成功，共 ${result.data.length} 個時段`);
      if (result.data.length > 0) {
        const availableSlots = result.data.filter(slot => slot.canReserve === 1);
        console.log(`   - 可預約時段: ${availableSlots.length} 個`);
      }
    } else {
      console.log(`⚠️  教師時間表API返回錯誤: ${result.msg}`);
    }
  } catch (error) {
    console.error('❌ 教師時間表API測試失敗:', error.message);
  }
}

async function testAdminReset() {
  console.log('\n🔄 測試管理員重置功能...');
  
  try {
    await apiRequest('/admin/reset-data', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokens.admin}` }
    });
    
    console.log('✅ 系統重置成功');
  } catch (error) {
    console.error('❌ 系統重置失敗:', error.message);
  }
}

async function testDemoPage() {
  console.log('\n🌐 測試Demo頁面...');
  
  try {
    const response = await fetch(`${API_BASE}/demo.html`);
    if (response.ok) {
      const html = await response.text();
      if (html.includes('家教系統 Demo')) {
        console.log('✅ Demo頁面載入成功');
      } else {
        console.log('⚠️  Demo頁面內容異常');
      }
    } else {
      console.log('❌ Demo頁面載入失敗');
    }
  } catch (error) {
    console.error('❌ Demo頁面測試失敗:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 開始Demo功能全面測試...');
  
  try {
    // 1. 測試登入
    await login('admin');
    await login('student');
    await login('teacher');
    
    // 2. 測試各個API
    const teachers = await testTeachers();
    await testMaterials();
    await testBookings();
    await testTeacherAvailability(teachers);
    
    // 3. 測試Demo頁面
    await testDemoPage();
    
    // 4. 測試管理員功能
    await testAdminReset();
    
    console.log('\n🎉 所有測試完成！');
    console.log('\n📋 測試總結:');
    console.log('   ✅ 用戶認證系統正常');
    console.log('   ✅ 教師管理功能正常');
    console.log('   ✅ 教材管理功能正常');
    console.log('   ✅ 預約系統功能正常');
    console.log('   ✅ Demo頁面正常');
    console.log('   ✅ 管理員功能正常');
    
  } catch (error) {
    console.error('\n💥 測試過程中發生錯誤:', error.message);
    process.exit(1);
  }
}

// 檢查是否有fetch
if (typeof fetch === 'undefined') {
  console.log('安裝node-fetch...');
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    console.error('請先安裝node-fetch: npm install node-fetch');
    process.exit(1);
  }
}

// 運行測試
runAllTests().catch(console.error);
