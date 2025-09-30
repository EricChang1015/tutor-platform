import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TeacherAvailabilityService, SearchTeachersQuery, TeacherTimetableQuery } from './teacher-availability.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TimeSlotUtil } from '../common/time-slots.util';

@ApiTags('Teacher Availability')
@Controller('teacher-availability')
export class TeacherAvailabilityController {
  constructor(private teacherAvailabilityService: TeacherAvailabilityService) {}

  @Get('search-teachers')
  @ApiOperation({ summary: '搜尋時間段內可用的教師' })
  @ApiQuery({ name: 'date', description: '日期 (YYYY-MM-DD)', example: '2025-10-01' })
  @ApiQuery({ name: 'fromTime', description: '開始時間 (HH:MM)', example: '18:00' })
  @ApiQuery({ name: 'toTime', description: '結束時間 (HH:MM)', example: '23:30' })
  @ApiResponse({ 
    status: 200, 
    description: '可用教師 IDs',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'ok' },
        data: {
          type: 'array',
          items: { type: 'string' },
          example: ['44385', '32839', '45367']
        }
      }
    }
  })
  async searchTeachers(@Query() query: SearchTeachersQuery) {
    try {
      const { date, fromTime, toTime } = query;
      
      // 驗證參數
      if (!date || !fromTime || !toTime) {
        throw new BadRequestException('Missing required parameters: date, fromTime, toTime');
      }

      // 驗證時間格式
      if (!this.isValidTimeFormat(fromTime) || !this.isValidTimeFormat(toTime)) {
        throw new BadRequestException('Invalid time format. Use HH:MM');
      }

      // 驗證日期格式
      if (!this.isValidDateFormat(date)) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }

      const teacherIds = await this.teacherAvailabilityService.searchAvailableTeachers(query);
      
      return {
        code: 0,
        msg: 'ok',
        data: teacherIds
      };
    } catch (error) {
      return {
        code: 1,
        msg: error.message,
        data: []
      };
    }
  }

  @Get('teacher-timetable')
  @ApiOperation({ summary: '取得教師時間表' })
  @ApiQuery({ name: 'teacherId', description: '教師 ID' })
  @ApiQuery({ name: 'date', description: '日期 (YYYY-MM-DD)', example: '2025-10-01' })
  @ApiResponse({ 
    status: 200, 
    description: '教師時間表',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'ok' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              uid: { type: 'number' },
              date: { type: 'string' },
              time: { type: 'string' },
              isOnline: { type: 'number' },
              isReserve: { type: 'number' },
              canReserve: { type: 'number' },
              reason: { type: 'string', nullable: true }
            }
          }
        }
      }
    }
  })
  async getTeacherTimetable(@Query() query: TeacherTimetableQuery) {
    try {
      const { teacherId, date } = query;
      
      // 驗證參數
      if (!teacherId || !date) {
        throw new BadRequestException('Missing required parameters: teacherId, date');
      }

      // 驗證日期格式
      if (!this.isValidDateFormat(date)) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }

      const timetable = await this.teacherAvailabilityService.getTeacherTimetable(query);
      
      return {
        code: 0,
        msg: 'ok',
        data: timetable
      };
    } catch (error) {
      return {
        code: 1,
        msg: error.message,
        data: []
      };
    }
  }

  @Get('time-slot/:id')
  @ApiOperation({ summary: '取得時間槽詳細資訊' })
  @ApiResponse({ 
    status: 200, 
    description: '時間槽詳細資訊',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'ok' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            uid: { type: 'string' },
            storeId: { type: 'number' },
            tname: { type: 'string' },
            date: { type: 'string' },
            time: { type: 'string' },
            isOnline: { type: 'number' },
            canReserve: { type: 'number' },
            reason: { type: 'string', nullable: true }
          }
        }
      }
    }
  })
  async getTimeSlotInfo(@Param('id') id: string) {
    try {
      const timeSlotInfo = await this.teacherAvailabilityService.getTimeSlotInfo(id);
      
      return {
        code: 0,
        msg: 'ok',
        data: timeSlotInfo
      };
    } catch (error) {
      return {
        code: 1,
        msg: error.message,
        data: null
      };
    }
  }

  @Post('set-availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '設定教師可用時間' })
  @ApiResponse({ status: 201, description: '設定成功' })
  async setAvailability(@Body() body: any, @Request() req) {
    try {
      const { teacherId, date, timeSlots, status } = body;
      
      // 如果是教師自己設定，使用當前用戶 ID
      const targetTeacherId = teacherId || req.user.sub;
      
      await this.teacherAvailabilityService.setTeacherAvailability(
        targetTeacherId,
        date,
        timeSlots,
        status
      );
      
      return {
        code: 0,
        msg: 'ok',
        data: null
      };
    } catch (error) {
      return {
        code: 1,
        msg: error.message,
        data: null
      };
    }
  }

  @Post('set-weekly-availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '設定教師一週可用時間' })
  @ApiResponse({ status: 201, description: '設定成功' })
  async setWeeklyAvailability(@Body() body: any, @Request() req) {
    try {
      const { teacherId, startDate, weeklySchedule } = body;
      
      // 如果是教師自己設定，使用當前用戶 ID
      const targetTeacherId = teacherId || req.user.sub;
      
      await this.teacherAvailabilityService.setWeeklyAvailability(
        targetTeacherId,
        startDate,
        weeklySchedule
      );
      
      return {
        code: 0,
        msg: 'ok',
        data: null
      };
    } catch (error) {
      return {
        code: 1,
        msg: error.message,
        data: null
      };
    }
  }

  @Get('time-slots')
  @ApiOperation({ summary: '取得所有時間槽列表' })
  @ApiResponse({ 
    status: 200, 
    description: '時間槽列表',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'ok' },
        data: {
          type: 'array',
          items: { type: 'string' },
          example: ['00:00', '00:30', '01:00']
        }
      }
    }
  })
  async getAllTimeSlots() {
    return {
      code: 0,
      msg: 'ok',
      data: TimeSlotUtil.getAllTimeSlots()
    };
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  private isValidDateFormat(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const dateObj = new Date(date);
    return dateObj.toISOString().split('T')[0] === date;
  }
}
