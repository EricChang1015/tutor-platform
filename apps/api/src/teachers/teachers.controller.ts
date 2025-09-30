import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { TeachersService } from './teachers.service';

@ApiTags('Teachers')
@Controller('teachers')
export class TeachersController {
  constructor(private teachersService: TeachersService) {}

  @Get()
  @ApiOperation({ summary: '教師清單' })
  @ApiQuery({ name: 'domain', required: false, description: '教學領域' })
  @ApiQuery({ name: 'region', required: false, description: '教學地區' })
  @ApiQuery({ name: 'q', required: false, description: '搜尋關鍵字' })
  @ApiQuery({ name: 'sort', required: false, description: '排序方式' })
  @ApiQuery({ name: 'page', required: false, description: '頁數' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每頁筆數' })
  @ApiResponse({ status: 200, description: '教師清單' })
  async getTeachers(@Query() query: any) {
    return this.teachersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '教師詳細資訊' })
  @ApiResponse({ status: 200, description: '教師詳細資訊' })
  @ApiResponse({ status: 404, description: '教師不存在' })
  async getTeacher(@Param('id') id: string) {
    return this.teachersService.findById(id);
  }
}
