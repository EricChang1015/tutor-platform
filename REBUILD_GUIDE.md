# 🔧 Tutor Platform 重建指南

本指南提供完整的系統重建步驟，適用於新環境部署或災難恢復。

## 📋 前置需求

### 系統需求
- **作業系統**: Linux/macOS/Windows (支援 Docker)
- **Docker**: 版本 20.0+ 
- **Docker Compose**: 版本 2.0+
- **記憶體**: 最少 4GB RAM
- **硬碟空間**: 最少 10GB 可用空間
- **網路**: 需要網際網路連接下載映像

### 必要工具
```bash
# 檢查 Docker 安裝
docker --version
docker-compose --version

# 檢查 Git 安裝
git --version

# 檢查 curl 安裝 (用於測試)
curl --version
```

## 🚀 快速重建步驟

### 1. 獲取專案代碼
```bash
# 克隆專案 (如果是新環境)
git clone <repository-url> tutor-platform
cd tutor-platform

# 或者更新現有專案
git pull origin main
```

### 2. 環境配置
```bash
# 複製環境變數範例 (可選，Docker Compose 已包含預設值)
cp .env.example .env

# 編輯環境變數 (如需自訂)
nano .env
```

### 3. 啟動服務
```bash
# 停止並清理現有容器 (如果存在)
docker-compose down -v

# 重建並啟動所有服務
docker-compose up -d --build

# 檢查服務狀態
docker-compose ps
```

### 4. 驗證部署
```bash
# 檢查 API 健康狀態
curl -s http://localhost:3001/health

# 檢查前端服務 (可選)
curl -s -I http://localhost:3000/

# 運行完整測試套件
./test-api.sh
./e2e-test.sh
```

## 🗄️ 資料庫管理

### 資料庫初始化
系統會自動執行以下初始化步驟：

1. **結構初始化**: `db/create_db.sql` - 創建資料庫結構
2. **種子數據**: 透過 API 自動創建管理員帳號
3. **測試數據**: 透過測試腳本創建示範用戶

### 手動資料庫操作
```bash
# 連接到資料庫
docker-compose exec postgres psql -U app -d appdb

# 執行 SQL 檔案
docker-compose exec -T postgres psql -U app -d appdb < db/seed_data.sql

# 備份資料庫
docker-compose exec postgres pg_dump -U app appdb > backup.sql

# 恢復資料庫
docker-compose exec -T postgres psql -U app -d appdb < backup.sql
```

### 重置資料庫
```bash
# 完全重置資料庫
docker-compose down -v
docker volume rm tutor-platform_postgres_data
docker-compose up -d postgres
```

## 🔧 故障排除

### 常見問題

#### 1. 端口衝突
```bash
# 檢查端口使用情況
netstat -tulpn | grep :3001
netstat -tulpn | grep :5432

# 修改 docker-compose.yml 中的端口映射
# 例如：將 "3001:3001" 改為 "3002:3001"
```

#### 2. 容器啟動失敗
```bash
# 查看容器日誌
docker-compose logs api
docker-compose logs postgres
docker-compose logs web

# 重建特定服務
docker-compose build --no-cache api
docker-compose up -d api
```

#### 3. 資料庫連接問題
```bash
# 檢查資料庫健康狀態
docker-compose exec postgres pg_isready -U app -d appdb

# 檢查環境變數
docker-compose exec api printenv | grep DATABASE_URL

# 重啟資料庫服務
docker-compose restart postgres
```

#### 4. API 無法訪問
```bash
# 檢查 API 容器狀態
docker-compose ps api

# 檢查 API 日誌
docker-compose logs api --tail=50

# 測試內部連接
docker-compose exec api curl -s http://localhost:3001/health
```

### 性能優化

#### 資料庫優化
```sql
-- 連接到資料庫並執行
-- 分析表統計
ANALYZE;

-- 重建索引
REINDEX DATABASE appdb;

-- 檢查慢查詢
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### 容器資源限制
```yaml
# 在 docker-compose.yml 中添加資源限制
services:
  api:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
```

## 📊 監控和維護

### 健康檢查
```bash
# 系統健康檢查腳本
#!/bin/bash
echo "=== 系統健康檢查 ==="

# 檢查容器狀態
echo "容器狀態:"
docker-compose ps

# 檢查 API 健康
echo "API 健康狀態:"
curl -s http://localhost:3001/health | jq .

# 檢查資料庫連接
echo "資料庫連接:"
docker-compose exec -T postgres pg_isready -U app -d appdb

# 檢查磁碟空間
echo "磁碟使用情況:"
df -h

# 檢查記憶體使用
echo "記憶體使用情況:"
free -h
```

### 日誌管理
```bash
# 查看所有服務日誌
docker-compose logs

# 查看特定服務日誌
docker-compose logs api --tail=100 -f

# 清理日誌
docker-compose logs --no-log-prefix > /dev/null 2>&1
```

### 備份策略
```bash
#!/bin/bash
# 自動備份腳本
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

# 備份資料庫
docker-compose exec -T postgres pg_dump -U app appdb > "$BACKUP_DIR/db_backup_$DATE.sql"

# 備份檔案存儲
docker run --rm -v tutor-platform_minio_data:/data -v $PWD/$BACKUP_DIR:/backup alpine tar czf /backup/minio_backup_$DATE.tar.gz -C /data .

# 保留最近 7 天的備份
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "備份完成: $DATE"
```

## 🧪 測試驗證

### 完整測試套件
```bash
# 運行所有測試
echo "運行 API 測試..."
./test-api.sh

echo "運行端到端測試..."
./e2e-test.sh

echo "運行業務流程測試..."
./business-workflow-test.sh

echo "運行性能測試..."
./performance-test.sh
```

### 測試結果驗證
- ✅ API 測試: 所有端點正常響應
- ✅ E2E 測試: 17/17 測試通過
- ✅ 業務流程測試: 16/16 測試通過  
- ✅ 性能測試: 9/9 測試通過

## 📞 支援資訊

### 預設帳號
- **管理員**: admin@example.com / admin123
- **老師**: teacher1@example.com / teacher123
- **學生**: student1@example.com / student123

### 服務端口
- **API**: http://localhost:3001
- **前端**: http://localhost:3000
- **資料庫**: localhost:5432
- **MinIO Console**: http://localhost:9001
- **MailHog**: http://localhost:8025

### 重要檔案
- `docker-compose.yml`: 服務配置
- `api/src/`: 後端源碼
- `web/src/`: 前端源碼
- `db/`: 資料庫腳本
- `test-*.sh`: 測試腳本

---

**最後更新**: 2025-09-17  
**版本**: 1.0.0  
**維護者**: Tutor Platform Team
