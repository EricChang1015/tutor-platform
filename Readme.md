# 家教平台 (Tutor Platform)

一個現代化的線上家教預約平台，支援多時區、多語言，提供完整的教師管理、學生預約、課程管理等功能。

## 🚀 功能特色

### 核心功能
- **用戶管理**: 支援學生、教師、管理員三種角色，完整的用戶檔案管理
- **預約系統**: 智能時間槽管理，支援全球時區，相鄰時段無衝突預約
- **教師管理**: 完整的教師檔案、評價、可用時間管理、教師相簿
- **課程管理**: 教材管理、課程記錄、評價系統
- **檔案上傳**: 頭像上傳、教師相簿、教材檔案等完整檔案管理
- **收藏系統**: 學生可收藏喜愛的教師
- **通知系統**: 即時通知功能，支援多種通知類型
- **購買系統**: 課程包購買、消費記錄管理

### 技術特色
- **完整時區支援**: 基於 UTC 時間的全球時區支援，自動時間轉換
- **響應式設計**: 支援桌面、平板、手機等多種設備
- **RESTful API**: 標準化的 API 設計，完整的 OpenAPI 3.0 文檔
- **檔案儲存**: MinIO 物件儲存，支援頭像、相簿等檔案管理
- **郵件服務**: 完整的郵件通知系統
- **安全認證**: JWT 認證，角色權限控制

### 最新功能 (v1.2.0)
- ✅ **時區修復**: 修復不同時區用戶獲取當地時間可用性問題
- ✅ **預約衝突優化**: 修復相鄰時段預約衝突問題，使用正確的時間重疊邏輯
- ✅ **頭像上傳**: 完整的用戶頭像上傳和管理功能
- ✅ **收藏功能**: 學生可收藏和管理喜愛的教師
- ✅ **評價系統**: 完整的課程評價和教師評分系統
- ✅ **通知系統**: 即時通知功能，支援多種通知類型
- ✅ **API 文檔完善**: 更新所有 API 文檔，修復硬編碼日期問題

## 🧭 文檔與測試整合說明

- 本專案已將根目錄與 docs 目錄中的 Markdown 文檔整合到本 README（保留必要的 API 規格 openAPI.yaml 與示意資源）。
- 測試腳本已整合為單一入口：run_all_tests.sh，可一次性跑完所有現有測試。
- 過時或重複的報告類文檔已移除，以避免資訊重複與混淆。

## 🛠 技術架構

### 後端技術
- **框架**: NestJS (Node.js) + TypeScript
- **資料庫**: PostgreSQL 15 with UUID 主鍵
- **認證**: JWT + Passport (Local & JWT Strategy)
- **檔案儲存**: MinIO (S3 相容) 物件儲存
- **郵件服務**: MailHog (開發) / SMTP (生產)
- **API 文檔**: Swagger/OpenAPI 3.0
- **時區處理**: Luxon 時區庫
- **驗證**: Class-validator + Class-transformer

### 前端技術
- **原生 JavaScript**: 無框架依賴，輕量化實現
- **響應式 CSS**: 現代化的 UI 設計，支援深色模式
- **模組化架構**: 組件化的前端設計
- **時區感知**: 自動檢測用戶時區，支援多時區切換

### 基礎設施
- **容器化**: Docker + Docker Compose
- **開發環境**: 熱重載、自動重啟
- **資料庫遷移**: SQL 腳本管理，支援版本控制
- **環境配置**: 完整的環境變數管理
- **健康檢查**: 服務健康狀態監控

## 📦 快速開始

### 環境要求
- Docker 20.0+
- Docker Compose 2.0+
- Node.js 18+ (可選，用於本地開發)
- Git

### 安裝步驟

1. **克隆專案**
   ```bash
   git clone <repository-url>
   cd tutor-platform
   ```

2. **啟動服務**
   ```bash
   # 啟動所有服務
   docker-compose up -d

   # 查看啟動狀態
   docker-compose ps
   ```

3. **等待服務就緒**
   ```bash
   # 查看 API 服務日誌
   docker-compose logs api -f

   # 等待資料庫初始化完成
   docker-compose logs db
   ```

4. **訪問應用**
   - **API 文檔**: http://localhost:3001/api-docs
   - **演示頁面**: http://localhost:3001/demo.html
   - **API 測試**: http://localhost:3001/testAPI.html
   - **MinIO 控制台**: http://localhost:9001 (tutor/tutor123)
   - **MailHog**: http://localhost:8025

### 預設帳號
```
管理員: admin@example.com / password
教師1: teacher1@example.com / password
教師2: teacher2@example.com / password
學生1: student1@example.com / password
學生2: student2@example.com / password
```

### 一鍵整合測試
```bash
# 執行完整 E2E 測試（單一腳本）
node test_e2e_all.js
```
> 說明：此腳本依照 OpenAPI 實作端點，涵蓋：登入/用戶/教師/可用時間/次卡購買與激活/預約（創建、可選改期、可選留言、取消）/收藏/上傳/教材/通知/Admin 統計等。

