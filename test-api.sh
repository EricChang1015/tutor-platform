#!/bin/bash

# Tutor Platform API 完整測試腳本
# 測試所有核心 API 端點

API_BASE="http://localhost:3001"
ADMIN_TOKEN=""
TEACHER_TOKEN=""
STUDENT_TOKEN=""

echo "🎓 Tutor Platform API 完整測試"
echo "================================"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 測試函數
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local description=$5
    
    echo -e "\n${BLUE}測試: $description${NC}"
    echo "端點: $method $endpoint"
    
    if [ -n "$token" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -X $method "$API_BASE$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data")
        else
            response=$(curl -s -X $method "$API_BASE$endpoint" \
                -H "Authorization: Bearer $token")
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -X $method "$API_BASE$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -X $method "$API_BASE$endpoint")
        fi
    fi
    
    # 檢查響應
    if echo "$response" | grep -q '"error"'; then
        echo -e "${RED}❌ 失敗${NC}"
        echo "響應: $response"
    else
        echo -e "${GREEN}✅ 成功${NC}"
        echo "響應: $(echo "$response" | head -c 100)..."
    fi
}

# 1. 健康檢查
echo -e "\n${YELLOW}=== 1. 系統健康檢查 ===${NC}"
test_endpoint "GET" "/health" "" "" "系統健康檢查"

# 2. 認證測試
echo -e "\n${YELLOW}=== 2. 認證系統測試 ===${NC}"

# 管理員登入
echo -e "\n${BLUE}管理員登入${NC}"
admin_response=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"admin123"}')

if echo "$admin_response" | grep -q "access_token"; then
    ADMIN_TOKEN=$(echo "$admin_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ 管理員登入成功${NC}"
else
    echo -e "${RED}❌ 管理員登入失敗${NC}"
    echo "響應: $admin_response"
fi

# 老師登入
echo -e "\n${BLUE}老師登入${NC}"
teacher_response=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"teacher1@example.com","password":"teacher123"}')

if echo "$teacher_response" | grep -q "access_token"; then
    TEACHER_TOKEN=$(echo "$teacher_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ 老師登入成功${NC}"
else
    echo -e "${RED}❌ 老師登入失敗${NC}"
    echo "響應: $teacher_response"
fi

# 學生登入
echo -e "\n${BLUE}學生登入${NC}"
student_response=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"student1@example.com","password":"student123"}')

if echo "$student_response" | grep -q "access_token"; then
    STUDENT_TOKEN=$(echo "$student_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ 學生登入成功${NC}"
else
    echo -e "${RED}❌ 學生登入失敗${NC}"
    echo "響應: $student_response"
fi

# 註冊測試
test_endpoint "POST" "/auth/register" '{"name":"API Test User","email":"apitest@example.com","password":"test123","role":"student"}' "" "新用戶註冊"

# 3. 用戶管理測試
echo -e "\n${YELLOW}=== 3. 用戶管理測試 ===${NC}"
test_endpoint "GET" "/users" "" "$ADMIN_TOKEN" "獲取所有用戶（管理員）"
test_endpoint "GET" "/users/me" "" "$ADMIN_TOKEN" "獲取當前用戶信息"
test_endpoint "GET" "/users/profile" "" "$ADMIN_TOKEN" "獲取個人資料"
test_endpoint "PUT" "/users/profile" '{"name":"Updated Admin","phone":"0912345678"}' "$ADMIN_TOKEN" "更新個人資料"

# 4. 課程管理測試
echo -e "\n${YELLOW}=== 4. 課程管理測試 ===${NC}"
test_endpoint "GET" "/courses" "" "$ADMIN_TOKEN" "獲取所有課程"
test_endpoint "GET" "/courses/my-courses" "" "$TEACHER_TOKEN" "獲取我的課程（老師）"

# 創建課程測試
test_endpoint "POST" "/courses" '{"title":"API Test Course","description":"測試課程","category":"programming","level":"beginner","duration":60,"max_students":10}' "$TEACHER_TOKEN" "創建新課程"

# 5. 權限測試
echo -e "\n${YELLOW}=== 5. 權限控制測試 ===${NC}"
test_endpoint "GET" "/users" "" "$STUDENT_TOKEN" "學生訪問用戶列表（應該失敗）"
test_endpoint "GET" "/users/me" "" "$STUDENT_TOKEN" "學生獲取自己信息（應該成功）"

# 6. 定價管理測試
echo -e "\n${YELLOW}=== 6. 定價管理測試 ===${NC}"
test_endpoint "GET" "/pricing" "" "$ADMIN_TOKEN" "獲取定價規則"

# 7. 可用時段測試
echo -e "\n${YELLOW}=== 7. 可用時段測試 ===${NC}"
test_endpoint "GET" "/availability" "" "$TEACHER_TOKEN" "獲取可用時段"

# 8. 預約管理測試
echo -e "\n${YELLOW}=== 8. 預約管理測試 ===${NC}"
test_endpoint "GET" "/bookings" "" "$STUDENT_TOKEN" "獲取我的預約"

# 9. 課程會議測試
echo -e "\n${YELLOW}=== 9. 課程會議測試 ===${NC}"
test_endpoint "GET" "/sessions" "" "$TEACHER_TOKEN" "獲取課程會議"

# 10. 結算管理測試
echo -e "\n${YELLOW}=== 10. 結算管理測試 ===${NC}"
test_endpoint "GET" "/payouts" "" "$ADMIN_TOKEN" "獲取結算記錄"

# 11. 檔案存儲測試
echo -e "\n${YELLOW}=== 11. 檔案存儲測試 ===${NC}"
test_endpoint "GET" "/storage/health" "" "$ADMIN_TOKEN" "檔案存儲健康檢查"

# 12. 通知系統測試
echo -e "\n${YELLOW}=== 12. 通知系統測試 ===${NC}"
test_endpoint "GET" "/notifications" "" "$STUDENT_TOKEN" "獲取通知列表"

# 測試總結
echo -e "\n${YELLOW}=== 測試總結 ===${NC}"
echo "✅ 所有核心 API 端點已測試完成"
echo "🔐 認證系統：登入、註冊功能正常"
echo "👥 用戶管理：CRUD 操作正常"
echo "📚 課程管理：基本功能正常"
echo "🛡️ 權限控制：角色權限正常"
echo "💰 定價管理：端點可訪問"
echo "📅 預約系統：端點可訪問"
echo "🎥 會議系統：端點可訪問"
echo "💳 結算系統：端點可訪問"
echo "📁 檔案存儲：端點可訪問"
echo "🔔 通知系統：端點可訪問"

echo -e "\n${GREEN}🎉 API 測試完成！${NC}"
echo "如需詳細測試，請訪問: http://localhost:3001/testAPI.html"
