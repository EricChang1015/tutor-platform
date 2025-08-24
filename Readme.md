1) 線上課程系統需求（MVP → 可擴展）

核心用戶與角色
- Admin：總覽、建立老師/學生、手動配課與加堂、月結審核。
- Teacher：設定可授課時段、管理課表、上課連結、課後上傳證明與教師回報、查看月結。
- Student：購買或持有課程包、選老師與時段預約、課後填學習目標。

預約與上課
- 老師維護可授課時段（每週重複 slot，支持例外）。
- 學生查看老師空檔，預約固定時長 25 分鐘課程。
- 會議連結 MVP：由老師提供（Zoom 個人會議室或每次填寫）。
- 自動通知：預約成功、課前提醒（24h/1h）、課後提醒（老師與學生各自要填資料）。
- 自動審批：預約成功即 confirmed（若衝突或超容量才擋）。

課後閉環與證明
- 老師必須：上傳 screenshot 証明 + 填教師備註（teacher notes）。
- 學生必須：填學習目標/建議（student goal）。
- 三者齊備才算 Completed，否則維持 Confirmed，不進結算。

取消/補課
- 學生於課前 ≥24h 取消：返還 1 堂。
- <24h 取消：預設扣堂。
- 技術問題（network/平台故障）取消：返還 1 堂且加發補償 1 堂（credit）。
- 老師取消：記錄統計，規則後續擴展（先不自動補償，交由 Admin 決策或比照技術問題）。

課程與計費
- 目前唯一課程 English 1-on-1，25 分鐘，每堂 7 美元（global 預設）。
- 抽成規則：平台抽成% 有全域預設，可被單一老師覆寫。
- 套裝課（package）：Admin 手動加堂（先不接金流），remaining_sessions 扣/返。
- Groups：先不開，資料模型預留 capacity。

結算與報表
- 月結：聚合上月已完成的課堂，按 pricing rule 計算老師應得與平台分潤，生成 payout。
- Admin 報表：預約數、完成率、取消率、技術取消比例、收入與分潤。
- Teacher 報表：當月課時與估算收入。
- Student：剩餘堂數、已預約與歷史課程。

通知渠道
- MVP：Email 必備，可選 SMS/WhatsApp。
- WeChat：後續導入（建議企業微信 WeCom 機器人或服務號模板消息）。

權限與隱私
- RBAC：Admin/Teacher/Student 路由與資料可見性隔離。
- 檔案：上傳至 S3/MinIO，私有存取，僅 Admin/對應老師可見。

2) 前後端技術路線與模組框架

整體架構
- 前端：Next.js（React），SSR/CSR混用，角色式儀表板。
- 後端：NestJS（TypeScript），模組化設計，Prisma + PostgreSQL。
- 快取與排程：Redis + BullMQ（提醒、月結批次）。
- 儲存：MinIO（S3 相容），簽名 URL 直傳。
- 部署：Docker Compose（你已有 DB/Redis/MinIO，可直接掛上）。

後端技術選型
- 框架：NestJS
- ORM：Prisma（強型別、快開發）
- 認證：JWT（Access token；可後續加 Refresh）
- 佇列：BullMQ + Redis（通知與月結）
- 檔案：AWS SDK v3，Pre-signed PUT URL
- 驗證：class-validator + class-transformer
- 設定：@nestjs/config

後端模組藍圖
- AuthModule
  - JWT 登入/註冊（Admin 能創建老師/學生帳號）。
  - RoleGuard + 自訂裝飾器 @Roles() 控制路由。
- UsersModule
  - Admin 建立與管理使用者、重設密碼。
- TeachersModule
  - 讀/寫教師資料（顯示名稱、會議連結預設、簡介）。
- StudentsModule
  - 讀/寫學生資料（家長聯絡、偏好）。
- CoursesModule
  - 課程 CRUD（目前一種課，後續可擴）。
- PricingModule
  - Global 預設 + Teacher 覆寫；決策器服務 PricingService.resolve(teacherId, courseId)。
- PackagesModule
  - Admin 手動加堂、查詢剩餘堂數；扣堂/返堂原子操作；CreditLedger 補償紀錄。
- AvailabilityModule
  - 老師每週時段 CRUD；可擴設定黑名單日期與特例。
- BookingModule
  - 查可預約 25 分鐘時段（以 availability + 已有 sessions 避免衝突）。
  - 預約：扣堂 → 建 session/attendee → 發通知。
  - 取消：依規則返堂/補償。
- SessionsModule
  - 會議連結維護（meetingUrl）。
  - 上傳截圖：產生簽名 URL；上傳後回寫 SessionProof。
  - 回報閉環：teacher_notes、student_goal；tryComplete 檢查完成狀態。
  - 列表/日曆查詢（依角色、時間範圍）。
- StorageModule
  - S3/MinIO 封裝：簽名 URL、私有網址簽名（GET）。
- NotificationsModule
  - Email 發送器（可先 Stub 記 log）。
  - 排程 Job：課前 24h/1h 提醒、課後 10 分鐘提醒填寫回報。
- PayoutsModule
  - 月結產生：聚合上月已完成課堂、按 pricing 產出 breakdown，狀態流轉（draft → confirmed → paid）。
- ReportsModule（可後續）
  - 儀表板資料匯總 API。

前端技術選型
- 框架：Next.js 14（App Router）
- UI：任選（Ant Design、MUI、Tailwind），MVP 建議 AntD 提升 CRUD 效率。
- 認證：JWT 存於 HttpOnly Cookie 或 Bearer Token（MVP 可 Bearer）。
- 請求層：React Query（TanStack Query）管理快取與錯誤。
- 路由與頁面
  - /login
  - /admin：用戶管理、加堂、月結
  - /teacher：我的時段、我的課表、回報與上傳
  - /student：我的堂數、預約、課後填寫
  - 共用：/sessions/:id 詳情

數據流與契約
- 全部走 REST JSON（MVP），後續可加 Webhook 或 WebSocket。
- 檔案上傳：前端向 /storage/signed-url 取 PUT URL → 直傳 → 回填 /sessions/:id/proofs。

非功能性要求
- 日誌與追蹤：Pino 或 NestJS Logger；請求ID中介層。
- 錯誤處理：統一的 ExceptionFilter，回傳 { code, message, details }。
- 安全：CORS 白名單、速率限制（可加 @nestjs/throttler）、密碼加鹽哈希。
- 租戶/多語系：後續擴展；先設定使用者 timezone，時間顯示前端處理。

開始順序建議（後端 MVP）
- 第 1 步：AuthModule、UsersModule、Prisma 接上 DB。
- 第 2 步：CoursesModule（seed 一筆 English 1-on-1）、PricingModule（global 預設）。
- 第 3 步：PackagesModule（Admin 加堂、扣/返 API）。
- 第 4 步：AvailabilityModule（CRUD）+ BookingModule（查空檔、預約、取消）。
- 第 5 步：StorageModule（簽名 URL）+ SessionsModule（上傳 proof、回報閉環、完成）。
- 第 6 步：NotificationsModule（先記 log）+ PayoutsModule（產生月結的服務函式與 API）。