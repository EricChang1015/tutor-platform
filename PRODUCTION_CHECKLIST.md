# 🚀 生產環境部署檢查清單

## 📋 部署前檢查

### 🔐 安全性檢查

#### 環境變數和密鑰
- [ ] 更改所有預設密碼
  - [ ] 數據庫密碼 (`POSTGRES_PASSWORD`)
  - [ ] Redis 密碼（如需要）
  - [ ] MinIO 管理員密碼 (`MINIO_ROOT_PASSWORD`)
  - [ ] JWT 密鑰 (`JWT_SECRET`) - 使用強隨機字符串
  - [ ] 管理員種子密碼 (`ADMIN_SEED_PASSWORD`)

#### API 安全
- [ ] 啟用 HTTPS/TLS
- [ ] 配置 CORS 白名單
- [ ] 實施 Rate Limiting
- [ ] 添加 API 版本控制
- [ ] 設置請求大小限制
- [ ] 配置安全 Headers

#### 數據庫安全
- [ ] 限制數據庫網絡訪問
- [ ] 啟用數據庫 SSL/TLS
- [ ] 定期備份策略
- [ ] 設置數據庫用戶權限最小化

#### 檔案存儲安全
- [ ] MinIO 訪問控制
- [ ] 檔案類型白名單
- [ ] 檔案大小限制
- [ ] 病毒掃描（可選）

### ⚡ 性能優化

#### 後端優化
- [ ] 啟用 API 響應壓縮
- [ ] 配置數據庫連接池
- [ ] 實施 Redis 快取策略
- [ ] 優化數據庫查詢和索引
- [ ] 配置 API 快取 Headers

#### 前端優化
- [ ] 啟用生產模式構建
- [ ] 配置 CDN（可選）
- [ ] 實施靜態資源快取
- [ ] 優化圖片和資源大小
- [ ] 啟用 Gzip 壓縮

#### 數據庫優化
- [ ] 配置適當的數據庫參數
- [ ] 設置連接池大小
- [ ] 配置查詢超時
- [ ] 實施數據庫監控

### 📊 監控和日誌

#### 應用監控
- [ ] 配置健康檢查端點
- [ ] 設置應用性能監控 (APM)
- [ ] 配置錯誤追蹤
- [ ] 實施業務指標監控

#### 系統監控
- [ ] CPU、記憶體、磁盤監控
- [ ] 網絡流量監控
- [ ] 容器資源監控
- [ ] 數據庫性能監控

#### 日誌管理
- [ ] 集中化日誌收集
- [ ] 日誌輪轉和保留策略
- [ ] 敏感信息過濾
- [ ] 日誌分析和告警

### 🔄 備份和災難恢復

#### 數據備份
- [ ] 自動化數據庫備份
- [ ] 檔案存儲備份
- [ ] 備份驗證和測試
- [ ] 異地備份存儲

#### 災難恢復
- [ ] 恢復程序文檔
- [ ] 恢復時間目標 (RTO)
- [ ] 恢復點目標 (RPO)
- [ ] 定期災難恢復演練

## 🛠 生產環境配置建議

### Docker Compose 生產配置

```yaml
# docker-compose.prod.yml
version: "3.9"

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal
    # 不暴露端口到外部

  redis:
    image: redis:7-alpine
    restart: always
    command: ["redis-server", "--requirepass", "${REDIS_PASSWORD}"]
    volumes:
      - redis_data:/data
    networks:
      - internal

  api:
    build: ./api
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    networks:
      - internal
      - web

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    networks:
      - web

networks:
  internal:
    driver: bridge
  web:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

### 環境變數範例

```bash
# .env.production
NODE_ENV=production

# 數據庫配置
DB_USER=produser
DB_PASSWORD=your_secure_db_password_here
DB_NAME=tutorplatform_prod

# Redis 配置
REDIS_PASSWORD=your_secure_redis_password_here

# JWT 配置
JWT_SECRET=your_very_long_and_secure_jwt_secret_here

# MinIO 配置
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your_secure_minio_password_here

# 郵件配置
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password

# 管理員帳號
ADMIN_SEED_EMAIL=admin@yourdomain.com
ADMIN_SEED_PASSWORD=your_secure_admin_password_here
```

### Nginx 配置範例

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:3001;
    }

    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # 安全 Headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # API 代理
        location /api/ {
            proxy_pass http://api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 前端靜態文件
        location / {
            root /var/www/html;
            try_files $uri $uri/ /index.html;
        }
    }
}
```

## 🚦 部署步驟

1. **準備生產服務器**
   - 安裝 Docker 和 Docker Compose
   - 配置防火牆規則
   - 設置 SSL 證書

2. **配置環境**
   - 複製生產環境配置文件
   - 設置環境變數
   - 配置域名和 DNS

3. **部署應用**
   ```bash
   # 構建和啟動服務
   docker-compose -f docker-compose.prod.yml up -d --build
   
   # 檢查服務狀態
   docker-compose -f docker-compose.prod.yml ps
   
   # 查看日誌
   docker-compose -f docker-compose.prod.yml logs
   ```

4. **驗證部署**
   - 運行健康檢查
   - 執行端到端測試
   - 驗證所有功能正常

5. **設置監控**
   - 配置監控工具
   - 設置告警規則
   - 測試備份和恢復

## 📈 性能基準

### 預期性能指標
- API 響應時間：< 200ms (95th percentile)
- 數據庫查詢時間：< 100ms (平均)
- 頁面載入時間：< 3 秒
- 系統可用性：> 99.9%

### 容量規劃
- 併發用戶：100-500 用戶
- 數據庫連接：20-50 連接
- 記憶體使用：< 2GB
- CPU 使用：< 70%

## 🔍 故障排除

### 常見問題
1. **數據庫連接失敗**
   - 檢查數據庫服務狀態
   - 驗證連接字符串
   - 檢查網絡連接

2. **API 響應緩慢**
   - 檢查數據庫查詢性能
   - 監控系統資源使用
   - 檢查網絡延遲

3. **檔案上傳失敗**
   - 檢查 MinIO 服務狀態
   - 驗證存儲空間
   - 檢查權限設置

### 緊急聯絡
- 系統管理員：[聯絡信息]
- 開發團隊：[聯絡信息]
- 基礎設施團隊：[聯絡信息]
