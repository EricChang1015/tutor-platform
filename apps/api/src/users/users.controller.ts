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
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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
  @UseInterceptors(AnyFilesInterceptor())
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() _ignored: any,
    @Request() req,
  ) {
    // 同時兼容前端可能傳遞的 `avatar` 或 `file` 欄位
    const files = (req as any).files as any[] | undefined;
    const file = files?.find(f => f.fieldname === 'avatar') || files?.find(f => f.fieldname === 'file');
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

  @Post(':id/change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改使用者密碼' })
  @ApiResponse({ status: 200, description: '密碼修改成功' })
  @ApiResponse({ status: 400, description: '密碼驗證失敗' })
  @ApiResponse({ status: 401, description: '未授權' })
  @ApiResponse({ status: 403, description: '權限不足' })
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req,
  ) {
    // 檢查權限：只能修改自己的密碼（管理員除外）
    if (req.user.role !== 'admin' && id !== req.user.sub) {
      throw new BadRequestException('Can only change own password');
    }

    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Get(':id/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '獲取使用者完整個人資料' })
  @ApiResponse({ status: 200, description: '個人資料' })
  @ApiResponse({ status: 401, description: '未授權' })
  @ApiResponse({ status: 403, description: '權限不足' })
  async getUserProfile(
    @Param('id') id: string,
    @Request() req,
  ) {
    // 檢查權限：只能查看自己的完整資料（管理員除外）
    if (req.user.role !== 'admin' && id !== req.user.sub) {
      throw new BadRequestException('Can only view own profile');
    }

    return this.usersService.getUserProfile(id);
  }
}
