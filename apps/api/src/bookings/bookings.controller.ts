import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';

import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: '我的預約清單' })
  @ApiQuery({ name: 'timezone', description: 'IANA 時區名稱', example: 'Asia/Taipei', required: false })
  @ApiQuery({ name: 'roleView', description: '角色視圖 (student/teacher)', required: false })
  @ApiQuery({ name: 'status', description: '狀態過濾 (upcoming/past/canceled/pending)', required: false })
  @ApiResponse({ status: 200, description: '預約清單' })
  async getBookings(@Query() query: any, @Request() req) {
    return this.bookingsService.findUserBookings(req.user.sub, query);
  }

  @Post()
  @ApiOperation({
    summary: '建立預約',
    description: 'startsAt 應為 ISO 8601 格式（含時區），例如: 2025-10-06T14:00:00+08:00。系統會自動驗證教師可用性和時間衝突。'
  })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({ status: 201, description: '預約建立成功' })
  @ApiResponse({ status: 409, description: '時間衝突' })
  @ApiResponse({ status: 422, description: '政策違反/無可用次卡' })
  async createBooking(@Body() createBookingDto: CreateBookingDto, @Request() req) {
    return this.bookingsService.createBooking(createBookingDto, req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: '取得預約詳情' })
  @ApiResponse({ status: 200, description: '預約詳情' })
  @ApiResponse({ status: 404, description: '預約不存在' })
  async getBooking(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: '取消預約',
    description: '依角色與距離上課時間套用取消政策。學生取消會根據時間扣除取消卡，教師/管理員取消會退還學生課卡。'
  })
  @ApiBody({ type: CancelBookingDto, required: false })
  @ApiResponse({ status: 200, description: '取消成功' })
  @ApiResponse({ status: 404, description: '預約不存在' })
  @ApiResponse({ status: 422, description: '政策違反或不可取消時間窗' })
  async cancelBooking(
    @Param('id') id: string,
    @Body() cancelBookingDto: CancelBookingDto,
    @Request() req
  ) {
    return this.bookingsService.cancelBooking(id, cancelBookingDto, req.user);
  }
}
