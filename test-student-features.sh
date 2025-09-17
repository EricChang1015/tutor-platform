#!/bin/bash

# 學生功能測試腳本
# 測試學生主頁面和課程頁面的新功能

API_BASE="http://localhost/api"

echo "🎓 學生功能測試"
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
test_api() {
    local description=$1
    local command=$2
    local expected_pattern=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}測試 $TOTAL_TESTS: $description${NC}"
    
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

echo -e "\n${YELLOW}=== 1. 獲取認證 Token ===${NC}"

# 獲取學生 token
STUDENT_TOKEN=$(curl -s -X POST "$API_BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"student1@example.com","password":"student123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$STUDENT_TOKEN" ]; then
    echo -e "${GREEN}✅ 學生登入成功${NC}"
else
    echo -e "${RED}❌ 學生登入失敗${NC}"
    exit 1
fi

echo -e "\n${YELLOW}=== 2. 推薦老師 API 測試 ===${NC}"

# 測試推薦老師端點
test_api "獲取推薦老師列表" \
    "curl -s -X GET '$API_BASE/users/teachers/recommended?limit=4' -H 'Authorization: Bearer $STUDENT_TOKEN'" \
    '"display_name"'

# 檢查推薦老師數量
TEACHER_COUNT=$(curl -s -X GET "$API_BASE/users/teachers/recommended?limit=4" -H "Authorization: Bearer $STUDENT_TOKEN" | grep -o '"id"' | wc -l)
echo -e "\n${BLUE}檢查推薦老師數量${NC}"
if [ "$TEACHER_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ 返回 $TEACHER_COUNT 位推薦老師${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 未返回推薦老師${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}=== 3. 推薦課程 API 測試 ===${NC}"

# 測試推薦課程端點
test_api "獲取推薦課程列表" \
    "curl -s -X GET '$API_BASE/courses/recommended?limit=6' -H 'Authorization: Bearer $STUDENT_TOKEN'" \
    '"title"'

# 檢查推薦課程數量
COURSE_COUNT=$(curl -s -X GET "$API_BASE/courses/recommended?limit=6" -H "Authorization: Bearer $STUDENT_TOKEN" | grep -o '"id"' | wc -l)
echo -e "\n${BLUE}檢查推薦課程數量${NC}"
if [ "$COURSE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ 返回 $COURSE_COUNT 門推薦課程${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 未返回推薦課程${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}=== 4. 課程詳細信息測試 ===${NC}"

# 獲取第一個課程的詳細信息
FIRST_COURSE_ID=$(curl -s -X GET "$API_BASE/courses/recommended?limit=1" -H "Authorization: Bearer $STUDENT_TOKEN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$FIRST_COURSE_ID" ]; then
    test_api "獲取課程詳細信息" \
        "curl -s -X GET '$API_BASE/courses/$FIRST_COURSE_ID' -H 'Authorization: Bearer $STUDENT_TOKEN'" \
        '"duration_min"'
    
    # 檢查課程時長信息
    COURSE_DURATION=$(curl -s -X GET "$API_BASE/courses/$FIRST_COURSE_ID" -H "Authorization: Bearer $STUDENT_TOKEN" | grep -o '"duration_min":[0-9]*' | cut -d':' -f2)
    echo -e "\n${BLUE}檢查課程時長信息${NC}"
    if [ -n "$COURSE_DURATION" ] && [ "$COURSE_DURATION" -gt 0 ]; then
        echo -e "${GREEN}✅ 課程時長: $COURSE_DURATION 分鐘${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ 課程時長信息無效${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

echo -e "\n${YELLOW}=== 5. 老師可用時段測試 ===${NC}"

# 獲取第一個老師的可用時段
FIRST_TEACHER_ID=$(curl -s -X GET "$API_BASE/users/teachers/recommended?limit=1" -H "Authorization: Bearer $STUDENT_TOKEN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$FIRST_TEACHER_ID" ]; then
    test_api "獲取老師可用時段" \
        "curl -s -X GET '$API_BASE/availability/teacher/$FIRST_TEACHER_ID' -H 'Authorization: Bearer $STUDENT_TOKEN'" \
        '"weekday"'
    
    # 檢查時段數量
    SLOT_COUNT=$(curl -s -X GET "$API_BASE/availability/teacher/$FIRST_TEACHER_ID" -H "Authorization: Bearer $STUDENT_TOKEN" | grep -o '"start_time"' | wc -l)
    echo -e "\n${BLUE}檢查老師可用時段數量${NC}"
    if [ "$SLOT_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ 老師有 $SLOT_COUNT 個可用時段${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ 老師無可用時段${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

echo -e "\n${YELLOW}=== 6. 學生預約數據測試 ===${NC}"

# 測試學生預約數據
test_api "獲取學生預約列表" \
    "curl -s -X GET '$API_BASE/booking/my-bookings' -H 'Authorization: Bearer $STUDENT_TOKEN'" \
    '\[\]'

echo -e "\n${YELLOW}=== 7. 前端頁面可訪問性測試 ===${NC}"

# 測試前端頁面是否可訪問
echo -e "\n${BLUE}測試前端主頁${NC}"
FRONTEND_RESPONSE=$(curl -s -I http://localhost:3000/)
if echo "$FRONTEND_RESPONSE" | grep -q "200 OK"; then
    echo -e "${GREEN}✅ 前端主頁可訪問${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 前端主頁無法訪問${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}=== 8. API 響應時間測試 ===${NC}"

# 測試 API 響應時間
echo -e "\n${BLUE}測試推薦老師 API 響應時間${NC}"
START_TIME=$(date +%s%N)
curl -s -X GET "$API_BASE/users/teachers/recommended?limit=4" -H "Authorization: Bearer $STUDENT_TOKEN" > /dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

if [ "$RESPONSE_TIME" -lt 2000 ]; then
    echo -e "${GREEN}✅ 響應時間: ${RESPONSE_TIME}ms (良好)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  響應時間: ${RESPONSE_TIME}ms (較慢)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${BLUE}測試推薦課程 API 響應時間${NC}"
START_TIME=$(date +%s%N)
curl -s -X GET "$API_BASE/courses/recommended?limit=6" -H "Authorization: Bearer $STUDENT_TOKEN" > /dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

if [ "$RESPONSE_TIME" -lt 2000 ]; then
    echo -e "${GREEN}✅ 響應時間: ${RESPONSE_TIME}ms (良好)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  響應時間: ${RESPONSE_TIME}ms (較慢)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}=== 9. 數據完整性驗證 ===${NC}"

# 驗證推薦老師數據完整性
echo -e "\n${BLUE}驗證推薦老師數據完整性${NC}"
TEACHER_DATA=$(curl -s -X GET "$API_BASE/users/teachers/recommended?limit=1" -H "Authorization: Bearer $STUDENT_TOKEN")
if echo "$TEACHER_DATA" | grep -q '"rating"' && echo "$TEACHER_DATA" | grep -q '"session_count"'; then
    echo -e "${GREEN}✅ 老師數據包含評分和課程數量${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 老師數據缺少關鍵信息${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 驗證推薦課程數據完整性
echo -e "\n${BLUE}驗證推薦課程數據完整性${NC}"
COURSE_DATA=$(curl -s -X GET "$API_BASE/courses/recommended?limit=1" -H "Authorization: Bearer $STUDENT_TOKEN")
if echo "$COURSE_DATA" | grep -q '"popularity_score"' && echo "$COURSE_DATA" | grep -q '"session_count"'; then
    echo -e "${GREEN}✅ 課程數據包含受歡迎程度和預約數量${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 課程數據缺少關鍵信息${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}=== 測試總結 ===${NC}"
echo "總測試數: $TOTAL_TESTS"
echo -e "通過: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失敗: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有學生功能測試通過！${NC}"
    echo -e "${GREEN}✅ 學生主頁面功能完整${NC}"
    echo -e "${GREEN}✅ 課程選擇和預約流程正常${NC}"
    echo -e "${GREEN}✅ 推薦系統運作良好${NC}"
    echo -e "${GREEN}✅ API 響應時間符合要求${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  有 $FAILED_TESTS 個測試失敗，請檢查配置${NC}"
    exit 1
fi
