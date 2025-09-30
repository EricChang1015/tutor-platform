import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { LibraryService } from './library.service';

@ApiTags('Library')
@Controller('library')
export class LibraryController {
  constructor(private libraryService: LibraryService) {}

  @Get()
  @ApiOperation({ summary: '取得教材資料夾樹或扁平清單' })
  @ApiQuery({ name: 'include', required: false, enum: ['all', 'root', 'flat'] })
  @ApiQuery({ name: 'depth', required: false, type: 'number' })
  @ApiResponse({ status: 200, description: '教材庫資料' })
  async getLibrary(@Query() query: any) {
    return this.libraryService.getLibrary(query);
  }

  @Get('materials/:id')
  @ApiOperation({ summary: '取得教材詳細內容' })
  @ApiResponse({ status: 200, description: '教材詳細資料' })
  @ApiResponse({ status: 404, description: '教材不存在' })
  async getMaterial(@Param('id') id: string) {
    return this.libraryService.getMaterial(id);
  }
}
