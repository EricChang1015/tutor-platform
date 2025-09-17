#!/bin/bash

# Tutor Platform 性能測試腳本
# 測試系統在負載下的表現

API_BASE="http://localhost/api"

echo "🚀 Tutor Platform 性能測試"
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

# 性能測試函數
performance_test() {
    local description=$1
    local command=$2
    local max_time=$3
    local expected_pattern=$4
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}性能測試 $TOTAL_TESTS: $description${NC}"
    echo "最大允許時間: ${max_time}秒"
    
    # 記錄開始時間
    start_time=$(date +%s.%N)
    
    # 執行命令
    response=$(eval "$command" 2>&1)
    
    # 記錄結束時間
    end_time=$(date +%s.%N)
    
    # 計算執行時間
    execution_time=$(echo "$end_time - $start_time" | bc)
    
    echo "執行時間: ${execution_time}秒"
    
    # 檢查響應內容
    content_ok=false
    if echo "$response" | grep -q "$expected_pattern"; then
        content_ok=true
    fi
    
    # 檢查執行時間
    time_ok=false
    if (( $(echo "$execution_time <= $max_time" | bc -l) )); then
        time_ok=true
    fi
    
    if [ "$content_ok" = true ] && [ "$time_ok" = true ]; then
        echo -e "${GREEN}✅ 通過 (響應正確且性能達標)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    elif [ "$content_ok" = true ]; then
        echo -e "${YELLOW}⚠️  響應正確但性能不達標${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    else
        echo -e "${RED}❌ 失敗 (響應錯誤)${NC}"
        echo "響應: $response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# 並發測試函數
concurrent_test() {
    local description=$1
    local command=$2
    local concurrent_count=$3
    local expected_pattern=$4
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}並發測試 $TOTAL_TESTS: $description${NC}"
    echo "並發數量: $concurrent_count"
    
    # 創建臨時目錄存放結果
    temp_dir=$(mktemp -d)
    
    # 記錄開始時間
    start_time=$(date +%s.%N)
    
    # 並發執行命令
    for i in $(seq 1 $concurrent_count); do
        (eval "$command" > "$temp_dir/result_$i.txt" 2>&1) &
    done
    
    # 等待所有進程完成
    wait
    
    # 記錄結束時間
    end_time=$(date +%s.%N)
    
    # 計算執行時間
    execution_time=$(echo "$end_time - $start_time" | bc)
    
    echo "總執行時間: ${execution_time}秒"
    
    # 檢查結果
    success_count=0
    for i in $(seq 1 $concurrent_count); do
        if grep -q "$expected_pattern" "$temp_dir/result_$i.txt"; then
            success_count=$((success_count + 1))
        fi
    done
    
    echo "成功請求數: $success_count/$concurrent_count"
    
    # 清理臨時文件
    rm -rf "$temp_dir"
    
    if [ $success_count -eq $concurrent_count ]; then
        echo -e "${GREEN}✅ 通過 (所有並發請求成功)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ 失敗 (部分請求失敗)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# 檢查 bc 命令是否可用
if ! command -v bc &> /dev/null; then
    echo -e "${YELLOW}⚠️  bc 命令不可用，將跳過精確的時間計算${NC}"
    # 使用簡化的性能測試
    performance_test() {
        local description=$1
        local command=$2
        local max_time=$3
        local expected_pattern=$4
        
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        echo -e "\n${BLUE}性能測試 $TOTAL_TESTS: $description${NC}"
        
        # 使用 timeout 命令限制執行時間
        response=$(timeout ${max_time}s bash -c "$command" 2>&1)
        exit_code=$?
        
        if [ $exit_code -eq 124 ]; then
            echo -e "${RED}❌ 超時 (超過 ${max_time}秒)${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return 1
        elif echo "$response" | grep -q "$expected_pattern"; then
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
fi

echo -e "\n${YELLOW}=== 基礎性能測試 ===${NC}"

# 獲取管理員 token
ADMIN_TOKEN=$(curl -s -X POST "$API_BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"admin123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# 1. 健康檢查響應時間
performance_test "健康檢查響應時間" \
    "curl -s $API_BASE/health" \
    1 \
    '"ok":true'

# 2. 用戶登入響應時間
performance_test "用戶登入響應時間" \
    "curl -s -X POST $API_BASE/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@example.com\",\"password\":\"admin123\"}'" \
    2 \
    'access_token'

# 3. 用戶列表查詢響應時間
performance_test "用戶列表查詢響應時間" \
    "curl -s -X GET $API_BASE/users -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    3 \
    '\['

# 4. 課程列表查詢響應時間
performance_test "課程列表查詢響應時間" \
    "curl -s -X GET $API_BASE/courses -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    2 \
    '\['

echo -e "\n${YELLOW}=== 並發測試 ===${NC}"

# 5. 並發健康檢查
concurrent_test "並發健康檢查 (5個請求)" \
    "curl -s $API_BASE/health" \
    5 \
    '"ok":true'

# 6. 並發登入測試
concurrent_test "並發登入測試 (3個請求)" \
    "curl -s -X POST $API_BASE/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@example.com\",\"password\":\"admin123\"}'" \
    3 \
    'access_token'

echo -e "\n${YELLOW}=== 負載測試 ===${NC}"

# 7. 大量數據查詢測試
performance_test "大量數據查詢測試" \
    "curl -s -X GET '$API_BASE/users?limit=100' -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    5 \
    '\['

# 8. 複雜查詢測試
performance_test "複雜查詢測試 (帶篩選)" \
    "curl -s -X GET '$API_BASE/users?role=student&active=true&q=student' -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    3 \
    '\['

echo -e "\n${YELLOW}=== 資源使用測試 ===${NC}"

# 9. 記憶體使用測試 - 創建多個用戶
echo -e "\n${BLUE}記憶體使用測試: 批量創建用戶${NC}"
start_time=$(date +%s)
success_count=0
for i in {1..10}; do
    response=$(curl -s -X POST "$API_BASE/users" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Perf Test User $i\",\"email\":\"perftest$i@example.com\",\"password\":\"test123\",\"role\":\"student\"}")
    
    if echo "$response" | grep -q '"id"'; then
        success_count=$((success_count + 1))
    fi
done
end_time=$(date +%s)
execution_time=$((end_time - start_time))

echo "創建 10 個用戶耗時: ${execution_time}秒"
echo "成功創建: $success_count/10"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ $success_count -eq 10 ] && [ $execution_time -le 10 ]; then
    echo -e "${GREEN}✅ 通過${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 失敗${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo -e "\n${YELLOW}=== 性能測試總結 ===${NC}"
echo "總測試數: $TOTAL_TESTS"
echo -e "通過: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失敗: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有性能測試通過！系統性能良好${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  有 $FAILED_TESTS 個性能測試失敗，請檢查系統性能${NC}"
    exit 1
fi
