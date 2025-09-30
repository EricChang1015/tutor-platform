import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '登入' })
  @ApiResponse({ status: 200, description: '登入成功' })
  @ApiResponse({ status: 401, description: '認證失敗' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重新取得存取權杖' })
  @ApiResponse({ status: 200, description: '權杖更新成功' })
  @ApiResponse({ status: 401, description: '無效的刷新權杖' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '登出' })
  @ApiResponse({ status: 204, description: '登出成功' })
  async logout() {
    // 在實際應用中，這裡應該將 JWT 加入黑名單
    // 目前簡化處理，客戶端需要自行清除 token
    return;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取得目前使用者資訊' })
  @ApiResponse({ status: 200, description: '使用者資訊' })
  @ApiResponse({ status: 401, description: '未授權' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @Post('demo-reset')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '重置 Demo（限 admin）' })
  @ApiResponse({ status: 200, description: 'Demo 重置成功' })
  async demoReset(@Request() req) {
    // 檢查是否為管理員
    if (req.user.role !== 'admin') {
      throw new Error('Only admin can reset demo');
    }
    
    // 這裡可以實現重置 demo 資料的邏輯
    return { ok: true };
  }
}
