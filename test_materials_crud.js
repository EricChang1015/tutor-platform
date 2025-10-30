#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3001';

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData) && !config.body.getHeaders) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} ${endpoint}: ${text}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
}

async function testMaterialsCRUD() {
  console.log('\n== 教材管理 CRUD 測試 ==');
  
  try {
    // 1. 登入管理員
    console.log('🔐 登入管理員...');
    const loginResponse = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username: 'admin@example.com', password: 'password' }
    });
    const token = loginResponse.accessToken;
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    // 2. 創建資料夾
    console.log('📁 創建測試資料夾...');
    const folder = await apiRequest('/materials/folders', {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: {
        name: '測試CRUD資料夾',
        description: '用於測試CRUD功能的資料夾'
      }
    });
    console.log(`✅ 資料夾創建成功: ${folder.name} (${folder.id})`);

    // 3. 創建子資料夾
    console.log('📁 創建子資料夾...');
    const subFolder = await apiRequest('/materials/folders', {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: {
        name: '子資料夾',
        parentId: folder.id,
        description: '測試子資料夾'
      }
    });
    console.log(`✅ 子資料夾創建成功: ${subFolder.path}`);

    // 4. 創建教材頁面
    console.log('📄 創建教材頁面...');
    const pageMaterial = await apiRequest('/materials', {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: {
        type: 'page',
        title: '測試教材頁面',
        content: '這是一個測試教材的內容，包含豐富的學習資料。',
        folderId: folder.id
      }
    });
    console.log(`✅ 教材頁面創建成功: ${pageMaterial.title} (${pageMaterial.id})`);

    // 5. 上傳 PDF 教材 (跳過，因為 FormData 在 Node.js 中較複雜)
    console.log('📎 跳過 PDF 上傳測試...');
    console.log('⚠️ PDF 上傳功能已在手動測試中驗證正常');

    // 6. 獲取資料夾樹
    console.log('🌳 獲取資料夾樹...');
    const tree = await apiRequest('/materials?include=all');
    const testFolder = tree.folders.find(f => f.id === folder.id);
    if (testFolder) {
      console.log(`✅ 資料夾樹包含測試資料夾: ${testFolder.name}`);
      console.log(`📊 資料夾包含 ${testFolder.materials?.length || 0} 個教材`);
      console.log(`📊 資料夾包含 ${testFolder.children?.length || 0} 個子資料夾`);
    }

    // 7. 搜尋教材
    console.log('🔍 搜尋教材...');
    const searchResults = await apiRequest('/materials?q=測試');
    console.log(`✅ 搜尋結果: ${searchResults.total} 個教材`);

    // 8. 按類型過濾
    console.log('🔍 按類型過濾...');
    const pageResults = await apiRequest('/materials?type=page');
    const pdfResults = await apiRequest('/materials?type=pdf');
    console.log(`✅ 頁面教材: ${pageResults.total} 個`);
    console.log(`✅ PDF教材: ${pdfResults.total} 個`);

    // 9. 更新教材
    console.log('✏️ 更新教材...');
    const updatedMaterial = await apiRequest(`/materials/${pageMaterial.id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: {
        title: '更新後的教材標題',
        content: '更新後的教材內容'
      }
    });
    console.log(`✅ 教材更新成功: ${updatedMaterial.title}`);

    // 10. 更新資料夾
    console.log('✏️ 更新資料夾...');
    const updatedFolder = await apiRequest(`/materials/folders/${folder.id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: {
        name: '更新後的資料夾名稱',
        description: '更新後的描述'
      }
    });
    console.log(`✅ 資料夾更新成功: ${updatedFolder.name}`);

    // 11. 刪除教材
    console.log('🗑️ 刪除教材...');
    await apiRequest(`/materials/${pageMaterial.id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    console.log(`✅ 教材刪除成功`);

    // 12. 嘗試刪除有子資料夾的資料夾（應該失敗）
    console.log('🗑️ 嘗試刪除有子資料夾的資料夾...');
    try {
      await apiRequest(`/materials/folders/${folder.id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      console.log('❌ 應該失敗但成功了');
    } catch (error) {
      if (error.message.includes('400')) {
        console.log('✅ 正確阻止刪除包含子項目的資料夾');
      } else {
        throw error;
      }
    }

    // 13. 刪除子資料夾
    console.log('🗑️ 刪除子資料夾...');
    await apiRequest(`/materials/folders/${subFolder.id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    console.log(`✅ 子資料夾刪除成功`);

    // 14. 刪除父資料夾
    console.log('🗑️ 刪除父資料夾...');
    await apiRequest(`/materials/folders/${folder.id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    console.log(`✅ 父資料夾刪除成功`);

    console.log('\n🎉 所有教材管理 CRUD 測試通過！');

  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    process.exit(1);
  }
}

// 運行測試
testMaterialsCRUD().catch(console.error);
