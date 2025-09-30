# 🎓 Tutor Platform - 項目總結
## 📋 項目概述
Tutor Platform 是一個完整的線上家教平台後端系統，提供從用戶管理到課程結算的全套功能。

## 🛠 技術架構
### 後端技術棧
- **框架**: NestJS (Node.js)
- **資料庫**: PostgreSQL
- **ORM**: Prisma
- **認證**: JWT
- **檔案存儲**: MinIO (S3 相容)
- **郵件服務**: Nodemailer + MailHog
- **容器化**: Docker + Docker Compose

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

### 預設帳號
- **管理員**: admin@example.com / admin123
- **老師**: teacher1@example.com / teacher123
- **學生**: student1@example.com / student123


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
