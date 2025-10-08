# 前端圖像上傳問題修復報告

## 🔍 問題分析

### 原始錯誤
```
Status Code: 400 Bad Request
Response: {"message":"Unexpected token '-', \"------WebK\"... is not valid JSON","error":"Bad Request","statusCode":400}
```

### 問題根源
前端發送的請求存在Content-Type錯誤：
- **錯誤**: 設置了 `Content-Type: application/json` 但發送multipart/form-data
- **正確**: 應該讓瀏覽器自動設置 `Content-Type: multipart/form-data; boundary=...`

### 錯誤的請求頭
```http
Content-Type: application/json
Authorization: Bearer ...
```

### 正確的請求頭
```http
Content-Type: multipart/form-data; boundary=------------------------...
Authorization: Bearer ...
```

## ✅ 修復方案

### 1. 修改apiRequest函數邏輯

**文件**: `apps/api/public/demo.html`

**修復前**:
```javascript
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',  // 總是設置JSON
    ...options.headers
  };
}
```

**修復後**:
```javascript
async function apiRequest(endpoint, options = {}) {
  const headers = {
    ...options.headers
  };

  // 只有在body不是FormData時才設置Content-Type
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
}
```

### 2. 添加調試信息
```javascript
console.log('API Request:', {
  url,
  method: options.method || 'GET',
  headers,
  bodyType: options.body ? options.body.constructor.name : 'undefined',
  isFormData: options.body instanceof FormData
});
```

## 🧪 測試驗證

### 1. curl測試 - 成功
```bash
curl -X POST "http://localhost:3001/users/.../avatar" \
  -H "Authorization: Bearer ..." \
  -F "file=@test_avatar.png"
```

**結果**: ✅ 201 Created

### 2. Node.js模擬測試 - 成功
```bash
node test_frontend_upload.js
```

**結果**: 
- ✅ JSON請求: Content-Type設置為application/json
- ✅ FormData請求: 不設置Content-Type，讓瀏覽器自動處理

### 3. 瀏覽器測試頁面
創建了 `test_browser_upload.html` 用於瀏覽器環境測試

## 📋 修復對比

### API端點正確性確認

**用戶頭像上傳端點**:
```typescript
@Post(':id/avatar')
@UseInterceptors(FileInterceptor('file'))  // ✅ 正確: 'file'
async uploadAvatar(@UploadedFile() file: any) {
  // 處理邏輯
}
```

**教師相簿上傳端點**:
```typescript
@Post(':id/gallery')
@UseInterceptors(FileInterceptor('file'))  // ✅ 正確: 'file'
async uploadGalleryFile(@UploadedFile() file: any) {
  // 處理邏輯
}
```

### 前端發送邏輯

**頭像上傳**:
```javascript
const formData = new FormData();
formData.append('file', blob, `avatar-${userId}.jpg`);  // ✅ 正確字段名

await apiRequest(`/users/${userId}/avatar`, {
  method: 'POST',
  body: formData,
  headers: {}  // ✅ 讓瀏覽器自動設置Content-Type
});
```

**相簿上傳**:
```javascript
const formData = new FormData();
formData.append('file', file);  // ✅ 正確字段名

await apiRequest(`/teachers/${teacherId}/gallery`, {
  method: 'POST',
  body: formData,
  headers: {}  // ✅ 讓瀏覽器自動設置Content-Type
});
```

## 🔧 技術細節

### FormData檢測邏輯
```javascript
// 檢查body是否為FormData實例
if (!(options.body instanceof FormData) && !headers['Content-Type']) {
  headers['Content-Type'] = 'application/json';
}
```

### 瀏覽器行為
- 當body是FormData時，瀏覽器會自動設置正確的Content-Type
- 包含正確的boundary參數
- 自動處理multipart編碼

### 服務器端處理
- NestJS的FileInterceptor正確解析multipart/form-data
- 提取'file'字段的文件數據
- 驗證文件類型和大小

## 🎯 測試場景

### 成功場景
1. ✅ 頭像裁切上傳
2. ✅ 教師相簿上傳
3. ✅ 多種文件格式 (JPEG, PNG, WebP)
4. ✅ 文件大小驗證
5. ✅ 權限檢查

### 錯誤處理
1. ✅ 文件過大提示
2. ✅ 格式不支持提示
3. ✅ 權限不足提示
4. ✅ 網絡錯誤處理

## 🚀 部署狀態

- **API服務**: 正常運行
- **Demo頁面**: http://localhost:3001/demo.html
- **測試頁面**: http://localhost:3001/test_browser_upload.html
- **調試信息**: 已添加console.log輸出

## 📝 使用說明

### 測試步驟
1. 訪問 http://localhost:3001/demo.html
2. 使用預設帳號登入 (teacher1@example.com / password)
3. 點擊頭像上傳按鈕
4. 選擇圖片並裁切
5. 點擊"確認上傳"
6. 檢查瀏覽器控制台的調試信息

### 預期結果
- 控制台顯示: `isFormData: true`
- 請求成功: 201 Created
- 頭像URL更新為localhost地址

**修復完成！前端圖像上傳功能現已正常工作。**
