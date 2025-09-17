#!/bin/bash

# 老師可用時段測試腳本
# 測試老師從早上8點到晚上9點的完整可用時段

API_BASE="http://localhost:3001"

echo "🕐 老師可用時段測試"
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
test_availability() {
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

# 獲取各角色的 token
ADMIN_TOKEN=$(curl -s -X POST "$API_BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"admin123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
TEACHER_TOKEN=$(curl -s -X POST "$API_BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"teacher1@example.com","password":"teacher123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
STUDENT_TOKEN=$(curl -s -X POST "$API_BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"student1@example.com","password":"student123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ADMIN_TOKEN" ] && [ -n "$TEACHER_TOKEN" ] && [ -n "$STUDENT_TOKEN" ]; then
    echo -e "${GREEN}✅ 所有用戶登入成功${NC}"
else
    echo -e "${RED}❌ 用戶登入失敗${NC}"
    exit 1
fi

echo -e "\n${YELLOW}=== 2. 老師可用時段測試 ===${NC}"

# 測試老師獲取自己的可用時段
test_availability "老師獲取自己的可用時段" \
    "curl -s -X GET '$API_BASE/availability/my-slots' -H 'Authorization: Bearer $TEACHER_TOKEN'" \
    '"weekday"'

# 檢查時段數量是否正確 (應該有91個時段：7天 × 13小時)
SLOT_COUNT=$(curl -s -X GET "$API_BASE/availability/my-slots" -H "Authorization: Bearer $TEACHER_TOKEN" | grep -o '"id"' | wc -l)
echo -e "\n${BLUE}檢查時段數量${NC}"
if [ "$SLOT_COUNT" -eq 91 ]; then
    echo -e "${GREEN}✅ 時段數量正確 (91個時段)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 時段數量錯誤 (期望91個，實際$SLOT_COUNT個)${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 檢查每天的時段數量
echo -e "\n${BLUE}檢查每天時段分佈${NC}"
for day in {0..6}; do
    day_slots=$(curl -s -X GET "$API_BASE/availability/my-slots" -H "Authorization: Bearer $TEACHER_TOKEN" | grep -o "\"weekday\":$day" | wc -l)
    if [ "$day_slots" -eq 13 ]; then
        echo -e "${GREEN}✅ 週$([ $day -eq 0 ] && echo "日" || echo $day): $day_slots 個時段${NC}"
    else
        echo -e "${RED}❌ 週$([ $day -eq 0 ] && echo "日" || echo $day): $day_slots 個時段 (期望13個)${NC}"
    fi
done

# 檢查時間範圍 (早上8點到晚上9點)
echo -e "\n${BLUE}檢查時間範圍${NC}"
earliest_time=$(curl -s -X GET "$API_BASE/availability/my-slots" -H "Authorization: Bearer $TEACHER_TOKEN" | grep -o '"start_time":"[^"]*"' | cut -d'"' -f4 | sort | head -1)
latest_time=$(curl -s -X GET "$API_BASE/availability/my-slots" -H "Authorization: Bearer $TEACHER_TOKEN" | grep -o '"end_time":"[^"]*"' | cut -d'"' -f4 | sort | tail -1)

if [ "$earliest_time" = "08:00" ] && [ "$latest_time" = "21:00" ]; then
    echo -e "${GREEN}✅ 時間範圍正確 ($earliest_time - $latest_time)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 時間範圍錯誤 ($earliest_time - $latest_time，期望 08:00 - 21:00)${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}=== 3. 學生查看老師可用時段測試 ===${NC}"

# 獲取老師的 profile ID
TEACHER_PROFILE_ID="200b765d-8989-487c-b116-b11ceee4ebd5"

# 測試學生查看老師的可用時段
test_availability "學生查看老師可用時段" \
    "curl -s -X GET '$API_BASE/availability/teacher/$TEACHER_PROFILE_ID' -H 'Authorization: Bearer $STUDENT_TOKEN'" \
    '"weekday"'

# 檢查學生看到的時段數量是否與老師一致
STUDENT_SLOT_COUNT=$(curl -s -X GET "$API_BASE/availability/teacher/$TEACHER_PROFILE_ID" -H "Authorization: Bearer $STUDENT_TOKEN" | grep -o '"id"' | wc -l)
echo -e "\n${BLUE}檢查學生看到的時段數量${NC}"
if [ "$STUDENT_SLOT_COUNT" -eq 91 ]; then
    echo -e "${GREEN}✅ 學生看到的時段數量正確 (91個時段)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 學生看到的時段數量錯誤 (期望91個，實際$STUDENT_SLOT_COUNT個)${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}=== 4. 管理員查看老師可用時段測試 ===${NC}"

# 測試管理員查看老師的可用時段
test_availability "管理員查看老師可用時段" \
    "curl -s -X GET '$API_BASE/availability/teacher/$TEACHER_PROFILE_ID' -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    '"weekday"'

echo -e "\n${YELLOW}=== 5. 時段詳細信息驗證 ===${NC}"

# 檢查特定時段的詳細信息
echo -e "\n${BLUE}檢查週一早上8點時段${NC}"
monday_8am=$(curl -s -X GET "$API_BASE/availability/my-slots" -H "Authorization: Bearer $TEACHER_TOKEN" | grep -A5 -B5 '"weekday":1' | grep -A5 -B5 '"start_time":"08:00"')
if echo "$monday_8am" | grep -q '"capacity":2'; then
    echo -e "${GREEN}✅ 週一早上8點時段配置正確${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 週一早上8點時段配置錯誤${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${BLUE}檢查週日晚上8點時段${NC}"
sunday_8pm=$(curl -s -X GET "$API_BASE/availability/my-slots" -H "Authorization: Bearer $TEACHER_TOKEN" | grep -A5 -B5 '"weekday":0' | grep -A5 -B5 '"start_time":"20:00"')
if echo "$sunday_8pm" | grep -q '"end_time":"21:00"'; then
    echo -e "${GREEN}✅ 週日晚上8點時段配置正確${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 週日晚上8點時段配置錯誤${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}=== 6. 權限測試 ===${NC}"

# 測試未授權訪問
echo -e "\n${BLUE}測試未授權訪問${NC}"
unauthorized_response=$(curl -s -X GET "$API_BASE/availability/teacher/$TEACHER_PROFILE_ID")
if echo "$unauthorized_response" | grep -q "Unauthorized"; then
    echo -e "${GREEN}✅ 未授權訪問被正確拒絕${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 未授權訪問未被拒絕${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}=== 測試總結 ===${NC}"
echo "總測試數: $TOTAL_TESTS"
echo -e "通過: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失敗: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有老師可用時段測試通過！${NC}"
    echo -e "${GREEN}老師已設定從早上8點到晚上9點的完整可用時段${NC}"
    echo -e "${GREEN}學生可以從這些時段中選擇預約上課時間${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  有 $FAILED_TESTS 個測試失敗，請檢查配置${NC}"
    exit 1
fi
