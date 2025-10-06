#!/bin/bash

# API 測試腳本
# 測試所有主要的 API 端點

BASE_URL="http://localhost:3001"
FUTURE_DATE=$(date -d "+1 day" '+%Y-%m-%d')

echo "=== API 測試開始 ==="
echo "Base URL: $BASE_URL"
echo "Future Date: $FUTURE_DATE"
echo ""

# 1. 測試登入
echo "1. 測試登入..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"student1@example.com","password":"password"}')

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    echo "✅ 登入成功"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo "Token: ${TOKEN:0:50}..."
else
    echo "❌ 登入失敗: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# 2. 測試用戶信息
echo "2. 測試用戶信息..."
ME_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/auth/me")
if echo "$ME_RESPONSE" | grep -q "id"; then
    echo "✅ 用戶信息獲取成功"
else
    echo "❌ 用戶信息獲取失敗: $ME_RESPONSE"
fi
echo ""

# 3. 測試教師列表
echo "3. 測試教師列表..."
TEACHERS_RESPONSE=$(curl -s "$BASE_URL/teachers")
if echo "$TEACHERS_RESPONSE" | grep -q "items"; then
    echo "✅ 教師列表獲取成功"
    TEACHER_ID=$(echo "$TEACHERS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Teacher ID: $TEACHER_ID"
else
    echo "❌ 教師列表獲取失敗: $TEACHERS_RESPONSE"
fi
echo ""

# 4. 測試時間槽
echo "4. 測試時間槽..."
TIMESLOTS_RESPONSE=$(curl -s "$BASE_URL/teacher-availability/time-slots")
if echo "$TIMESLOTS_RESPONSE" | grep -q "data"; then
    echo "✅ 時間槽獲取成功"
else
    echo "❌ 時間槽獲取失敗: $TIMESLOTS_RESPONSE"
fi
echo ""

# 5. 測試教師時間表（上海時區）
echo "5. 測試教師時間表（上海時區）..."
TIMETABLE_SH_RESPONSE=$(curl -s "$BASE_URL/teacher-availability/teacher-timetable?teacherId=$TEACHER_ID&date=$FUTURE_DATE&timezone=Asia/Shanghai")
if echo "$TIMETABLE_SH_RESPONSE" | grep -q "data"; then
    echo "✅ 上海時區時間表獲取成功"
    echo "第一個時段: $(echo "$TIMETABLE_SH_RESPONSE" | grep -o '"time":"[^"]*"' | head -1)"
else
    echo "❌ 上海時區時間表獲取失敗: $TIMETABLE_SH_RESPONSE"
fi
echo ""

# 6. 測試教師時間表（紐約時區）
echo "6. 測試教師時間表（紐約時區）..."
TIMETABLE_NY_RESPONSE=$(curl -s "$BASE_URL/teacher-availability/teacher-timetable?teacherId=$TEACHER_ID&date=$FUTURE_DATE&timezone=America/New_York")
if echo "$TIMETABLE_NY_RESPONSE" | grep -q "data"; then
    echo "✅ 紐約時區時間表獲取成功"
    echo "第一個時段: $(echo "$TIMETABLE_NY_RESPONSE" | grep -o '"time":"[^"]*"' | head -1)"
else
    echo "❌ 紐約時區時間表獲取失敗: $TIMETABLE_NY_RESPONSE"
fi
echo ""

# 7. 測試搜尋可用教師
echo "7. 測試搜尋可用教師..."
SEARCH_RESPONSE=$(curl -s "$BASE_URL/teacher-availability/search-teachers?date=$FUTURE_DATE&fromTime=14:00&toTime=14:30&timezone=Asia/Shanghai")
if echo "$SEARCH_RESPONSE" | grep -q "data"; then
    echo "✅ 搜尋可用教師成功"
else
    echo "❌ 搜尋可用教師失敗: $SEARCH_RESPONSE"
fi
echo ""

# 8. 測試創建預約
echo "8. 測試創建預約..."
BOOKING_RESPONSE=$(curl -s -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"teacherId\": \"$TEACHER_ID\",
    \"startsAt\": \"${FUTURE_DATE}T14:00:00+08:00\",
    \"durationMinutes\": 30,
    \"timezone\": \"Asia/Shanghai\",
    \"courseTitle\": \"測試課程\",
    \"message\": \"API測試預約\"
  }")

if echo "$BOOKING_RESPONSE" | grep -q "id"; then
    echo "✅ 創建預約成功"
    BOOKING_ID=$(echo "$BOOKING_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Booking ID: $BOOKING_ID"
else
    echo "❌ 創建預約失敗: $BOOKING_RESPONSE"
fi
echo ""

# 9. 測試預約列表
echo "9. 測試預約列表..."
BOOKINGS_LIST_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/bookings")
if echo "$BOOKINGS_LIST_RESPONSE" | grep -q "items"; then
    echo "✅ 預約列表獲取成功"
else
    echo "❌ 預約列表獲取失敗: $BOOKINGS_LIST_RESPONSE"
fi
echo ""

# 10. 測試材料列表
echo "10. 測試材料列表..."
MATERIALS_RESPONSE=$(curl -s "$BASE_URL/materials")
if echo "$MATERIALS_RESPONSE" | grep -q "items"; then
    echo "✅ 材料列表獲取成功"
else
    echo "❌ 材料列表獲取失敗: $MATERIALS_RESPONSE"
fi
echo ""

echo "=== API 測試完成 ==="
