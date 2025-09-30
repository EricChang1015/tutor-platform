import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: '取得收藏列表' })
  @ApiResponse({ status: 200, description: '收藏列表' })
  async getFavorites(@Request() req) {
    return this.favoritesService.getFavorites(req.user.sub);
  }

  @Post()
  @ApiOperation({ summary: '新增收藏' })
  @ApiResponse({ status: 201, description: '收藏成功' })
  @ApiResponse({ status: 409, description: '重複收藏' })
  async addFavorite(
    @Body() body: { teacherId: string },
    @Request() req,
  ) {
    return this.favoritesService.addFavorite(req.user.sub, body.teacherId);
  }

  @Delete(':teacherId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '移除收藏' })
  @ApiResponse({ status: 204, description: '移除成功' })
  async removeFavorite(
    @Param('teacherId') teacherId: string,
    @Request() req,
  ) {
    await this.favoritesService.removeFavorite(req.user.sub, teacherId);
  }
}
