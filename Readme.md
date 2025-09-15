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

- 前端：Svelte（Vite）
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
- ADMIN_SEED_EMAIL、ADMIN_SEED_PASSWORD（啟動時自動建立 admin 帳號）

- VITE_API_BASE（web 前端使用的 API Base）
## 4) 專案啟動

初次啟動
- 建議使用 Docker Compose（已提供 docker-compose.yml）
- api 映像會在 build 時執行 npm ci 與 prisma generate
- compose 僅掛載 src、prisma、.env，避免覆蓋 node_modules

指令
- 啟動
  - docker compose up -d --build
  - 僅啟動後端服務（無前端）：docker compose up -d postgres redis minio init-minio api
- 檢查 API
  - curl -s http://localhost:3001/health  → 應回傳 {"ok":true,...}
  - curl -s http://localhost:3001/        → "Hello World!"
- 登入測試（admin）
  - 先在 api/.env 設定 ADMIN_SEED_EMAIL、ADMIN_SEED_PASSWORD
  - 啟動後 API 會自動種子 admin 使用者（日誌會顯示 Seeded admin user 或 Admin already exists）
  - curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"email":"<ADMIN_SEED_EMAIL>","password":"<ADMIN_SEED_PASSWORD>"}'

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
- Auth 登入測試成功（JWT Bearer）
- Users
  - Admin 建立使用者（POST /users，Teacher/Student 會自動建立對應 profile）
  - 列表查詢（GET /users?role=&active=&q=）
  - 取得單一使用者（GET /users/:id）
  - 自己的資訊（GET /users/me）
  - Admin 重設密碼（POST /users/reset-password）
- Pricing（新）
  - 規則解析服務 PricingService.resolve(teacherId?, courseId, at?)
    - 邏輯：active、priority DESC、valid_from/valid_to 篩選；覆寫層級 teacher > course > global；price 與 commission 可分別被不同規則覆寫
  - API：GET /pricing/resolve?courseId=&teacherId=&at=
  - DTO 驗證：courseId 必填 UUID、teacherId/at 可選（ISO8601）
- 啟動時自動種子 Admin 使用者（以 ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD）

前端
- 前端（Svelte）模組已新增：瀏覽 http://localhost:3000；目前提供 Health 與 Login 測試頁，呼叫後端 API（VITE_API_BASE）。

## 6) 操作指南

修改密碼
- Admin 重設任一使用者密碼（已實作）
  - Endpoint: POST /users/reset-password
  - 權限：Admin
  - 範例：
    curl -s -X POST http://localhost:3001/users/reset-password \
      -H "Authorization: Bearer <ADMIN_TOKEN>" \
      -H "Content-Type: application/json" \
      -d '{"userId":"<USER_ID>","newPassword":"newpass123"}'
- 使用者自行變更密碼（規劃中）
  - 預計新增：POST /auth/change-password（需提供 oldPassword/newPassword，僅本人可操作）
  - 後續補上最小強度檢查及防止近期密碼重用

Pricing 查價
- 取得定價（僅 courseId）
  - GET /pricing/resolve?courseId=<COURSE_ID>
- 指定老師覆寫（可選）
  - GET /pricing/resolve?courseId=<COURSE_ID>&teacherId=<TEACHER_PROFILE_ID>
- 指定時間點（可選）
  - GET /pricing/resolve?courseId=<COURSE_ID>&at=2025-01-01T00:00:00Z
- 成功回應範例
  {
    "price_cents": 700,
    "commission_pct": 40,
    "sources": {
      "price": { "id": "<rule_id>", "scope": "global" | "course" | "teacher" },
      "commission": { "id": "<rule_id>", "scope": "global" | "course" | "teacher" }
    }
  }

## 7) 測試工具（test.html）

