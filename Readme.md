# Tutor Platform MVP 說明文件

我是線上教學老師與老闆，旗下有多名老師與學生，目前由我手動媒合上課時間、回收老師回報並結算。此專案目標是做出一個可先上線的 MVP，之後能逐步擴展功能與自動化流程。

## 1) 系統需求（MVP → 可擴展）

核心角色
- Admin：總覽、建立老師/學生、手動配課與加堂、月結審核。
- Teacher：設定可授課時段、管理課表、上課連結、課後上傳證明與教師回報、查看月結。
- Student：持有課程包、選老師與時段預約、課後填學習目標。

預約與上課
- 老師維護每週重複的可授課時段（支持例外）。
- 學生查看老師空檔並預約 25 分鐘課程。
- 會議連結 MVP：由老師提供（可填 Zoom 個人會議室或每次填寫）。
- 通知：預約成功、課前 24h/1h 提醒、課後提醒（老師與學生各自需填資料）。
- 自動審批：預約成功即 confirmed（衝突或超容量才擋）。

課後閉環
- 老師：上傳截圖證明 + 填教師備註（teacher notes）。
- 學生：填學習目標/建議（student goal）。
- 三者齊備才算 Completed，否則維持 Confirmed，不進結算。

取消/補課
- 學生 ≥24h 前取消：返還 1 堂；<24h：預設扣堂。
- 技術問題取消：返 1 堂 + 補償 1 堂（credit）。
- 老師取消：先記錄，是否補償由 Admin 決策（或比照技術問題）。

課程與計費
- 目前唯一課程 English 1-on-1，25 分鐘，預設每堂 7 美元。
- 抽成規則：平台全域預設，可被單一老師覆寫。
- 套裝課（package）：Admin 手動加堂（先不接金流），remaining_sessions 扣/返。
- Group 課先不開，模型預留 capacity。

結算與報表
- 月結：聚合上月已完成課堂，依 pricing rule 計算老師應得與平台分潤，生成 payout。
- Admin 報表：預約數、完成率、取消率、技術取消比例、收入與分潤。
- Teacher 報表：當月課時與估算收入。
- Student：剩餘堂數、已預約與歷史課程。

通知渠道
- MVP：Email（必備）。可選 SMS/WhatsApp。WeChat 後續導入。

權限與隱私
- RBAC：Admin/Teacher/Student 路由與資料可見性隔離。
- 檔案：上傳至 S3/MinIO，私有存取，僅 Admin 或對應老師可見。

## 2) 技術架構

- 前端：Next.js（角色式儀表板）
- 後端：NestJS（TypeScript），Prisma + PostgreSQL
- 快取與排程：Redis + BullMQ（提醒、月結批次）
- 儲存：MinIO（S3 相容，簽名 URL 直傳）
- 部署：Docker Compose

後端主要模組
- Auth、Users、Teachers、Students
- Courses、Pricing、Packages
- Availability、Booking
- Sessions（會議連結、課後回報與 proof 上傳）
- Storage（S3/MinIO 簽名 URL）
- Notifications（Email/排程）
- Payouts（月結）
- Reports（儀表板，後續）

## 3) 環境需求

Docker 服務
- PostgreSQL 15（含初始化 SQL）
- Redis 7
- MinIO（9000 API / 9001 Console）
- 後端 API（NestJS，Node 20）

環境變數（compose 中已設定）
- DATABASE_URL、REDIS_URL
- S3_ENDPOINT、S3_ACCESS_KEY、S3_SECRET_KEY、S3_BUCKET、S3_REGION、S3_USE_PATH_STYLE
- JWT_SECRET、PORT

## 4) 專案啟動

初次啟動
- 建議使用 Docker Compose（已提供 docker-compose.yml）
- api 映像會在 build 時執行 npm ci 與 prisma generate
- compose 僅掛載 src、prisma、.env，避免覆蓋 node_modules

指令
- 啟動
  - docker compose up -d
