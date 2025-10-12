# 報表與課後證據功能說明（v1.3.0）

本文件說明新增的報表與課後證據功能，包含權限、流程、API 端點、資料庫更新與測試方式。

## 目標
- Admin 可全域查看所有預約、完成進度，並以學生/老師/結算/證據等條件過濾。
- Teacher 可查看自己的預約、上傳課後證據（MinIO）並提交課後評語。
- Admin/Teacher 可透過報表查看金額結算（pending/ready/settled/outstanding）。

## 權限對照
- Teacher：可查看/上傳/刪除自己課的證據；可提交/更新自己的課後回報（rubrics + 評語）。
- Admin：可查看所有預約與證據；可刪除不合規證據；可驗證報告、處理結算。
- Student：可查看與自己相關的證據（僅簽名 URL 方式存取），不可上傳或刪除。

## 新增/修改 API 總覽
- GET /admin/bookings：全域預約清單，支援 teacherId、studentId、statusExact、hasReport、hasEvidence、settlementStatus、from/to/tz 等。
- POST/GET/DELETE /bookings/{id}/evidence：上傳/查詢/刪除課後證據（自動使用 category=class_recording 並綁定 booking）。
- POST /post-class/{id}/teacher-report：新增 commentToStudent 與 evidenceFileIds，支援上傳後以 ID 關聯。
- GET /bookings（我的清單）：新增 hasReport、hasEvidence、settlementStatus 查詢參數。
- 報表：
  - GET /reports/admin：新增 financials（payableUSDReady/payableUSDSettled/outstandingUSD）。
  - GET /reports/teacher：新增 earnings（pendingUSD/readyUSD/settledUSD/byMonth）。

## 使用流程

### 老師提交課後證據與評語
1. 取得我的預約：
   - GET /bookings?roleView=teacher&from=...&to=...
2. 上傳證據（截圖）並綁定 booking：
   - POST /bookings/{bookingId}/evidence（multipart/form-data, file）
3. 提交課後報告與評語：
   - POST /post-class/{bookingId}/teacher-report
     - rubrics: {...}
     - commentToStudent: "今天表現很棒..."
     - evidenceFileIds: ["{fileId1}", "{fileId2}"]

> 注意：亦可不走 evidenceFileIds，直接傳 evidenceUrls（預先上傳 /uploads/class_recording 取得 public/private URL 後使用）。

### 管理員檢視與篩選
- GET /admin/bookings?teacherId=...&studentId=...&hasEvidence=true&settlementStatus=ready&from=...&to=...
- 查看單筆詳情（含 progress 與 postClass.evidence/teacherComment）：
  - GET /bookings/{id}
- 整體報表與結算彙總：
  - GET /reports/admin（含 financials）

### 金額結算對照
- Admin 月結列表：GET /admin/settlements（既有）
- Admin 匯總（區間維度）：GET /reports/admin（financials）
- Teacher 個人匯總：GET /reports/teacher（earnings）

## 完成進度（progress）計算
- percent：以多項指標計算（參考實作）
  - 有上課紀錄（attendance=attended 或狀態 completed）-> 加分
  - 提交老師報告（hasReport）-> 加分
  - 上傳證據（evidenceCount>0）-> 加分
  - 結算 ready/settled -> 加分
- attendance：unknown/attended/noshow
- settlementStatus：pending/blocked/ready/settled

## 資料庫變更
- 新增表 booking_evidences（關聯 bookings 與 uploads）：
  ```sql
  CREATE TABLE IF NOT EXISTS booking_evidences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (booking_id, file_id)
  );
  CREATE INDEX IF NOT EXISTS idx_booking_evidences_booking ON booking_evidences(booking_id);
  ```
- 在 bookings 表加入以下欄位：
  ```sql
  ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS teacher_comment TEXT,
    ADD COLUMN IF NOT EXISTS teacher_report_submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS post_class_report_status TEXT CHECK (post_class_report_status IN ('none','submitted','verified')) DEFAULT 'none';
  ```
- 權限：確保 uploads 之 class_recording 設為私有，僅 booking 的 teacher/admin/student 可透過簽名 URL 讀取。

## 測試指引（curl 範例）

- 老師上傳證據
  ```bash
  curl -X POST "http://localhost:3001/bookings/{BOOKING_ID}/evidence" \
    -H "Authorization: Bearer $TEACHER_JWT" \
    -F "file=@/path/to/screenshot.png"
  ```

- 老師提交課後報告
  ```bash
  curl -X POST "http://localhost:3001/post-class/{BOOKING_ID}/teacher-report" \
    -H "Authorization: Bearer $TEACHER_JWT" \
    -H "Content-Type: application/json" \
    -d '{
      "rubrics": { "performance": "Good", "grammar": "B1" },
      "commentToStudent": "今天進步很多！",
      "evidenceFileIds": ["{FILE_ID_1}","{FILE_ID_2}"]
    }'
  ```

- 管理員按條件查詢預約（有證據且可結算）
  ```bash
  curl "http://localhost:3001/admin/bookings?hasEvidence=true&settlementStatus=ready&from=2025-10-01T00:00:00Z&to=2025-10-31T23:59:59Z" \
    -H "Authorization: Bearer $ADMIN_JWT"
  ```

- 報表：Admin 匯總（含 financials）
  ```bash
  curl "http://localhost:3001/reports/admin?from=2025-10-01T00:00:00Z&to=2025-10-31T23:59:59Z" \
    -H "Authorization: Bearer $ADMIN_JWT"
  ```

- 報表：Teacher 匯總（earnings）
  ```bash
  curl "http://localhost:3001/reports/teacher?from=2025-10-01T00:00:00Z&to=2025-10-31T23:59:59Z" \
    -H "Authorization: Bearer $TEACHER_JWT"
  ```

## 部署與回歸
1. 新增 SQL 遷移檔並套用。
2. 更新 openAPI.yaml 為 1.3.0。
3. 重建/重啟 API 服務。
4. 執行既有測試腳本（test_all_apis.sh / test_e2e_all.js）。
5. 手動驗證新端點（上傳、報告、查詢、報表）。

## 變更日誌
- v1.3.0
  - 新增 booking 級別證據上傳/查詢/刪除
  - 老師課後評語+檔案 ID 綁定
  - Admin 全域預約報表清單（進度/證據/結算篩選）
  - Admin/Teacher 報表加入結算金額彙總
  - BookingDetail 補進度(progress)與 postClass.evidence/comment
  - 更新 upload.config.ts 允許 class_recording 接受圖片格式（jpg/png/webp）
  - 新增 ReportsModule 與 ReportsController
  - 新增 BookingEvidence entity 與資料庫遷移
  - 在 demo.html 新增報表功能頁面

## 已實現功能
✅ 課後證據上傳與綁定 booking
✅ 老師課後評語（commentToStudent）
✅ Admin 全域預約查詢（/admin/bookings）
✅ 報表端點（/reports/admin 與 /reports/teacher）
✅ 資料庫遷移（booking_evidences 表與 bookings 欄位擴充）
✅ demo.html 報表頁面

## 待完善功能
- [ ] 完整的 progress 計算邏輯（目前僅基礎統計）
- [ ] 結算金額細分（pending/ready/settled）需接入實際 settlement 表
- [ ] 證據檔案的簽名 URL 權限控制（目前僅返回 publicUrl）
- [ ] 更詳細的篩選條件（hasReport/hasEvidence/settlementStatus）
- [ ] 月度報表細分（byMonth earnings）

