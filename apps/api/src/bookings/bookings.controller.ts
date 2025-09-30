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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: '我的預約清單' })
  @ApiResponse({ status: 200, description: '預約清單' })
  async getBookings(@Query() query: any, @Request() req) {
    return this.bookingsService.findUserBookings(req.user.sub, query);
  }

  @Post()
  @ApiOperation({ summary: '建立預約' })
  @ApiResponse({ status: 201, description: '預約建立成功' })
  @ApiResponse({ status: 409, description: '時間衝突' })
  @ApiResponse({ status: 422, description: '政策違反' })
  async createBooking(@Body() createBookingDto: any, @Request() req) {
    return this.bookingsService.createBooking(createBookingDto, req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: '取得預約詳情' })
  @ApiResponse({ status: 200, description: '預約詳情' })
  @ApiResponse({ status: 404, description: '預約不存在' })
  async getBooking(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }
}
