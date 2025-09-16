#!/bin/bash

# 🚀 Tutor Platform 生產環境部署腳本

set -e  # 遇到錯誤立即退出

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"
LOG_FILE="./deploy.log"

# 函數定義
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

# 檢查先決條件
check_prerequisites() {
    log "檢查部署先決條件..."
    
    # 檢查 Docker
    if ! command -v docker &> /dev/null; then
        error "Docker 未安裝，請先安裝 Docker"
    fi
    
    # 檢查 Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose 未安裝，請先安裝 Docker Compose"
    fi
    
    # 檢查配置文件
    if [ ! -f "$COMPOSE_FILE" ]; then
        error "找不到 $COMPOSE_FILE 文件"
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        warning "找不到 $ENV_FILE 文件，請從 .env.production.example 複製並配置"
        error "請先創建 $ENV_FILE 文件"
    fi
    
    success "先決條件檢查通過"
}

# 安全檢查
security_check() {
    log "執行安全檢查..."
    
    # 檢查環境變數文件權限
    if [ -f "$ENV_FILE" ]; then
        chmod 600 "$ENV_FILE"
        success "設置環境變數文件權限為 600"
    fi
    
    # 檢查是否使用預設密碼
    if grep -q "your_.*_password_here" "$ENV_FILE" 2>/dev/null; then
        error "檢測到預設密碼，請更改所有密碼後再部署"
    fi
    
    # 檢查 JWT 密鑰長度
    JWT_SECRET=$(grep "JWT_SECRET=" "$ENV_FILE" | cut -d'=' -f2)
    if [ ${#JWT_SECRET} -lt 32 ]; then
        error "JWT_SECRET 長度不足 32 字符，請使用更強的密鑰"
    fi
    
    success "安全檢查通過"
}

# 創建備份
create_backup() {
    log "創建數據備份..."
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    
    # 如果服務正在運行，備份數據庫
    if docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        log "備份數據庫..."
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U produser tutorplatform_prod > "$BACKUP_DIR/${BACKUP_NAME}_database.sql"
        success "數據庫備份完成: $BACKUP_DIR/${BACKUP_NAME}_database.sql"
    fi
    
    # 備份 MinIO 數據（如果存在）
    if [ -d "./data/minio" ]; then
        log "備份檔案存儲..."
        tar -czf "$BACKUP_DIR/${BACKUP_NAME}_minio.tar.gz" -C ./data minio
        success "檔案存儲備份完成: $BACKUP_DIR/${BACKUP_NAME}_minio.tar.gz"
    fi
}

# 構建和部署
deploy() {
    log "開始部署應用..."
    
    # 拉取最新映像
    log "拉取最新映像..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
    
    # 構建應用映像
    log "構建應用映像..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
    
    # 啟動服務
    log "啟動服務..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    success "應用部署完成"
}

# 健康檢查
health_check() {
    log "執行健康檢查..."
    
    # 等待服務啟動
    sleep 30
    
    # 檢查服務狀態
    log "檢查服務狀態..."
    docker-compose -f "$COMPOSE_FILE" ps
    
    # 檢查 API 健康
    log "檢查 API 健康狀態..."
    for i in {1..10}; do
        if curl -f http://localhost/api/health &>/dev/null; then
            success "API 健康檢查通過"
            break
        fi
        if [ $i -eq 10 ]; then
            error "API 健康檢查失敗"
        fi
        log "等待 API 啟動... ($i/10)"
        sleep 10
    done
    
    # 檢查前端
    log "檢查前端狀態..."
    if curl -f http://localhost/ &>/dev/null; then
        success "前端健康檢查通過"
    else
        warning "前端健康檢查失敗，請檢查服務狀態"
    fi
}

# 運行測試
run_tests() {
    log "運行端到端測試..."
    
    if [ -f "./e2e-test.sh" ]; then
        chmod +x ./e2e-test.sh
        if ./e2e-test.sh; then
            success "端到端測試通過"
        else
            warning "端到端測試失敗，請檢查應用狀態"
        fi
    else
        warning "找不到測試腳本，跳過測試"
    fi
}

# 顯示部署信息
show_deployment_info() {
    log "部署完成！"
    echo
    echo -e "${GREEN}🎉 Tutor Platform 已成功部署到生產環境${NC}"
    echo
    echo "服務訪問地址："
    echo "  • 前端應用: http://localhost/"
    echo "  • API 服務: http://localhost/api/"
    echo "  • 健康檢查: http://localhost/api/health"
    echo
    echo "管理工具："
    echo "  • 查看服務狀態: docker-compose -f $COMPOSE_FILE ps"
    echo "  • 查看日誌: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  • 停止服務: docker-compose -f $COMPOSE_FILE down"
    echo
    echo "備份位置: $BACKUP_DIR"
    echo "部署日誌: $LOG_FILE"
    echo
    echo -e "${YELLOW}請確保：${NC}"
    echo "  1. 配置域名和 SSL 證書"
    echo "  2. 設置防火牆規則"
    echo "  3. 配置監控和告警"
    echo "  4. 定期備份數據"
}

# 清理函數
cleanup() {
    log "清理臨時文件..."
    # 清理 Docker 未使用的映像
    docker image prune -f
    success "清理完成"
}

# 主函數
main() {
    echo -e "${BLUE}"
    echo "🚀 Tutor Platform 生產環境部署"
    echo "=================================="
    echo -e "${NC}"
    
    # 創建日誌文件
    touch "$LOG_FILE"
    
    # 執行部署步驟
    check_prerequisites
    security_check
    create_backup
    deploy
    health_check
    run_tests
    cleanup
    show_deployment_info
}

# 處理中斷信號
trap 'error "部署被中斷"' INT TERM

# 解析命令行參數
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "backup")
        create_backup
        ;;
    "health")
        health_check
        ;;
    "test")
        run_tests
        ;;
    "logs")
        docker-compose -f "$COMPOSE_FILE" logs -f
        ;;
    "stop")
        log "停止服務..."
        docker-compose -f "$COMPOSE_FILE" down
        success "服務已停止"
        ;;
    "restart")
        log "重啟服務..."
        docker-compose -f "$COMPOSE_FILE" restart
        success "服務已重啟"
        ;;
    *)
        echo "用法: $0 [deploy|backup|health|test|logs|stop|restart]"
        echo
        echo "命令說明："
        echo "  deploy  - 完整部署（預設）"
        echo "  backup  - 僅創建備份"
        echo "  health  - 僅執行健康檢查"
        echo "  test    - 僅運行測試"
        echo "  logs    - 查看服務日誌"
        echo "  stop    - 停止所有服務"
        echo "  restart - 重啟所有服務"
        exit 1
        ;;
esac
