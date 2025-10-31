# 家教平台 (Tutor Platform) v1.3.0

一個現代化的線上家教預約平台，支援多語言，提供完整的教師管理、學生預約、課程管理、課後證據上傳與報表功能。

## 🚀 功能特色

### 核心功能
- **用戶管理**: 支援學生、教師、管理員三種角色，完整的用戶檔案管理
- **預約系統**: 智能時間槽管理，使用 Asia/Taipei 時區，相鄰時段無衝突預約
- **教師管理**: 完整的教師檔案、評價、可用時間管理、教師相簿
- **教材管理**: 多級資料夾結構、教材 CRUD、PDF 上傳、教材搜尋
- **檔案上傳**: 頭像上傳、教師相簿、教材檔案等完整檔案管理
- **收藏系統**: 學生可收藏喜愛的教師
- **通知系統**: 即時通知功能，支援多種通知類型
- **購買系統**: 課程包購買、消費記錄管理

### 技術特色
- **時區設定**: 基於 UTC 時間，統一使用 Asia/Taipei 時區
- **響應式設計**: 支援桌面、平板、手機等多種設備
- **RESTful API**: 標準化的 API 設計，完整的 OpenAPI 3.0 文檔
- **檔案儲存**: MinIO 物件儲存，支援頭像、相簿等檔案管理
- **郵件服務**: 完整的郵件通知系統
- **安全認證**: JWT 認證，角色權限控制

## 🛠 技術架構

### 後端技術
- **框架**: NestJS (Node.js) + TypeScript
- **資料庫**: PostgreSQL 15 with UUID 主鍵
- **認證**: JWT + Passport (Local & JWT Strategy)
- **檔案儲存**: MinIO (S3 相容) 物件儲存
- **郵件服務**: MailHog (開發) / SMTP (生產)
- **API 文檔**: Swagger/OpenAPI 3.0

- **驗證**: Class-validator + Class-transformer

### 前端技術
- **原生 JavaScript**: 無框架依賴，輕量化實現
- **響應式 CSS**: 現代化的 UI 設計，支援深色模式
- **模組化架構**: 組件化的前端設計


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

## 📚 API 文檔

- OpenAPI 規格：docs/openAPI.yaml（v1.3.0）
- 報表與課後證據說明：docs/markdown.md

### 認證相關
- `POST /auth/login` - 用戶登入
- `GET /auth/me` - 獲取當前用戶信息
- `POST /auth/refresh` - 刷新 Token

### 用戶管理
- `GET /users` - 用戶列表 (管理員)
- `GET /users/:id` - 用戶詳情
- `PUT /users/:id` - 更新用戶資料
- `POST /users/:id/avatar` - 上傳用戶頭像

#### 教師可用時間（30 分鐘時段）快速導覽
- 時段採 30 分鐘為單位，編號 0-47，對應 00:00-23:30
- 預約需對齊時段（:00 或 :30），時長需為 30 的倍數

範例指令：

```bash
# 1) 取得所有 30 分鐘時間槽（00:00 ~ 23:30）
GET /teacher-availability/time-slots

# 2) 搜尋可用教師（指定日期、時間範圍）
GET /teacher-availability/search-teachers?date=2025-10-06&fromTime=14:00&toTime=15:00

# 3) 查看教師時間表（使用 Asia/Taipei 時區）
GET \
  /teacher-availability/teacher-timetable?teacherId={TEACHER_ID}&date=2025-10-06

# 4) 設定教師指定日期可用時段（管理員/教師）
POST /teacher-availability/set-availability
{
  "teacherId": "{TEACHER_ID}",
  "date": "2025-10-06",
  "timeSlots": [18, 19]
}

# 5) 設定教師週間時間表（管理員/教師）
POST /teacher-availability/set-weekly-schedule
{
  "teacherId": "{TEACHER_ID}",
  "weeklySchedule": {
    "monday": [18, 19],
    "tuesday": [18, 19],
    "wednesday": [18, 19],
    "thursday": [18, 19],
    "friday": [18, 19]
  }
}

# 6) 建立預約（對齊時段，ISO8601 時間）
POST /bookings
{
  "teacherId": "{TEACHER_ID}",
  "startsAt": "2025-10-06T14:00:00+08:00",

## 🧑‍🏫 教師可用時段設定（Demo 頁）
- 進入 demo.html > 教師 Profile 頁右側：
  - 「預設可約時間」：以 48 個半小時 slot 選擇器設定偏好，點「儲存預設」將寫入 users.settings.slots（PATCH /users/{id}）
  - 「未來 14 天可用時段設定」：左側日期、右側 slot 選擇
    - 「清空當日」：清除該日選擇
    - 「套用預設」：以預設 slots 填入
    - 「儲存當日」：POST /teacher-availability/set-availability
    - 「一鍵套用到未來14天」：將預設或每日選擇批次套用 14 天

### API 範例（set-availability）
```bash
curl -X 'POST' \
  'http://localhost:3001/teacher-availability/set-availability' \
  -H "Content-Type: application/json" \
  -H 'Authorization: Bearer xxx' \
  -d '{"teacherId":"xxx","date":"2025-10-06","timeSlots":[18,19,20,21,22,23,24,25,26,27,28,29,30,31]}'
