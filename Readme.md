# 🎓 Tutor Platform - 項目總結
## 📋 項目概述
Tutor Platform 是一個完整的線上家教平台後端系統，提供從用戶管理到課程結算的全套功能。

## Agent 系統提示（System Prompt）
請嚴格按照以下區塊輸出，方便複製執行：
1) .todo 計劃草案
- 修改目的：
- 影響範圍：
- 風險/回滾：
- 測試項目：

2) 變更清單與代碼差異摘要
- 新增/修改檔案列表（路徑 + 一句話說明）
- DB migration（若有）與 schema 要點
- 組態變更（.env.example / docker）

3) 執行指令
- 依序列出可直接貼上的命令（含 docker compose、prisma migrate、seed、測試）

4) 測試步驟與預期結果
- 列出用 curl 或 httpie 的請求與預期回應碼/關鍵欄位
- 若需要手動在瀏覽器操作 testAPI.html，請指明 URL

5) 文件更新片段
- Readme.md 需新增/修改的段落（提供可貼上的 Markdown）
- docs/openAPI.yaml 或其他 docs 更新（如需，提供 diff 或完整替換片段）

6) Git 提交訊息
- 提供一則中文 commit message（含動機/變更/測試）
- 分支名稱建議

7) 若失敗時的回推與暫停策略
- 偵錯清單（連線/環境變數/憑證/匯入錯誤）
- 連續 3 次失敗的暫停總結格式與建議選項（A/B/C）

四、第一個任務範例（可直接丟給 Agent）
任務名稱：初始化後端骨架與環境
目標：
- 建立 NestJS API 專案骨架（apps/api）
- 串接 Prisma，建立基本 User/Role schema 與 seed
- 設定 Docker Compose（Postgres、MinIO、MailHog、API），採 host network 或明確 ports
- 建立 /auth/login, /auth/refresh, /auth/me 的最基本流程（硬編碼 demo 帳號或 seed）
- 啟動後能用 docs/accounts.md 的預設帳號登入

範圍與限制：
- 僅建立最小可跑 MVP 骨架
- 前端與 ui-design.html 原則不動

測試方式：
- docker compose up -d 後，POST /auth/login 能取得 JWT
- GET /auth/me 回傳使用者資訊

請先輸出：
- .todo 草案
- 檔案清單與要點
- 指令腳本
- 測試步驟
- Readme.md 更新片段
- commit 訊息

## 🗂 代碼結構

