# API Implementation Confirmation Required

This document lists APIs that need clarification or confirmation regarding their implementation.

## Missing Implementations

### 1. Library/Materials Management
**Status**: Partially implemented
- ✅ `GET /library` - Basic implementation exists
- ✅ `GET /library/materials/:id` - Basic implementation exists
- ❌ `POST /library` - Create folder (not implemented)
- ❌ `PATCH /library/:id` - Update folder (not implemented)
- ❌ `DELETE /library/:id` - Delete folder (not implemented)
- ❌ `GET /materials` - List materials with filtering (not implemented)
- ❌ `POST /materials` - Create material (not implemented)
- ❌ `PATCH /materials/:id` - Update material (not implemented)
- ❌ `DELETE /materials/:id` - Delete material (not implemented)

**Questions**:
1. Should materials be managed through `/library` or `/materials` endpoints?
2. What's the relationship between library folders and materials?
3. Should we implement both or consolidate into one approach?

### 2. Favorites System
**Status**: Controller exists but needs verification
- ✅ Controller implemented: `FavoritesController`
- ❓ Need to verify actual functionality and database integration

### 3. File Upload System
**Status**: Not implemented
- ❌ `POST /uploads/url` - Get presigned upload URL
- ❌ File storage integration (MinIO/S3)

**Questions**:
1. Should we implement MinIO integration for file uploads?
2. What file types and size limits should be supported?

### 4. Timeslots & Holds System
**Status**: Not implemented
- ❌ `GET /timeslots` - Search available timeslots
- ❌ `POST /holds` - Create temporary booking hold
- ❌ `DELETE /holds/:id` - Cancel booking hold

**Questions**:
1. Is this system needed alongside the current teacher-availability system?
2. Should we implement booking holds to prevent race conditions?

### 5. Post-Class Reports
**Status**: Not implemented
- ❌ `POST /post-class/:id/teacher-report` - Teacher post-class report
- ❌ `POST /post-class/:id/student-goal` - Student learning goals

### 6. Advanced Booking Features
**Status**: Partially implemented
- ✅ Basic booking CRUD exists
- ❌ `POST /bookings/:id/messages` - Booking messages
- ❌ `POST /bookings/:id/reschedule` - Reschedule booking
- ❌ `POST /bookings/:id/cancel` - Cancel booking with policies
- ❌ `GET /bookings/:id/ics` - Download calendar file
- ❌ `POST /bookings/:id/confirm` - Teacher/admin confirm booking

### 7. Purchase & Consumption System
**Status**: Basic implementation exists, advanced features missing
- ✅ Basic purchases controller exists
- ❌ `POST /purchases/:id/activate` - Activate cards
- ❌ `POST /purchases/:id/extend` - Admin extend expiry
- ❌ `GET /consumptions` - Consumption records

### 8. Cancellation Policies
**Status**: Not implemented
- ❌ `POST /cancellations/policy-preview` - Preview cancellation policy

### 9. Reviews System
**Status**: Not implemented
- ❌ `GET /reviews` - List reviews
- ❌ `POST /reviews` - Create review
- ❌ `POST /reviews/:id/approve` - Admin approve review
- ❌ `POST /reviews/:id/reject` - Admin reject review

### 10. Notifications System
**Status**: Entity exists, controller not implemented
- ❌ `GET /notifications` - List notifications
- ❌ `POST /notifications/ack/:id` - Mark single notification as read
- ❌ `POST /notifications/ack` - Batch mark notifications as read
- ❌ `GET /notifications/stream` - SSE notification stream

### 11. Gallery System
**Status**: Entity exists, controller not implemented
- ❌ `POST /teachers/:id/gallery` - Upload teacher gallery
- ❌ `DELETE /teachers/:id/gallery/:mediaId` - Delete gallery item

### 12. Admin Advanced Features
**Status**: Basic admin features implemented, advanced missing
- ✅ Basic admin functions (create teacher/student, reset data)
- ❌ `POST /admin/bookings` - Admin create booking for student
- ❌ `POST /admin/bookings/:id/compensate` - Compensate for technical issues
- ❌ `POST /admin/bookings/:id/mark-noshow` - Mark no-show
- ❌ `GET /admin/settlements` - Teacher settlements
- ❌ `POST /admin/settlements/:teacherId/:month/approve` - Approve settlement
- ❌ `GET /admin/reviews` - Review moderation
- ❌ `GET /admin/stats` - Admin dashboard stats

### 13. Reports System
**Status**: Not implemented
- ❌ `GET /reports/admin` - Admin reports
- ❌ `GET /reports/teacher` - Teacher reports

### 14. Auto Assignment System
**Status**: Not implemented
- ❌ `POST /assignments/auto` - Auto assign teacher for free talk

### 15. Meta Data APIs
**Status**: Not implemented
- ❌ `GET /meta/domains` - Available course domains
- ❌ `GET /meta/regions` - Available regions
- ❌ `GET /meta/sort-options` - Available sort options

## UI Design vs Implementation Gaps

### 1. Authentication Flow
**UI Design**: Shows login with admin/student/teacher roles
**Implementation**: ✅ Fully implemented and working

### 2. Teacher Search & Filtering
**UI Design**: Shows filtering by domain, region, sorting options
**Implementation**: ✅ Implemented but could use meta APIs for filter options

### 3. Materials Management
**UI Design**: Shows folder tree structure, add/edit materials
**Implementation**: ❌ Basic library API exists but full CRUD missing

### 4. Booking Calendar
**UI Design**: Shows calendar interface, time slot selection
**Implementation**: ✅ Teacher availability system implemented

### 5. Admin Panel
**UI Design**: Shows comprehensive admin features
**Implementation**: ⚠️ Basic admin features only, many advanced features missing

## Priority Recommendations

### High Priority (Core Functionality)
1. Complete materials/library management system
2. Implement booking messages and reschedule
3. Implement reviews system
4. Add notifications system

### Medium Priority (Enhanced UX)
1. File upload system
2. Booking holds/timeslots system
3. Post-class reports
4. Gallery system

### Low Priority (Advanced Features)
1. Advanced admin features (settlements, compensation)
2. Reports system
3. Auto assignment system
4. SSE notifications

## Questions for Clarification

1. **Materials vs Library**: Should we consolidate these into one system or keep separate?
2. **File Storage**: Do we need to implement MinIO integration for file uploads?
3. **Booking Holds**: Is the temporary hold system necessary for the MVP?
4. **Notifications**: Should we implement real-time SSE notifications or just basic CRUD?
5. **Admin Features**: Which admin features are essential for the MVP vs nice-to-have?
6. **Reports**: Are detailed reports needed for the initial release?