```

  "durationMinutes": 30,

  "courseTitle": "English Conversation"
}
```
> 注意：舊檔中的 /teacher-availability/time-slot/{id} 與 /set-weekly-availability 已被淘汰，請改用本段列出的端點與參數。

- `GET /users/:id/avatar` - 獲取頭像 URL

### 教師相關
- `GET /teachers` - 教師列表 (支援分頁、排序、篩選)
- `GET /teachers/:id` - 教師詳情
- `GET /teacher-availability/teacher-timetable` - 教師時間表
- `GET /teacher-availability/search-teachers` - 搜尋可用教師
- `GET /teacher-availability/time-slots` - 獲取時間槽定義

### 預約系統
- `POST /bookings` - 創建預約
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

### 教材管理
- `GET /materials` - 教材列表和資料夾樹
- `POST /materials` - 建立教材（支援檔案上傳）
- `GET /materials/:id` - 獲取教材詳情
- `PATCH /materials/:id` - 更新教材
- `DELETE /materials/:id` - 刪除教材
- `GET /materials/folders` - 獲取所有資料夾
- `POST /materials/folders` - 建立資料夾
- `PATCH /materials/folders/:id` - 更新資料夾
- `DELETE /materials/folders/:id` - 刪除資料夾

### 其他功能
- `GET /purchases` - 購買記錄
- `GET /admin/*` - 管理員功能

## 🗄 資料庫結構

### 主要資料表
- `users` - 用戶基本信息 (含頭像 URL)
- `teacher_profiles` - 教師詳細資料
- `teacher_gallery` - 教師相簿
- `bookings` - 預約記錄
- `teacher_availability` - 教師可用時間 (UTC 時間)
- `materials` - 教材管理（支援 page/pdf 類型）
- `folders` - 多級資料夾結構
- `reviews` - 評價系統
- `notifications` - 通知系統
- `favorites` - 收藏關係
- `purchases` - 購買記錄
- `uploads` - 檔案上傳記錄
- `booking_evidences` - 課後證據（關聯 bookings 與 uploads）


### 資料庫特色
- **UUID 主鍵**: 所有表使用 UUID 作為主鍵，避免 ID 猜測
- **UTC 時間**: 所有時間戳使用 UTC，統一使用 Asia/Taipei 時區
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
   git clone https://github.com/EricChang1015/tutor-platform.git
   cd tutor-platform
   cd apps/api
   npm install
   ```

2. **環境配置**
   ```bash
   vim .env
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

> 注意：
> - 初始資料已自 create_db.sql 分離為數個檔案（database/init_*.sql），並由 docker-compose 以 /docker-entrypoint-initdb.d/0X-*.sql 掛載。
> - 僅在資料庫資料目錄為空時（第一次啟動）這些檔案會自動執行；既有環境請以 migrations/ 下的 SQL 逐一套用。

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

# 測試時間表功能
curl "http://localhost:3001/teacher-availability/teacher-timetable?teacherId=xxx&date=2025-10-06"
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

## 📞 支援和聯絡

### 技術支援
- **文檔**: 查看本 README 和 API 文檔
- **問題回報**: [GitHub Issues](https://github.com/EricChang1015/tutor-platform/issues)
- **功能請求**: [GitHub Discussions](https://github.com/EricChang1015/tutor-platform/discussions)

### 聯絡資訊
- **專案維護者**: Tutor Platform Team
- **商務合作**: eric.chang.1015@gmail.com

---