為方便快速測 API，提供一個前端單檔工具：
- 存放位置：api/testAPI.html（已提供）
- 功能：Login 並自動保存/附帶 Bearer Token、操作 /users 與 /pricing 常用端點、顯示回應 JSON 與對應 cURL
- 使用步驟：
  1) 以瀏覽器打開 api/testAPI.html
  2) 設定 API Base URL（預設 http://localhost:3001）
  3) 使用 admin 帳號登入（ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD）
  4) 之後的請求會自動帶入 Token，開始操作 /users、/pricing
- 若需擴充（Packages、Availability、Booking），可在同頁面新增面板
- 或直接瀏覽 http://localhost:3000 使用 Svelte 前端（提供 Health 與 Login 測試）

## 8) 驗收要點與測試

- Users
  - Admin 成功建立 teacher/student，檢查 DB 有對應 profile
  - 列表可依 role/active/q 篩選
  - Admin 可重設密碼；被重設帳號可成功登入
- Auth
  - JWT 正常攜帶於 Authorization: Bearer <token>
  - RBAC：Admin 才能呼叫 /users、/users/reset-password；所有已登入者可呼叫 /users/me
- Pricing
  - 僅有 global 規則時可得到預設價（如 700/40）
  - 老師層級規則可覆寫 price 或 commission
  - valid_from/valid_to 能正確控制生效時間；at 指定時間查驗

## 9) 下一步計劃（更新）

A. 後端功能擴充（短期）
- [已完成] Pricing
  - PricingService.resolve 與 GET /pricing/resolve
  - DTO 驗證修正（避免 ValidationPipe 擋下查詢）
- 進行中/下一步：Packages（加堂/扣堂/返堂 + Ledger）
  1) Admin 加堂 API（POST /packages）
  2) 查詢學生剩餘堂數（GET /students/:id/packages/summary）
  3) PackagesService.adjustSessions(studentId, delta, reason, sessionId?)：供 Booking/取消流程使用（transaction）
- 之後：Availability + Booking（MVP）
  - Availability CRUD（避免重疊）
  - Booking 建立預約（扣堂 → 建 session/attendee → confirmed）
  - 取消規則（≥24h 返堂、<24h 扣堂、技術取消返 1 補 1）

B. 月結與報表（中期）
- Payouts：聚合上月已完成課堂，生成 breakdown（draft → confirmed → paid）
- Reports：儀表板 API（預約數、完成率、取消率、技術取消比例、收入與分潤）

C. 前端（並行推進）
- 技術選擇：Svelte（Vite）
- 基本頁面
  - /login
  - /admin：使用者管理、加堂、月結
  - /teacher：我的時段、我的課表、回報與上傳 proof
  - /student：我的堂數、預約、課後填寫
- 與後端整合
  - 使用 JWT Bearer 向 NestJS API 認證（前端以 localStorage/Session 儲存 Token）
  - 設定 CORS（允許前端來源）；或以前端反向代理至同網域
  - 封裝 API Client（錯誤處理、重試、401 重新導向登入）
- RBAC 導航與保護路由

## 10) 開發注意事項

- Prisma
  - 使用預設 generator 輸出，import from '@prisma/client'
  - schema 與 DB 同步時，先 db pull 或調整 migrate 策略
- Docker
  - api 服務不要掛載整個 /app，避免覆蓋 node_modules
  - 建議在 Dockerfile build 階段 npm ci 與 prisma generate
- 前端（Servlet）整合注意
  - 與現有 NestJS API 不衝突：採 REST 解耦、可獨立部署
  - 若跨網域：需設定 CORS，並以 Authorization: Bearer <token> 攜帶 JWT
  - 不建議跨域 Cookie Session；改用前端儲存 JWT（localStorage/Session）
  - 檔案上傳：由 API 取得 MinIO 簽名 URL，再由前端直傳
- 安全
  - JWT 秘鑰放 .env（compose 目前以環境變數傳入）
  - 啟用 CORS 白名單、rate limit（後續）
  - 管理好 ADMIN_SEED_PASSWORD（僅在本地方便測試，正式環境改用安全密碼）
- 日誌
  - 使用 Nest Logger 或 Pino，為請求加 requestId
