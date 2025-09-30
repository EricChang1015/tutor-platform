#!/bin/bash

echo "🎓 啟動家教平台後端系統"
echo "=========================="

# 檢查 Docker 是否運行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未運行，請先啟動 Docker"
    exit 1
fi

# 建立資料目錄
echo "📁 建立資料目錄..."
mkdir -p data/postgres
mkdir -p data/minio

# 啟動服務
echo "🚀 啟動 Docker 服務..."
docker-compose up -d

# 等待服務啟動
echo "⏳ 等待服務啟動..."
sleep 10

# 檢查服務狀態
echo "📊 檢查服務狀態..."
docker-compose ps

echo ""
echo "✅ 系統啟動完成！"
echo ""
echo "🌐 服務端點："
echo "  - API 服務: http://localhost:3001"
echo "  - API 文檔: http://localhost:3001/api-docs"
echo "  - 測試工具: http://localhost:3001/testAPI.html"
echo "  - MailHog: http://localhost:8025"
echo "  - MinIO Console: http://localhost:9001"
echo ""
echo "🔑 預設帳號："
echo "  - 管理員: admin@example.com / password"
echo "  - 教師: teacher1@example.com / password"
echo "  - 學生: student1@example.com / password"
echo ""
echo "📝 查看日誌: docker-compose logs -f api"
echo "🛑 停止服務: docker-compose down"
