import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiConsumes,
  ApiQuery,
  ApiParam
} from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileCategory } from './upload.config';

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post(':category')
  @ApiOperation({ summary: '上傳文件' })
  @ApiParam({ 
    name: 'category', 
    enum: FileCategory,
    description: '文件類型分類'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: '文件上傳成功' })
  @ApiResponse({ status: 400, description: '文件格式或大小不符合要求' })
  @ApiResponse({ status: 403, description: '沒有權限上傳此類型文件' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('category') category: string,
    @UploadedFile() file: any,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!Object.values(FileCategory).includes(category as FileCategory)) {
      throw new BadRequestException('Invalid file category');
    }

    const upload = await this.uploadsService.uploadFile(
      req.user.sub,
      file,
      category as FileCategory
    );

    return {
      id: upload.id,
      originalName: upload.originalName,
      fileName: upload.fileName,
      fileSize: upload.fileSize,
      mimeType: upload.mimeType,
      category: upload.category,
      visibility: upload.visibility,
      publicUrl: upload.publicUrl,
      cdnUrl: upload.cdnUrl,
      createdAt: upload.createdAt,
    };
  }

  @Get('my-files')
  @ApiOperation({ summary: '取得用戶上傳的文件列表' })
  @ApiQuery({ name: 'category', required: false, enum: FileCategory })
  @ApiQuery({ name: 'page', required: false, type: 'number', example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: 'number', example: 20 })
  @ApiResponse({ status: 200, description: '文件列表' })
  async getMyFiles(
    @Request() req,
    @Query('category') category?: FileCategory,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number = 20,
  ) {
    return await this.uploadsService.getUserFiles(req.user.sub, category, page, pageSize);
  }

  @Get(':fileId')
  @ApiOperation({ summary: '取得文件信息' })
  @ApiParam({ name: 'fileId', description: '文件ID' })
  @ApiResponse({ status: 200, description: '文件信息' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @ApiResponse({ status: 403, description: '沒有權限訪問此文件' })
  async getFile(@Param('fileId') fileId: string, @Request() req) {
    const upload = await this.uploadsService.getFile(fileId, req.user.sub, req.user.role);
    
    return {
      id: upload.id,
      originalName: upload.originalName,
      fileName: upload.fileName,
      fileSize: upload.fileSize,
      mimeType: upload.mimeType,
      category: upload.category,
      visibility: upload.visibility,
      publicUrl: upload.publicUrl,
      cdnUrl: upload.cdnUrl,
      metadata: upload.metadata,
      createdAt: upload.createdAt,
      updatedAt: upload.updatedAt,
    };
  }

  @Get(':fileId/url')
  @ApiOperation({ summary: '取得文件訪問URL' })
  @ApiParam({ name: 'fileId', description: '文件ID' })
  @ApiResponse({ status: 200, description: '文件訪問URL' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @ApiResponse({ status: 403, description: '沒有權限訪問此文件' })
  async getFileUrl(@Param('fileId') fileId: string, @Request() req) {
    const url = await this.uploadsService.getFileUrl(fileId, req.user.sub, req.user.role);
    return { url };
  }

  @Delete(':fileId')
  @ApiOperation({ summary: '刪除文件' })
  @ApiParam({ name: 'fileId', description: '文件ID' })
  @ApiResponse({ status: 204, description: '文件刪除成功' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @ApiResponse({ status: 403, description: '沒有權限刪除此文件' })
  async deleteFile(@Param('fileId') fileId: string, @Request() req) {
    await this.uploadsService.deleteFile(fileId, req.user.sub, req.user.role);
    return { message: 'File deleted successfully' };
  }
}
