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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';

import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { ActivatePurchaseDto } from './dto/activate-purchase.dto';
import { GetPurchasesQueryDto } from './dto/get-purchases-query.dto';

@ApiTags('Purchases')
@Controller('purchases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PurchasesController {
  constructor(private purchasesService: PurchasesService) {}

  @Get()
  @ApiQuery({ name: 'studentId', required: false, type: String, description: '管理員可指定 studentId 來查看該學生的購買紀錄' })
  @ApiOperation({ summary: '查看購買項目列表' })
  @ApiResponse({ status: 200, description: '購買項目列表' })
  async getPurchases(@Query() query: GetPurchasesQueryDto, @Request() req) {
    // 管理員可以查看指定學生的購買記錄
    if (req.user.role === 'admin' && query.studentId) {
      return this.purchasesService.findUserPurchases(query.studentId, query, req.user.role);
    }

    // 非管理員：如果請求裡包含 studentId，且非該使用者本人，則拒絕（明確阻止越權）
    if (query.studentId && query.studentId !== req.user.sub) {
      throw new ForbiddenException('Admin access required to view other users\' purchases');
    }

    // 否則只回傳目前使用者的購買記錄
    const safeQuery = { ...query };
    if ('studentId' in safeQuery) {
      delete safeQuery.studentId;
    }
    return this.purchasesService.findUserPurchases(req.user.sub, safeQuery, req.user.role);
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
    return this.purchasesService.getPurchaseById(id, req.user.sub, req.user.role);
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