### 快速測試
```bash
# 執行完整 API 測試
chmod +x test_all_apis.sh
./test_all_apis.sh

# 手動測試登入
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student1@example.com","password":"password"}'
```

## 📚 API 文檔

### 認證相關
- `POST /auth/login` - 用戶登入
- `GET /auth/me` - 獲取當前用戶信息
- `POST /auth/refresh` - 刷新 Token

### 用戶管理
- `GET /users` - 用戶列表 (管理員)
- `GET /users/:id` - 用戶詳情
- `PUT /users/:id` - 更新用戶資料
- `POST /users/:id/avatar` - 上傳用戶頭像
- `GET /users/:id/avatar` - 獲取頭像 URL

### 教師相關
- `GET /teachers` - 教師列表 (支援分頁、排序、篩選)
- `GET /teachers/:id` - 教師詳情
- `GET /teacher-availability/teacher-timetable` - 教師時間表 (支援時區)
- `GET /teacher-availability/search-teachers` - 搜尋可用教師
- `GET /teacher-availability/time-slots` - 獲取時間槽定義

### 預約系統
- `POST /bookings` - 創建預約 (支援時區)
- `GET /bookings` - 預約列表
- `GET /bookings/:id` - 預約詳情
- `PUT /bookings/:id` - 更新預約
- `DELETE /bookings/:id` - 取消預約

### 收藏功能
- `GET /favorites` - 收藏列表
- `POST /favorites` - 添加收藏
- `DELETE /favorites/:teacherId` - 移除收藏

### 評價系統
- `GET /reviews` - 評價列表
- `POST /reviews` - 創建評價
- `GET /reviews/teacher/:teacherId` - 教師評價

### 通知系統
- `GET /notifications` - 通知列表
- `PUT /notifications/:id/read` - 標記已讀
- `PUT /notifications/mark-all-read` - 全部標記已讀

### 檔案上傳
- `POST /uploads/avatar` - 上傳頭像
- `POST /uploads/gallery` - 上傳相簿圖片
- `GET /uploads/:filename` - 獲取檔案

### 其他功能
- `GET /materials` - 教材列表
- `GET /purchases` - 購買記錄
- `GET /admin/*` - 管理員功能

### 時區支援詳解

所有時間相關的 API 都支援 `timezone` 參數：

```bash
# 獲取上海時區的教師時間表
GET /teacher-availability/teacher-timetable?teacherId=xxx&date=2025-10-06&timezone=Asia/Shanghai

# 創建預約 (使用 ISO 8601 時間格式)
POST /bookings
{
  "teacherId": "xxx",
  "startsAt": "2025-10-06T14:00:00+08:00",
  "durationMinutes": 30,
  "timezone": "Asia/Shanghai"
}
```

**支援的時區**:
- `Asia/Shanghai` - 上海時間 (UTC+8)
- `Asia/Taipei` - 台北時間 (UTC+8)
- `America/New_York` - 紐約時間 (UTC-5/-4)
- `America/Los_Angeles` - 洛杉磯時間 (UTC-8/-7)
- `Europe/London` - 倫敦時間 (UTC+0/+1)
- 所有 IANA 時區標準

**時區修復特色**:
- ✅ 不同時區用戶查詢同一日期，獲得各自時區的可用時間
- ✅ 相鄰時段預約不再產生錯誤衝突 (09:00-09:30 + 09:30-10:00)
- ✅ 重疊時段仍能正確檢測衝突
- ✅ 基於 UTC 時間的精確計算，避免時間槽索引問題

## 🗄 資料庫結構

### 主要資料表
- `users` - 用戶基本信息 (含頭像 URL)
- `teacher_profiles` - 教師詳細資料
- `teacher_gallery` - 教師相簿
- `bookings` - 預約記錄
- `teacher_availability` - 教師可用時間 (UTC 時間)
- `materials` - 教材管理
- `reviews` - 評價系統
- `notifications` - 通知系統
- `favorites` - 收藏關係
- `purchases` - 購買記錄
- `uploads` - 檔案上傳記錄

### 資料庫特色
- **UUID 主鍵**: 所有表使用 UUID 作為主鍵，避免 ID 猜測
- **UTC 時間**: 所有時間戳使用 UTC，支援全球時區
- **軟刪除**: 支援軟刪除機制 (`deleted_at`)
- **自動時間戳**: 自動管理 `created_at` 和 `updated_at`
- **JSONB 欄位**: 靈活的結構化資料儲存
- **索引優化**: 針對查詢優化的複合索引
- **外鍵約束**: 完整的資料完整性約束
- **觸發器**: 自動更新相關統計資料

### 最新資料庫優化
- ✅ 添加 UTC 時間查詢索引
- ✅ 優化預約衝突檢查觸發器
- ✅ 支援頭像 URL 儲存
- ✅ 收藏關係表設計
- ✅ 通知系統表結構

