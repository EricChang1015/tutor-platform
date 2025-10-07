import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: '取得使用者公開資訊' })
  @ApiResponse({ status: 200, description: '使用者資訊' })
  @ApiResponse({ status: 404, description: '使用者不存在' })
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新使用者個人資料' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授權' })
  @ApiResponse({ status: 403, description: '權限不足' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    return this.usersService.updateUser(id, updateUserDto, req.user.sub, req.user.role);
  }

  @Post(':id/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '上傳使用者頭像' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: '頭像上傳成功' })
  @ApiResponse({ status: 400, description: '文件格式或大小不符合要求' })
  @ApiResponse({ status: 401, description: '未授權' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No avatar file provided');
    }

    // 檢查權限：只能上傳自己的頭像（管理員除外）
    if (req.user.role !== 'admin' && id !== req.user.sub) {
      throw new BadRequestException('Can only upload own avatar');
    }

    return this.usersService.uploadAvatar(id, file);
  }

  @Get(':id/avatar')
  @ApiOperation({ summary: '獲取使用者頭像 URL' })
  @ApiResponse({ status: 200, description: '頭像 URL' })
  async getAvatarUrl(@Param('id') id: string) {
    const avatarUrl = await this.usersService.getAvatarUrl(id);
    return { avatarUrl };
  }
}
