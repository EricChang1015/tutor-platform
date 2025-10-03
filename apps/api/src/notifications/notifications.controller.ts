import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '通知列表' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: 'boolean' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'pageSize', required: false, type: 'number' })
  @ApiResponse({ status: 200, description: '通知列表' })
  async getNotifications(@Query() query: any, @Request() req) {
    return this.notificationsService.findUserNotifications(req.user.sub, query);
  }

  @Post('ack/:id')
  @ApiOperation({ summary: '單筆已讀' })
  @ApiResponse({ status: 200, description: '標記已讀成功' })
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }

  @Post('ack')
  @ApiOperation({ summary: '批次已讀' })
  @ApiResponse({ status: 200, description: '批次標記已讀成功' })
  async markMultipleAsRead(
    @Body() body: { ids: string[] },
    @Request() req,
  ) {
    return this.notificationsService.markMultipleAsRead(body.ids, req.user.sub);
  }
}
