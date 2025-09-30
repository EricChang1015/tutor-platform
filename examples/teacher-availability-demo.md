# Teacher Availability System Demo

This document demonstrates how to use the new teacher availability system with time slot-based booking.

## Time Slot System

The system uses fixed 30-minute time slots:
- Time slots are numbered 0-47 (representing 00:00-23:30)
- Each slot represents a 30-minute period
- Bookings must align to these time slots

### Time Slot Examples
- Slot 0: 00:00-00:30
- Slot 1: 00:30-01:00
- Slot 18: 09:00-09:30
- Slot 36: 18:00-18:30
- Slot 47: 23:30-24:00

## API Examples

### 1. Search Available Teachers by Time Range

```bash
curl 'http://localhost:3001/teacher-availability/search-teachers?date=2025-10-01&fromTime=18:00&toTime=23:30'
```

Response:
```json
{
  "code": 0,
  "msg": "ok",
  "data": ["22222222-2222-2222-2222-222222222222"]
}
```

### 2. Get Teacher Timetable

```bash
curl 'http://localhost:3001/teacher-availability/teacher-timetable?teacherId=22222222-2222-2222-2222-222222222222&date=2025-10-01'
```

Response:
```json
{
  "code": 0,
  "msg": "ok",
  "data": [
    {
      "id": "availability-id-1",
      "uid": 0,
      "date": "2025-10-01",
      "time": "09:00",
      "isOnline": 1,
      "isReserve": 0,
      "canReserve": 1,
      "reason": null
    },
    {
      "id": "availability-id-2",
      "uid": 1,
      "date": "2025-10-01",
      "time": "09:30",
      "isOnline": 2,
      "isReserve": 1,
      "canReserve": 0,
      "reason": "已被约"
    }
  ]
}
```

### 3. Get Time Slot Information

```bash
curl 'http://localhost:3001/teacher-availability/time-slot/availability-id-1'
```

Response:
```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "id": "availability-id-1",
    "uid": "22222222-2222-2222-2222-222222222222",
    "storeId": 5608,
    "tname": "Teacher One",
    "date": "2025-10-01",
    "time": "09:00",
    "isOnline": 1,
    "canReserve": 1,
    "reason": null
  }
}
```

### 4. Create Booking with Time Slot Validation

```bash
curl -X POST 'http://localhost:3001/bookings' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "teacherId": "22222222-2222-2222-2222-222222222222",
    "startsAt": "2025-10-01T09:00:00.000Z",
    "durationMinutes": 30,
    "courseTitle": "English Conversation",
    "message": "Looking forward to the lesson!"
  }'
```

### 5. Set Teacher Availability (Teacher/Admin only)

```bash
curl -X POST 'http://localhost:3001/teacher-availability/set-availability' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "teacherId": "22222222-2222-2222-2222-222222222222",
    "date": "2025-10-01",
    "timeSlots": [18, 19, 20, 21, 22, 23, 24, 25],
    "status": "available"
  }'
```

### 6. Set Weekly Availability

```bash
curl -X POST 'http://localhost:3001/teacher-availability/set-weekly-availability' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "teacherId": "22222222-2222-2222-2222-222222222222",
    "startDate": "2025-10-01",
    "weeklySchedule": {
      "1": [18, 19, 20, 21, 22, 23, 24, 25],
      "2": [18, 19, 20, 21, 22, 23, 24, 25],
      "3": [18, 19, 20, 21, 22, 23, 24, 25],
      "4": [18, 19, 20, 21, 22, 23, 24, 25],
      "5": [18, 19, 20, 21, 22, 23, 24, 25]
    }
  }'
```

## Booking Validation Rules

### 1. Time Slot Alignment
- Bookings must start at :00 or :30 minutes
- Duration must be a multiple of 30 minutes

### 2. Teacher Availability
- Teacher must have available time slots for the requested period
- System checks all required time slots are available

### 3. Conflict Prevention
- No overlapping bookings for the same teacher
- No overlapping bookings for the same student

### 4. Examples of Valid/Invalid Bookings

#### Valid Bookings:
```json
{
  "startsAt": "2025-10-01T09:00:00.000Z",
  "durationMinutes": 30
}
```

```json
{
  "startsAt": "2025-10-01T14:30:00.000Z",
  "durationMinutes": 60
}
```

#### Invalid Bookings:
```json
{
  "startsAt": "2025-10-01T09:15:00.000Z",  // Not aligned to time slot
  "durationMinutes": 30
}
```

```json
{
  "startsAt": "2025-10-01T09:00:00.000Z",
  "durationMinutes": 45  // Not a multiple of 30
}
```

## Database Schema

The system uses a `teacher_availability` table with the following structure:

```sql
CREATE TABLE teacher_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot INTEGER NOT NULL CHECK (time_slot >= 0 AND time_slot <= 47),
    status VARCHAR(20) CHECK (status IN ('available', 'booked', 'unavailable')) DEFAULT 'available',
    booking_id UUID NULL REFERENCES bookings(id) ON DELETE SET NULL,
    reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, date, time_slot)
);
```

## Migration

To add the teacher availability system to your existing database, run:

```bash
psql -d your_database -f database/migrations/001_add_teacher_availability.sql
```

This will:
1. Create the `teacher_availability` table
2. Add necessary indexes for performance
3. Create sample availability data for existing teachers
4. Add triggers for automatic conflict checking