## 🔧 開發指南

### 本地開發環境

1. **克隆並安裝**
   ```bash
   git clone <repository-url>
   cd tutor-platform
   cd apps/api
   npm install
   ```

2. **環境配置**
   ```bash
   # 複製環境變數範本
   cp .env.example .env

   # 編輯環境變數
   nano .env
   ```

3. **啟動開發服務**
   ```bash
   # 啟動資料庫和相關服務
   docker-compose up -d db minio mailhog

   # 本地啟動 API 服務
   npm run start:dev
   ```

### 資料庫管理

```bash
# 連接資料庫
docker-compose exec db psql -U tutor -d tutordb

# 執行遷移
docker-compose exec db psql -U tutor -d tutordb -f /docker-entrypoint-initdb.d/migrations/xxx.sql

# 查看表結構
docker-compose exec db psql -U tutor -d tutordb -c "\dt"

# 備份資料庫
docker-compose exec db pg_dump -U tutor tutordb > backup.sql

# 還原資料庫
docker-compose exec -T db psql -U tutor -d tutordb < backup.sql
```

### API 測試和除錯

```bash
# 執行完整 API 測試套件
./test_all_apis.sh

# 查看 API 服務日誌
docker-compose logs api -f

# 測試特定功能
curl -X GET http://localhost:3001/teachers
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student1@example.com","password":"password"}'

# 測試時區功能
curl "http://localhost:3001/teacher-availability/teacher-timetable?teacherId=xxx&date=2025-10-06&timezone=Asia/Shanghai"
```

### 代碼結構

```
apps/api/src/
├── auth/           # 認證模組
├── users/          # 用戶管理
├── teachers/       # 教師管理
├── bookings/       # 預約系統
├── teacher-availability/  # 教師可用時間
├── favorites/      # 收藏功能
├── reviews/        # 評價系統
├── notifications/  # 通知系統
├── uploads/        # 檔案上傳
├── materials/      # 教材管理
├── purchases/      # 購買系統
├── admin/          # 管理員功能
├── entities/       # 資料庫實體
├── utils/          # 工具函數
└── common/         # 共用模組
```

## 📋 部署指南

### 生產環境部署

1. **環境變數配置**
   ```bash
   # 修改 docker-compose.yml 或使用 .env 檔案
   NODE_ENV=production
   JWT_SECRET=your-super-secure-production-secret
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   MINIO_ACCESS_KEY=your-minio-access-key
   MINIO_SECRET_KEY=your-minio-secret-key
   SMTP_HOST=your-smtp-server
   SMTP_USER=your-smtp-user
   SMTP_PASS=your-smtp-password
   ```

2. **SSL 和反向代理**
   ```nginx
   # nginx 配置範例
   server {
       listen 443 ssl;
       server_name api.yourdomain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **資料庫備份策略**
   ```bash
   # 設定定期備份 (crontab)
   0 2 * * * docker-compose exec db pg_dump -U tutor tutordb | gzip > /backup/tutor_$(date +\%Y\%m\%d).sql.gz

   # 保留最近 30 天的備份
   find /backup -name "tutor_*.sql.gz" -mtime +30 -delete
   ```

## 🔄 更新日誌

### v1.2.0 (2025-10-06)
- ✅ **重大修復**: 時區處理邏輯完全重構
- ✅ **預約系統**: 修復相鄰時段衝突問題
- ✅ **檔案上傳**: 新增頭像上傳功能
- ✅ **收藏功能**: 完整的教師收藏系統
- ✅ **評價系統**: 課程評價和教師評分
- ✅ **通知系統**: 即時通知功能
- ✅ **API 文檔**: 完善所有 API 文檔
- ✅ **測試覆蓋**: 添加完整的 API 測試套件

### v1.1.0 (2025-09-30)
- 基礎功能實現
- 用戶認證系統
- 教師管理功能
- 預約系統基礎版本

## 📞 支援和聯絡

### 技術支援
- **文檔**: 查看本 README 和 API 文檔
- **問題回報**: [GitHub Issues](https://github.com/your-repo/issues)
- **功能請求**: [GitHub Discussions](https://github.com/your-repo/discussions)

### 聯絡資訊
- **專案維護者**: Tutor Platform Team
- **技術支援**: support@tutorplatform.com
- **商務合作**: business@tutorplatform.com

## 📄 授權

本專案採用 MIT 授權條款。詳見 [LICENSE](LICENSE) 檔案。

---

**⚠️ 重要提醒**:
- 這是一個演示專案，請勿在生產環境中使用預設的密鑰和憑證
- 生產部署前請更改所有預設密碼和密鑰
- 建議啟用 HTTPS 和其他安全措施
- 定期備份資料庫和重要檔案

**🎯 專案狀態**:
- ✅ 核心功能完成
- ✅ 時區問題已修復
- ✅ API 文檔完整
- ✅ 測試覆蓋充足
- 🚀 準備生產部署
