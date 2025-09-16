import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import { SendEmailDto } from './dto/send-email.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send-email')
  @Roles(Role.Admin)
  async sendEmail(@Body() dto: SendEmailDto) {
    return this.notificationsService.sendEmail(dto);
  }

  @Post('booking-confirmation/:sessionId')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async sendBookingConfirmation(@Param('sessionId') sessionId: string) {
    await this.notificationsService.sendBookingConfirmation(sessionId);
    return { ok: true, message: 'Booking confirmation emails sent' };
  }

  @Post('session-reminder/:sessionId/:type')
  @Roles(Role.Admin)
  async sendSessionReminder(
    @Param('sessionId') sessionId: string,
    @Param('type') type: 'before' | 'after'
  ) {
    if (type !== 'before' && type !== 'after') {
      throw new Error('Invalid reminder type. Must be "before" or "after"');
    }

    await this.notificationsService.sendSessionReminder(sessionId, type);
    return { ok: true, message: `${type} reminder emails sent` };
  }
}
