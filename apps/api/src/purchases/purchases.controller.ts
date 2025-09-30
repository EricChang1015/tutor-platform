import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Purchases')
@Controller('purchases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PurchasesController {
  constructor(private purchasesService: PurchasesService) {}

  @Get()
  @ApiOperation({ summary: '學生購買項目列表（Dashboard）' })
  @ApiResponse({ status: 200, description: '購買項目列表' })
  async getPurchases(@Query() query: any, @Request() req) {
    return this.purchasesService.findUserPurchases(req.user.sub, query);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: '啟動卡片' })
  @ApiResponse({ status: 200, description: '啟動成功' })
  async activatePurchase(@Param('id') id: string, @Request() req) {
    return this.purchasesService.activatePurchase(id, req.user.sub);
  }

  @Post(':id/extend')
  @ApiOperation({ summary: '管理員延長或修改過期時間' })
  @ApiResponse({ status: 200, description: '延長成功' })
  async extendPurchase(
    @Param('id') id: string,
    @Body() body: { newExpiresAt: string },
    @Request() req,
  ) {
    // 檢查管理員權限
    if (req.user.role !== 'admin') {
      throw new Error('Only admin can extend purchases');
    }

    return this.purchasesService.extendPurchase(id, new Date(body.newExpiresAt));
  }
}
