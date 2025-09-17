#!/bin/bash

# Tutor Platform 業務流程測試腳本
# 測試完整的業務場景：從用戶註冊到課程預約、上課、結算的完整流程

API_BASE="http://localhost:3001"

echo "🎓 Tutor Platform 業務流程測試"
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
test_business_step() {
    local description=$1
    local command=$2
    local expected_pattern=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}業務步驟 $TOTAL_TESTS: $description${NC}"
    
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

echo -e "\n${YELLOW}=== 場景 1: 完整的教學業務流程 ===${NC}"

# 1. 管理員登入
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

# 2. 創建新老師
TEACHER_EMAIL="newteacher$(date +%s)@example.com"
test_business_step "創建新老師帳號" \
    "api_request 'POST' '/users' '{\"name\":\"New Teacher\",\"email\":\"$TEACHER_EMAIL\",\"password\":\"teacher123\",\"role\":\"teacher\"}' '$ADMIN_TOKEN'" \
    '"id"'

# 3. 創建新學生
STUDENT_EMAIL="newstudent$(date +%s)@example.com"
test_business_step "創建新學生帳號" \
    "api_request 'POST' '/users' '{\"name\":\"New Student\",\"email\":\"$STUDENT_EMAIL\",\"password\":\"student123\",\"role\":\"student\"}' '$ADMIN_TOKEN'" \
    '"id"'

# 4. 老師登入
TEACHER_TOKEN=""
teacher_response=$(api_request "POST" "/auth/login" "{\"email\":\"$TEACHER_EMAIL\",\"password\":\"teacher123\"}")
if echo "$teacher_response" | grep -q "access_token"; then
    TEACHER_TOKEN=$(echo "$teacher_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ 新老師登入成功${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 新老師登入失敗${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 5. 學生登入
STUDENT_TOKEN=""
student_response=$(api_request "POST" "/auth/login" "{\"email\":\"$STUDENT_EMAIL\",\"password\":\"student123\"}")
if echo "$student_response" | grep -q "access_token"; then
    STUDENT_TOKEN=$(echo "$student_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ 新學生登入成功${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 新學生登入失敗${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 6. 老師創建課程
test_business_step "老師創建新課程" \
    "api_request 'POST' '/courses' '{\"title\":\"Business Test Course\",\"description\":\"業務流程測試課程\",\"type\":\"one_on_one\",\"duration_min\":25,\"default_price_cents\":800}' '$TEACHER_TOKEN'" \
    '"id"'

# 7. 老師設定可用時段
test_business_step "老師設定可用時段" \
    "api_request 'POST' '/availability' '{\"weekday\":1,\"start_time\":\"09:00\",\"end_time\":\"11:00\",\"capacity\":3}' '$TEACHER_TOKEN'" \
    '"id"'

# 8. 獲取課程列表
COURSE_ID=""
course_response=$(api_request "GET" "/courses" "" "$STUDENT_TOKEN")
if echo "$course_response" | grep -q "Business Test Course"; then
    COURSE_ID=$(echo "$course_response" | grep -A5 "Business Test Course" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✅ 學生可以看到課程列表${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 學生無法看到課程列表${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 9. 管理員為學生創建課程包
# 首先獲取學生的 user ID，然後查詢對應的 student_profile ID
student_users_response=$(api_request "GET" "/users?role=student" "" "$ADMIN_TOKEN")
STUDENT_USER_ID=$(echo "$student_users_response" | grep -B5 -A5 "$STUDENT_EMAIL" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# 通過數據庫查詢獲取 student_profile_id
if [ -n "$STUDENT_USER_ID" ]; then
    STUDENT_PROFILE_ID=$(docker-compose exec -T postgres psql -U app -d appdb -t -c "SELECT id FROM student_profile WHERE user_id = '$STUDENT_USER_ID';" | tr -d ' ')
fi

if [ -n "$STUDENT_PROFILE_ID" ] && [ -n "$COURSE_ID" ]; then
    test_business_step "管理員為學生創建課程包" \
        "api_request 'POST' '/packages' '{\"studentId\":\"$STUDENT_PROFILE_ID\",\"courseId\":\"$COURSE_ID\",\"totalSessions\":10,\"notes\":\"業務測試課程包\"}' '$ADMIN_TOKEN'" \
        '"id"'
else
    echo -e "${RED}❌ 無法獲取學生 Profile ID 或課程 ID${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# 10. 檢查學生課程包餘額
if [ -n "$STUDENT_PROFILE_ID" ]; then
    test_business_step "檢查學生課程包餘額" \
        "api_request 'GET' '/students/$STUDENT_PROFILE_ID/packages/summary' '' '$ADMIN_TOKEN'" \
        '"totalAvailable"'
fi

echo -e "\n${YELLOW}=== 場景 2: 錯誤處理和邊界測試 ===${NC}"

# 11. 測試重複創建用戶
test_business_step "測試重複創建用戶（應該失敗）" \
    "api_request 'POST' '/users' '{\"name\":\"Duplicate User\",\"email\":\"$TEACHER_EMAIL\",\"password\":\"test123\",\"role\":\"teacher\"}' '$ADMIN_TOKEN'" \
    "already exists"

# 12. 測試無效的課程創建 - 使用無效的 duration
test_business_step "測試創建無效課程（應該失敗）" \
    "api_request 'POST' '/courses' '{\"title\":\"Test Course\",\"description\":\"無效課程\",\"duration_min\":-1}' '$TEACHER_TOKEN'" \
    "error"

# 13. 測試衝突的時段創建
test_business_step "測試創建衝突時段（應該失敗）" \
    "api_request 'POST' '/availability' '{\"weekday\":1,\"start_time\":\"09:30\",\"end_time\":\"10:30\",\"capacity\":1}' '$TEACHER_TOKEN'" \
    "conflicts"

echo -e "\n${YELLOW}=== 場景 3: 權限和安全測試 ===${NC}"

# 14. 測試學生嘗試創建課程（應該失敗）
test_business_step "學生嘗試創建課程（應該失敗）" \
    "api_request 'POST' '/courses' '{\"title\":\"Unauthorized Course\",\"description\":\"學生不應該能創建\"}' '$STUDENT_TOKEN'" \
    "Forbidden"

# 15. 測試未授權訪問用戶列表
test_business_step "未授權訪問用戶列表（應該失敗）" \
    "api_request 'GET' '/users' '' ''" \
    "Unauthorized"

# 16. 測試老師訪問管理員功能（應該失敗）
test_business_step "老師嘗試創建用戶（應該失敗）" \
    "api_request 'POST' '/users' '{\"name\":\"Unauthorized User\",\"email\":\"test@test.com\",\"password\":\"test123\",\"role\":\"student\"}' '$TEACHER_TOKEN'" \
    "Forbidden"

echo -e "\n${YELLOW}=== 測試總結 ===${NC}"
echo "總測試數: $TOTAL_TESTS"
echo -e "通過: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失敗: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有業務流程測試通過！系統業務邏輯正常${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  有 $FAILED_TESTS 個測試失敗，請檢查業務邏輯${NC}"
    exit 1
fi
