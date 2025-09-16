import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import { ResolveQueryDto } from './dto/resolve-query.dto';

@Controller('pricing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PricingController {
  constructor(private pricing: PricingService) {}

  @Get('resolve')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async resolve(@Query() q: ResolveQueryDto) {
    const at = q.at ? new Date(q.at) : undefined;
    return this.pricing.resolve({
      teacherId: q.teacherId || null,
      courseId: q.courseId,
      at,
    });
  }
}