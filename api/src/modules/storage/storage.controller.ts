import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import { GetUploadUrlDto } from './dto/get-upload-url.dto';

@Controller('storage')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload-url')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async getUploadUrl(@Req() req: any, @Body() dto: GetUploadUrlDto) {
    return this.storageService.getUploadUrl(req.user.sub, req.user.role, dto);
  }

  @Get('download-url/:fileKey')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async getDownloadUrl(@Param('fileKey') fileKey: string, @Req() req: any) {
    // URL decode the file key since it might contain special characters
    const decodedFileKey = decodeURIComponent(fileKey);
    return this.storageService.getDownloadUrl(decodedFileKey, req.user.sub, req.user.role);
  }

  @Delete(':fileKey')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async deleteFile(@Param('fileKey') fileKey: string, @Req() req: any) {
    const decodedFileKey = decodeURIComponent(fileKey);
    return this.storageService.deleteFile(decodedFileKey, req.user.sub, req.user.role);
  }

  @Get('my-files')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async listMyFiles(@Req() req: any) {
    return this.storageService.listUserFiles(req.user.sub, req.user.role);
  }

  @Get('files/:userId')
  @Roles(Role.Admin)
  async listUserFiles(@Param('userId') userId: string, @Query('role') role: string) {
    if (!role || !['admin', 'teacher', 'student'].includes(role)) {
      throw new Error('Invalid role parameter');
    }
    return this.storageService.listUserFiles(userId, role);
  }
}