```
.
├── docs/                                # 規格與文件
│   ├── Requirement.md                   # 需求說明（MVP → 可擴展）
│   ├── accounts.md                      # 預設帳號與連線資訊
│   ├── openAPI.yaml                     # REST API 規格（OpenAPI 3.0）
│   └── ui-design.html                   # 前端 Demo（純瀏覽器示範，不含後端）
│
├── docker/                              # 容器化設定（服務拆分）
│   ├── docker-compose.yml               # 一鍵啟動：api + db + minio + mailhog
│   ├── api.Dockerfile                   # NestJS API 映像
│   └── minio/                           # MinIO 初始化腳本（選用）
│       ├── buckets.sh                   # 建立 public/private bucket
│       └── policy.json                  # 預設 bucket policy
│
├── prisma/                              # Prisma ORM
│   ├── schema.prisma                    # 資料模型（User/Teacher/Booking/...）
│   ├── migrations/                      # 資料庫遷移
│   └── seed.ts                          # 開發種子資料（admin/teacher/student）
│
├── apps/
│   ├── api/                             # 後端 API（NestJS）
│   │   ├── src/
│   │   │   ├── main.ts                  # 入口（NestFactory、CORS、Swagger）
│   │   │   ├── app.module.ts
│   │   │   ├── common/                  # 共用：filters/guards/interceptors/utils
│   │   │   │   ├── filters/
│   │   │   │   │   └── http-exception.filter.ts
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   └── roles.guard.ts
│   │   │   │   ├── interceptors/
│   │   │   │   └── dtos/                 # 共用 DTO
│   │   │   ├── auth/                    # 登入/刷新/登出/我
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── strategies/
│   │   │   │       └── jwt.strategy.ts
│   │   │   ├── users/                   # Users 公開資訊與個資更新
│   │   │   ├── teachers/                # 老師清單/詳情/相簿上傳
│   │   │   ├── availability/            # 規則/例外/可預約切片
│   │   │   ├── favorites/               # 收藏
│   │   │   ├── library/                 # 教材資料夾樹
│   │   │   ├── materials/               # 教材 CRUD（multipart）
│   │   │   ├── uploads/                 # MinIO 預簽 URL
│   │   │   ├── timeslots/               # 搜尋跨師時段
│   │   │   ├── holds/                   # 預約暫存鎖
│   │   │   ├── bookings/                # 建立/查詢/改期/取消/留言/.ics/確認
│   │   │   ├── post-class/              # 課後回報/學員目標
│   │   │   ├── purchases/               # 卡片列表/啟動/延長
│   │   │   ├── consumptions/            # 扣卡紀錄
│   │   │   ├── cancellations/           # 取消政策預覽
│   │   │   ├── reviews/                 # 評價（新增/查詢/審核）
│   │   │   ├── notifications/           # 通知列表/SSE/已讀
│   │   │   ├── assignments/             # 系統指派老師
│   │   │   ├── reports/                 # 報表（Admin/Teacher）
│   │   │   ├── admin/                   # 管理端（教師/學生/授予卡片/結算/統計）
│   │   │   ├── meta/                    # Meta 資料（域/地區/排序選項）
│   │   │   └── config/                  # 組態（環境變數、Mail、MinIO）
│   │   │       ├── env.ts
│   │   │       ├── mailer.ts
│   │   │       └── minio.ts
│   │   ├── test/                        # e2e/單元測試
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                             # 前端（SvelteKit，未來正式前端）
│       ├── src/
│       │   ├── routes/
│       │   ├── lib/
│       │   └── stores/
│       ├── static/
│       ├── package.json
│       └── svelte.config.js
│
├── api/                                  # API 測試工具（靜態）
│   └── testAPI.html                      # Web 端點測試面板（Readme 已提及）
│
├── .env                          # 環境變數範本（DB/MINIO/JWT/MailHog）
└── Readme.md
```

## 🛠 技術架構
### 後端技術棧
- **框架**: NestJS (Node.js)
- **資料庫**: PostgreSQL
- **ORM**: Prisma
- **認證**: JWT
- **檔案存儲**: MinIO (S3 相容)
- **郵件服務**: Nodemailer + MailHog
- **容器化**: Docker + Docker Compose (ps: network使用host即可,省去port mapping)

### 資料庫設計
- 完整的關聯式資料庫設計
- 用戶、課程、預約、會議、結算等核心表
- 適當的索引和約束
- 支援軟刪除和時間戳

### API 設計
- RESTful API 設計
- 統一的錯誤處理
- 請求驗證和授權
- 完整的 API 文檔

## 🧪 測試工具
TDB
### API 測試介面
- 完整的 Web 測試工具 (`api/testAPI.html`)
- 所有 API 端點的測試功能
- 實時狀態監控
- 用戶友好的介面設計

### 開發環境
- Docker Compose 一鍵啟動
- MailHog 郵件測試
- MinIO 檔案管理介面
- 熱重載開發環境

## 📊 項目統計

### 代碼結構
TBD

## 🚀 部署說明

### 開發環境啟動
```bash
# 啟動所有服務
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看 API 日誌
docker-compose logs api
```

### 服務端口
- **API 服務**: http://localhost:3001
- **API 測試工具**: http://localhost:3001/testAPI.html
- **MailHog Web UI**: http://localhost:8025
- **MinIO Console**: http://localhost:9001
- **PostgreSQL**: localhost:5432

## 🎨 前端應用

### 技術架構
- **框架**: Svelte + SvelteKit
- **樣式**: Tailwind CSS
- **路由**: svelte-spa-router
- **狀態管理**: Svelte stores
- **構建工具**: Vite

### 前端特色
- **現代化設計**: 響應式設計，支援桌面和移動端
- **完整的權限控制**: 基於角色的頁面訪問控制
- **實時通知系統**: 優雅的通知提示
- **專業的 UI 組件**: 可重用的組件庫
- **多角色儀表板**: 管理員、老師、學生專用介面
- **多語言支持**: 完整的國際化系統，支援中文和英文
