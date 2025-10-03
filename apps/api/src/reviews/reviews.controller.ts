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

import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: '查詢評價' })
  @ApiQuery({ name: 'teacherId', required: false, type: 'string' })
  @ApiQuery({ name: 'studentId', required: false, type: 'string' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'pageSize', required: false, type: 'number' })
  @ApiResponse({ status: 200, description: '評價列表' })
  async getReviews(@Query() query: any) {
    return this.reviewsService.findAll(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '新增評價（學生端，一堂課僅能一次）' })
  @ApiResponse({ status: 201, description: '評價建立成功' })
  @ApiResponse({ status: 409, description: '該 booking 已有評價' })
  @ApiResponse({ status: 422, description: 'booking 非 completed 或非本人' })
  async createReview(@Body() createReviewDto: any, @Request() req) {
    return this.reviewsService.create(createReviewDto, req.user.sub);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '審核通過' })
  @ApiResponse({ status: 200, description: '審核通過' })
  async approveReview(@Param('id') id: string, @Request() req) {
    // 檢查管理員權限
    if (req.user.role !== 'admin') {
      throw new Error('Only admin can approve reviews');
    }
    
    return this.reviewsService.approve(id);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '審核拒絕' })
  @ApiResponse({ status: 200, description: '審核拒絕' })
  async rejectReview(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req,
  ) {
    // 檢查管理員權限
    if (req.user.role !== 'admin') {
      throw new Error('Only admin can reject reviews');
    }
    
    return this.reviewsService.reject(id, body.reason);
  }
}
