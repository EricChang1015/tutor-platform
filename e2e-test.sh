#!/bin/bash

# Tutor Platform 端到端測試腳本
# 測試完整的業務流程：用戶註冊 -> 課程創建 -> 預約 -> 上課 -> 結算

API_BASE="http://localhost:3001"
WEB_BASE="http://localhost:3000"

echo "🎓 Tutor Platform 端到端測試"
echo "================================"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 測試結果統計
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 測試函數
test_step() {
    local description=$1
    local command=$2
    local expected_pattern=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}測試步驟 $TOTAL_TESTS: $description${NC}"
    
    # 執行命令
    response=$(eval "$command" 2>&1)
    
    # 檢查結果
    if echo "$response" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✅ 通過${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ 失敗${NC}"
        echo "響應: $response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# API 請求函數
api_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    if [ -n "$token" ]; then
        if [ -n "$data" ]; then
            curl -s -X $method "$API_BASE$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data"
        else
            curl -s -X $method "$API_BASE$endpoint" \
                -H "Authorization: Bearer $token"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -X $method "$API_BASE$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data"
        else
            curl -s -X $method "$API_BASE$endpoint"
        fi
    fi
}

echo -e "\n${YELLOW}=== 階段 1: 系統健康檢查 ===${NC}"

# 1. 檢查後端服務
test_step "後端 API 健康檢查" \
    "curl -s http://localhost:3001/health" \
    '"ok":true'

# 2. 檢查前端服務
test_step "前端服務健康檢查" \
    "curl -s -I http://localhost:3000/ | head -1" \
    "200 OK"

# 3. 檢查數據庫連接
test_step "數據庫連接檢查" \
    "docker-compose exec -T postgres pg_isready -U app -d appdb" \
    "accepting connections"

echo -e "\n${YELLOW}=== 階段 2: 用戶認證流程 ===${NC}"

# 4. 管理員登入
ADMIN_TOKEN=""
admin_response=$(api_request "POST" "/auth/login" '{"email":"admin@example.com","password":"admin123"}')
if echo "$admin_response" | grep -q "access_token"; then
    ADMIN_TOKEN=$(echo "$admin_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ 管理員登入成功${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 管理員登入失敗${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 5. 老師登入
TEACHER_TOKEN=""
teacher_response=$(api_request "POST" "/auth/login" '{"email":"teacher1@example.com","password":"teacher123"}')
if echo "$teacher_response" | grep -q "access_token"; then
    TEACHER_TOKEN=$(echo "$teacher_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ 老師登入成功${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 老師登入失敗${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 6. 學生登入
STUDENT_TOKEN=""
student_response=$(api_request "POST" "/auth/login" '{"email":"student1@example.com","password":"student123"}')
if echo "$student_response" | grep -q "access_token"; then
    STUDENT_TOKEN=$(echo "$student_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ 學生登入成功${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 學生登入失敗${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}=== 階段 3: 課程管理流程 ===${NC}"

# 7. 創建課程
COURSE_ID=""
course_response=$(api_request "POST" "/courses" '{"title":"E2E Test Course","description":"端到端測試課程","type":"one_on_one","duration_min":25,"default_price_cents":700}' "$TEACHER_TOKEN")
if echo "$course_response" | grep -q '"id"'; then
    COURSE_ID=$(echo "$course_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✅ 課程創建成功 (ID: $COURSE_ID)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 課程創建失敗${NC}"
    echo "響應: $course_response"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 8. 獲取課程列表
test_step "獲取課程列表" \
    "api_request 'GET' '/courses' '' '$STUDENT_TOKEN'" \
    '"title"'

# 9. 檢查定價規則
if [ -n "$COURSE_ID" ]; then
    test_step "檢查課程定價" \
        "api_request 'GET' '/pricing/resolve?courseId=$COURSE_ID' '' '$ADMIN_TOKEN'" \
        '"price_cents"'
fi

echo -e "\n${YELLOW}=== 階段 4: 課程包管理 ===${NC}"

# 10. 創建課程包
STUDENT_PROFILE_ID="a64c4e71-5255-4865-b11b-67aae4e584ef"
if [ -n "$COURSE_ID" ]; then
    test_step "創建課程包" \
        "api_request 'POST' '/packages' '{\"studentId\":\"$STUDENT_PROFILE_ID\",\"courseId\":\"$COURSE_ID\",\"totalSessions\":10,\"notes\":\"E2E測試課程包\"}' '$ADMIN_TOKEN'" \
        '"id"'
fi

# 11. 檢查學生課程包摘要
test_step "檢查學生課程包摘要" \
    "api_request 'GET' '/students/$STUDENT_PROFILE_ID/packages/summary' '' '$ADMIN_TOKEN'" \
    '"totalAvailable"'

echo -e "\n${YELLOW}=== 階段 5: 可用時段管理 ===${NC}"

# 12. 創建可用時段（使用週二避免衝突）
test_step "創建老師可用時段" \
    "api_request 'POST' '/availability' '{\"weekday\":2,\"start_time\":\"14:00\",\"end_time\":\"16:00\",\"capacity\":3}' '$TEACHER_TOKEN'" \
    '"id"'

# 13. 獲取可用時段
test_step "獲取老師可用時段" \
    "api_request 'GET' '/availability/my-slots' '' '$TEACHER_TOKEN'" \
    '"weekday"'

echo -e "\n${YELLOW}=== 階段 6: 檔案存儲測試 ===${NC}"

# 14. 獲取檔案上傳 URL
test_step "獲取檔案上傳 URL" \
    "api_request 'POST' '/storage/upload-url' '{\"filename\":\"test.png\",\"file_type\":\"image\",\"content_type\":\"image/png\",\"file_size\":1024}' '$TEACHER_TOKEN'" \
    '"upload_url"'

# 15. 獲取我的檔案列表
test_step "獲取我的檔案列表" \
    "api_request 'GET' '/storage/my-files' '' '$TEACHER_TOKEN'" \
    '\[\]'

echo -e "\n${YELLOW}=== 階段 7: 通知系統測試 ===${NC}"

# 16. 發送測試郵件
test_step "發送測試郵件" \
    "api_request 'POST' '/notifications/send-email' '{\"to\":\"test@example.com\",\"subject\":\"E2E測試郵件\",\"html\":\"<p>這是端到端測試郵件</p>\"}' '$ADMIN_TOKEN'" \
    '"success":true'

echo -e "\n${YELLOW}=== 階段 8: 結算管理測試 ===${NC}"

# 17. 獲取結算記錄
test_step "獲取結算記錄" \
    "api_request 'GET' '/payouts' '' '$ADMIN_TOKEN'" \
    '\['

echo -e "\n${YELLOW}=== 測試總結 ===${NC}"
echo "總測試數: $TOTAL_TESTS"
echo -e "通過: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失敗: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有測試通過！系統運行正常${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  有 $FAILED_TESTS 個測試失敗，請檢查系統狀態${NC}"
    exit 1
fi
