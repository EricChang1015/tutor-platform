#!/bin/bash
# 家教平台 API 完整測試腳本
# 測試所有主要端點，包括新增的報表與證據功能

set -e

API_BASE="http://localhost:3001"
PASSED=0
FAILED=0
TOTAL=0

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 測試函數
test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local auth="$5"
    local expected_status="${6:-200}"
    
    TOTAL=$((TOTAL + 1))
    
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"
    
    if [ "$auth" = "true" ] && [ -n "$TOKEN" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $TOKEN'"
    fi
    
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$API_BASE$endpoint'"
    
    local response=$(eval $curl_cmd)
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $name (HTTP $status)"
        PASSED=$((PASSED + 1))
        
        # 儲存特定回應供後續使用
        if [ "$name" = "登入" ]; then
            TOKEN=$(echo "$body" | jq -r '.accessToken')
            echo "   Token: ${TOKEN:0:50}..."
        fi
        
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} - $name (Expected $expected_status, Got $status)"
        echo "   Response: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "========================================="
echo "  家教平台 API 完整測試"
echo "========================================="
echo ""

# 1. 認證測試
echo -e "${YELLOW}[1/10] 認證系統測試${NC}"
test_api "登入" "POST" "/auth/login" '{"username":"admin@example.com","password":"password"}' "false" "200"
test_api "取得個人資訊" "GET" "/auth/me" "" "true" "200"
test_api "未授權訪問" "GET" "/auth/me" "" "false" "401"
echo ""

# 2. 用戶管理測試
echo -e "${YELLOW}[2/10] 用戶管理測試${NC}"
test_api "取得用戶資訊" "GET" "/users/11111111-1111-1111-1111-111111111111" "" "false" "200"
test_api "更新個人資料" "PATCH" "/users/11111111-1111-1111-1111-111111111111" '{"name":"測試更新"}' "true" "200"
echo ""

# 3. 教師管理測試
echo -e "${YELLOW}[3/10] 教師管理測試${NC}"
test_api "教師清單" "GET" "/teachers" "" "false" "200"
# 取得第一個教師 ID
TEACHER_ID=$(curl -s "$API_BASE/teachers" | jq -r '.items[0].id')
if [ -n "$TEACHER_ID" ] && [ "$TEACHER_ID" != "null" ]; then
    test_api "教師詳情" "GET" "/teachers/$TEACHER_ID" "" "false" "200"
else
    echo -e "${YELLOW}⚠️  SKIP${NC} - 教師詳情 (無可用教師)"
fi
test_api "教師搜尋" "GET" "/teachers?q=English" "" "false" "200"
echo ""

# 4. 教師可用時間測試
echo -e "${YELLOW}[4/10] 教師可用時間測試${NC}"
test_api "搜尋可用教師" "GET" "/teacher-availability/search-teachers?date=2025-10-06&fromTime=14:00&toTime=15:00&timezone=Asia/Taipei" "" "false" "200"
test_api "教師時間表" "GET" "/teacher-availability/teacher-timetable?teacherId=3ac75e02-e751-440d-a21a-ffe8f6f1b79b&date=2025-10-06&timezone=Asia/Taipei" "" "false" "200"
echo ""

# 5. 材料管理測試
echo -e "${YELLOW}[5/10] 材料管理測試${NC}"
test_api "材料清單" "GET" "/materials" "" "false" "200"
echo ""

# 6. 預約管理測試
echo -e "${YELLOW}[6/10] 預約管理測試${NC}"
test_api "我的預約清單" "GET" "/bookings" "" "true" "200"
# 跳過預約詳情測試（需要實際的預約 ID）
echo ""

# 7. 購買項目測試
echo -e "${YELLOW}[7/10] 購買項目測試${NC}"
test_api "購買項目清單" "GET" "/purchases" "" "true" "200"
echo ""

# 8. 收藏系統測試
echo -e "${YELLOW}[8/10] 收藏系統測試${NC}"
test_api "收藏清單" "GET" "/favorites" "" "true" "200"
echo ""

# 9. 報表功能測試（新增）
echo -e "${YELLOW}[9/10] 報表功能測試${NC}"
test_api "管理員報表" "GET" "/reports/admin" "" "true" "200"
test_api "管理員報表（帶篩選）" "GET" "/reports/admin?from=2025-10-01T00:00:00Z&to=2025-10-31T23:59:59Z" "" "true" "200"
test_api "老師報表" "GET" "/reports/teacher" "" "true" "200"
echo ""

# 10. Admin 預約管理測試（新增）
echo -e "${YELLOW}[10/10] Admin 預約管理測試${NC}"
test_api "Admin 預約清單" "GET" "/admin/bookings" "" "true" "200"
test_api "Admin 預約清單（帶篩選）" "GET" "/admin/bookings?from=2025-10-01T00:00:00Z&to=2025-10-31T23:59:59Z" "" "true" "200"
test_api "Admin 報表（舊端點）" "GET" "/admin/reports" "" "true" "200"
echo ""

# 測試結果統計
echo "========================================="
echo "  測試結果統計"
echo "========================================="
echo -e "總計: $TOTAL"
echo -e "${GREEN}通過: $PASSED${NC}"
echo -e "${RED}失敗: $FAILED${NC}"

if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")
    echo -e "成功率: ${SUCCESS_RATE}%"
fi

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有測試通過！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  有 $FAILED 個測試失敗${NC}"
    exit 1
fi