- 檢查 API
  - curl -s http://localhost:3001/health  → 應回傳 {"ok":true,...}
  - curl -s http://localhost:3001/        → "Hello World!"
- 登入測試（admin）
  - curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"<你的密碼>"}'

常見問題
- @prisma/client did not initialize yet：
  - 確保 prisma/schema.prisma 的 generator client 沒有自訂 output（使用預設）
  - 只掛載 src/prisma/.env，不要掛載整個 /app
  - 重新 build：docker compose build --no-cache api → up
- TypeScript TS2345: $on('beforeExit', ...) 類型錯誤：
  - 可移除 beforeExit 勾子，改用 onModuleDestroy 斷線；或升級/對齊 Prisma 版本與型別

## 5) 目前進度

基礎設施
- PostgreSQL、Redis、MinIO 已運行
- MinIO bucket 初始化程序完成（proofs）

後端 API
- NestJS 專案可啟動，Health 檢查通過
- Auth 登入測試成功（admin）
- Prisma Client 生成與運行流程已修正（避免 run 時被 volumes 覆蓋）

前端
- Next.js 服務框架已可啟動（待串接 API 與頁面）

## 6) 下一步計劃（建議順序）

A. 後端功能擴充（短期）
1) Users/Teachers/Students CRUD 基本 API
   - Admin 建立老師/學生、重設密碼（bcrypt）
   - Teachers/Students 基本檔案讀寫
2) Courses 與 Pricing
   - seed 一筆 English 1-on-1（25 分鐘、7 USD）
   - PricingService.resolve(teacherId, courseId) 支援全域預設與老師覆寫
3) Packages（加堂/扣堂/返堂 + Ledger）
   - Admin 加堂 API
   - 預約/取消時原子扣返堂
4) Availability + Booking
   - 老師維護每週 slot（weekday + time range）
   - 學生查可預約時間（避開已排 sessions，尊重 capacity）
   - 建立預約：扣堂 → 建 session/attendee → 發通知（先記 log）
5) Sessions + Storage
   - 產生簽名 URL（PUT）上傳 screenshot 至 MinIO
   - 回報閉環：teacher notes、student goal、tryComplete 邏輯
6) Notifications
   - 簡易 Email 發送器（可用 console transport）
   - BullMQ job：課前 24h/1h、課後 10 分鐘提醒

B. 月結與報表（中期）
- Payouts：聚合上月已完成課堂，生成 breakdown（draft → confirmed → paid）
- Reports：儀表板 API（預約數、完成率、取消率、技術取消比例、收入與分潤）

C. 前端（並行推進）
- 基本頁面
  - /login
  - /admin：使用者管理、加堂、月結
  - /teacher：我的時段、我的課表、回報與上傳 proof
  - /student：我的堂數、預約、課後填寫
- 用 React Query 管理請求與快取
- RBAC 導航與保護路由

## 7) 任務分解與驗收要點

- Availability
  - API：CRUD、校驗 weekday/time、避免重疊
  - 測試：建立多個 slot、跨天/邊界測試
- Booking
  - API：查空檔（按老師/日期範圍），建立/取消
  - 規則：衝突檢查、capacity、扣/返堂
- Sessions
  - API：proof 簽名 URL、教師/學生回報、完成檢查
  - 檔案：MinIO 私有存取，GET 也用簽名 URL
- Notifications
  - 任務：建立 BullMQ queue、cron/延遲任務
  - 驗收：預約/取消/提醒產生對應任務（先記 log）

## 8) 開發注意事項

- Prisma
  - 使用預設 generator 輸出，import from '@prisma/client'
  - schema 與 DB 同步時，先 db pull 或調整 migrate 策略
- Docker
  - api 服務不要掛載整個 /app，避免覆蓋 node_modules
  - 建議在 Dockerfile build 階段 npm ci 與 prisma generate
- 安全
  - JWT 秘鑰放 .env（compose 目前以環境變數傳入）
  - 啟用 CORS 白名單、rate limit（後續）
- 日誌
  - 使用 Nest Logger 或 Pino，為請求加 requestId
