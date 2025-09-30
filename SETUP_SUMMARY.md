# 🎓 家教平台後端建立總結

## 📋 .todo 計劃草案

### 修改目的：
建立完整的家教平台後端系統，包含認證、用戶管理、教師管理、預約系統、購買項目管理和管理員功能。

### 影響範圍：
- 新增完整的 NestJS API 應用程式
- 建立 PostgreSQL 資料庫結構
- 設定 Docker Compose 開發環境
- 實現核心 API 端點
- 建立測試工具

### 風險/回滾：
- 資料庫結構變更需要謹慎處理
- Docker 環境配置錯誤可能導致服務無法啟動
- 回滾策略：`docker-compose down` 停止所有服務

### 測試項目：
- 認證 API 測試
- 用戶管理 API 測試
- 教師管理 API 測試
- 預約系統 API 測試
- 購買項目 API 測試
- 管理員功能 API 測試

## 📁 變更清單與代碼差異摘要

### 新增/修改檔案列表：

#### 資料庫相關
- `database/create_db.sql` - PostgreSQL 資料庫結構定義

#### Docker 配置
- `docker-compose.yml` - 服務編排配置
- `docker/api.Dockerfile` - API 服務 Docker 映像
- `.env` - 環境變數配置

#### NestJS API 應用程式
- `apps/api/package.json` - 依賴管理
- `apps/api/tsconfig.json` - TypeScript 配置
- `apps/api/nest-cli.json` - NestJS CLI 配置
- `apps/api/src/main.ts` - 應用程式入口點
- `apps/api/src/app.module.ts` - 主模組配置

#### 實體定義
- `apps/api/src/entities/user.entity.ts` - 用戶實體
- `apps/api/src/entities/teacher-profile.entity.ts` - 教師檔案實體
- `apps/api/src/entities/teacher-gallery.entity.ts` - 教師相簿實體
- `apps/api/src/entities/booking.entity.ts` - 預約實體
- `apps/api/src/entities/purchase.entity.ts` - 購買項目實體
- `apps/api/src/entities/index.ts` - 實體匯出

#### 認證模組
- `apps/api/src/auth/auth.module.ts` - 認證模組
- `apps/api/src/auth/auth.service.ts` - 認證服務
- `apps/api/src/auth/auth.controller.ts` - 認證控制器
- `apps/api/src/auth/dto/` - 認證 DTO
- `apps/api/src/auth/strategies/` - Passport 策略
- `apps/api/src/auth/guards/` - 認證守衛

#### 功能模組
- `apps/api/src/users/` - 用戶管理模組
- `apps/api/src/teachers/` - 教師管理模組
- `apps/api/src/bookings/` - 預約管理模組
- `apps/api/src/purchases/` - 購買項目管理模組
- `apps/api/src/admin/` - 管理員功能模組

#### 測試工具
- `apps/api/public/testAPI.html` - API 測試工具

#### 輔助檔案
- `start.sh` - 快速啟動腳本
- `.gitignore` - Git 忽略檔案配置

### DB migration 與 schema 要點：
- 使用 PostgreSQL 作為主資料庫
- 支援 UUID 主鍵
- JSONB 欄位用於靈活資料存儲
- 完整的外鍵約束和索引
- 預設測試資料

### 組態變更：
- `.env` 包含所有必要的環境變數
- Docker Compose 使用 host 網路模式
- 資料持久化到 `data/` 目錄

## 🚀 執行指令

```bash
# 1. 啟動所有服務
./start.sh

# 或手動啟動
docker-compose up -d

# 2. 查看服務狀態
docker-compose ps

# 3. 查看 API 日誌
docker-compose logs -f api

# 4. 停止服務
docker-compose down

# 5. 開發模式（可選）
cd apps/api
npm install
npm run start:dev
```

## 🧪 測試步驟與預期結果

### 1. 基本服務測試
```bash
# 檢查 API 服務
curl http://localhost:3001/auth/me
# 預期：401 Unauthorized（未登入）

# 檢查 Swagger 文檔
curl http://localhost:3001/api-docs
# 預期：返回 Swagger UI HTML
```

### 2. 認證測試
```bash
# 登入測試
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@example.com","password":"password"}'
# 預期：返回 accessToken 和 refreshToken

# 取得個人資訊
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/auth/me
# 預期：返回用戶資訊
```

### 3. 瀏覽器測試
- 訪問 http://localhost:3001/testAPI.html
- 使用測試工具進行各項 API 測試
- 預期：所有 API 端點正常回應

### 4. 服務端點檢查
- API 服務: http://localhost:3001 ✅
- API 文檔: http://localhost:3001/api-docs ✅
- 測試工具: http://localhost:3001/testAPI.html ✅
- MailHog: http://localhost:8025 ✅
- MinIO Console: http://localhost:9001 ✅

## 📝 文件更新片段

### README.md 更新
已更新以下部分：
- 項目統計和代碼結構
- 部署說明和快速啟動指令
- 服務端點資訊

## 📨 Git 提交訊息

```
feat: 建立家教平台後端系統

- 實現完整的 NestJS API 架構
- 建立 PostgreSQL 資料庫結構
- 設定 Docker Compose 開發環境
- 實現認證、用戶、教師、預約、購買項目和管理員 API
- 建立 API 測試工具
- 支援 JWT 認證和角色權限控制
- 包含預設測試資料和帳號

測試：所有核心 API 端點已實現並可通過 testAPI.html 測試
```

### 分支名稱建議
`feature/backend-api-implementation`

## 🔧 若失敗時的回推與暫停策略

### 偵錯清單
1. **連線問題**
   - 檢查 Docker 是否運行：`docker info`
   - 檢查端口是否被占用：`netstat -tulpn | grep :3001`
   - 檢查服務狀態：`docker-compose ps`

2. **環境變數問題**
   - 確認 `.env` 檔案存在且格式正確
   - 檢查資料庫連線字串
   - 驗證 JWT 密鑰設定

3. **憑證問題**
   - 檢查預設帳號密碼是否正確
   - 確認密碼雜湊演算法一致
   - 驗證 JWT 權杖生成

4. **匯入錯誤**
   - 檢查 TypeScript 編譯錯誤
   - 確認所有依賴已安裝
   - 驗證模組匯入路徑

### 連續 3 次失敗的暫停總結格式與建議選項

如果連續 3 次啟動失敗，建議：

**A) 重置環境**
```bash
docker-compose down -v
docker system prune -f
rm -rf data/
./start.sh
```

**B) 檢查系統需求**
- Docker 版本 >= 20.0
- 可用記憶體 >= 4GB
- 可用磁碟空間 >= 2GB

**C) 聯繫支援**
- 收集錯誤日誌：`docker-compose logs > error.log`
- 檢查系統資源使用情況
- 提供環境資訊和錯誤詳情
