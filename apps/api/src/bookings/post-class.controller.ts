import { Controller, Post, Param, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingsService } from './bookings.service';

@ApiTags('Post-Class')
@Controller('post-class')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PostClassController {
  constructor(private bookingsService: BookingsService) {}

  @Post(':id/teacher-report')
  @ApiOperation({ summary: '老師課後回報與上傳證明' })
  @ApiResponse({ status: 200, description: '回報完成' })
  async teacherReport(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req,
  ) {
    if (!body || !body.rubrics) throw new BadRequestException('rubrics is required');
    return this.bookingsService.submitTeacherReport(id, req.user, body);
  }
}

