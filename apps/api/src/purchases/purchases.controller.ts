import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { ActivatePurchaseDto } from './dto/activate-purchase.dto';

@ApiTags('Purchases')
@Controller('purchases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PurchasesController {
  constructor(private purchasesService: PurchasesService) {}

  @Get()
  @ApiOperation({ summary: '查看購買項目列表' })
  @ApiResponse({ status: 200, description: '購買項目列表' })
  async getPurchases(@Query() query: any, @Request() req) {
    // 管理員可以查看指定學生的購買記錄
    if (req.user.role === 'admin' && query.studentId) {
      return this.purchasesService.findUserPurchases(query.studentId, query);
    }
    return this.purchasesService.findUserPurchases(req.user.sub, query);
  }

  @Post()
  @ApiOperation({ summary: '管理員創建購買項目' })
  @ApiBody({ type: CreatePurchaseDto })
  @ApiResponse({ status: 201, description: '創建成功' })
  async createPurchase(@Body() createPurchaseDto: CreatePurchaseDto, @Request() req) {
    this.checkAdminRole(req.user.role);
    return this.purchasesService.createPurchase(createPurchaseDto, req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: '查看購買項目詳情' })
  @ApiResponse({ status: 200, description: '購買項目詳情' })
  async getPurchase(@Param('id') id: string, @Request() req) {
    const purchases = await this.purchasesService.findUserPurchases(req.user.sub, { purchaseId: id });
    if (purchases.items.length === 0) {
      throw new ForbiddenException('Purchase not found or access denied');
    }
    return purchases.items[0];
  }

  @Put(':id')
  @ApiOperation({ summary: '管理員更新購買項目' })
  @ApiBody({ type: UpdatePurchaseDto })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updatePurchase(
    @Param('id') id: string,
    @Body() updatePurchaseDto: UpdatePurchaseDto,
    @Request() req,
  ) {
    this.checkAdminRole(req.user.role);
    return this.purchasesService.updatePurchase(id, updatePurchaseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '管理員刪除購買項目' })
  @ApiResponse({ status: 200, description: '刪除成功' })
  async deletePurchase(@Param('id') id: string, @Request() req) {
    this.checkAdminRole(req.user.role);
    return this.purchasesService.deletePurchase(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: '啟動卡片' })
  @ApiBody({ type: ActivatePurchaseDto, required: false })
  @ApiResponse({ status: 200, description: '啟動成功' })
  async activatePurchase(
    @Param('id') id: string,
    @Body() activateDto: ActivatePurchaseDto,
    @Request() req,
  ) {
    const isAdmin = req.user.role === 'admin';
    return this.purchasesService.activatePurchase(id, req.user.sub, activateDto, isAdmin);
  }

  @Post(':id/extend')
  @ApiOperation({ summary: '管理員延長或修改過期時間' })
  @ApiResponse({ status: 200, description: '延長成功' })
  async extendPurchase(
    @Param('id') id: string,
    @Body() body: { newExpiresAt: string },
    @Request() req,
  ) {
    this.checkAdminRole(req.user.role);
    return this.purchasesService.extendPurchase(id, new Date(body.newExpiresAt));
  }

  private checkAdminRole(role: string) {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
  }
}
