import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import { SendEmailDto } from './dto/send-email.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST') || 'localhost';
    const smtpPort = parseInt(this.configService.get<string>('SMTP_PORT') || '587');
    const smtpUser = this.configService.get<string>('SMTP_USER') || '';
    const smtpPass = this.configService.get<string>('SMTP_PASS') || '';
    const smtpSecure = this.configService.get<string>('SMTP_SECURE') === 'true';

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: smtpUser && smtpPass ? {
        user: smtpUser,
        pass: smtpPass,
      } : undefined,
    });
  }

  async sendEmail(dto: SendEmailDto) {
    try {
      const fromEmail = this.configService.get<string>('FROM_EMAIL') || 'noreply@tutorplatform.com';
      const fromName = this.configService.get<string>('FROM_NAME') || 'Tutor Platform';

      const mailOptions = {
        from: `${fromName} <${fromEmail}>`,
        to: dto.to,
        subject: dto.subject,
        html: dto.html,
        text: dto.text,
        cc: dto.cc,
        bcc: dto.bcc,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${dto.to}: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${dto.to}:`, error);
      throw error;
    }
  }

  async sendBookingConfirmation(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        course: true,
        teacher_profile: {
          include: {
            app_user: {
              select: { name: true, email: true },
            },
          },
        },
        session_attendee: {
          include: {
            student_profile: {
              include: {
                app_user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const teacher = session.teacher_profile;
    const students = session.session_attendee.map(a => a.student_profile);

    // 發送給學生的確認信
    for (const student of students) {
      const studentEmail = {
        to: student.app_user.email,
        subject: `課程預約確認 - ${session.course.title}`,
        html: this.generateBookingConfirmationHtml({
          studentName: student.app_user.name,
          teacherName: teacher.app_user.name,
          courseTitle: session.course.title,
          startTime: session.start_at,
          endTime: session.end_at,
          meetingUrl: session.meeting_url,
          meetingPasscode: session.meeting_passcode,
        }),
      };

      await this.sendEmail(studentEmail);
    }

    // 發送給老師的通知信
    const teacherEmail = {
      to: teacher.app_user.email,
      subject: `新課程預約 - ${session.course.title}`,
      html: this.generateTeacherNotificationHtml({
        teacherName: teacher.app_user.name,
        studentNames: students.map(s => s.app_user.name),
        courseTitle: session.course.title,
        startTime: session.start_at,
        endTime: session.end_at,
        meetingUrl: session.meeting_url,
        meetingPasscode: session.meeting_passcode,
      }),
    };

    await this.sendEmail(teacherEmail);
  }

  async sendSessionReminder(sessionId: string, reminderType: 'before' | 'after') {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        course: true,
        teacher_profile: {
          include: {
            app_user: {
              select: { name: true, email: true },
            },
          },
        },
        session_attendee: {
          include: {
            student_profile: {
              include: {
                app_user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const teacher = session.teacher_profile;
    const students = session.session_attendee.map(a => a.student_profile);

    if (reminderType === 'before') {
      // 課前提醒
      for (const student of students) {
        const reminderEmail = {
          to: student.app_user.email,
          subject: `課程提醒 - ${session.course.title} 即將開始`,
          html: this.generateBeforeReminderHtml({
            studentName: student.app_user.name,
            teacherName: teacher.app_user.name,
            courseTitle: session.course.title,
            startTime: session.start_at,
            meetingUrl: session.meeting_url,
            meetingPasscode: session.meeting_passcode,
          }),
        };

        await this.sendEmail(reminderEmail);
      }

      // 給老師的提醒
      const teacherReminderEmail = {
        to: teacher.app_user.email,
        subject: `課程提醒 - ${session.course.title} 即將開始`,
        html: this.generateTeacherBeforeReminderHtml({
          teacherName: teacher.app_user.name,
          studentNames: students.map(s => s.app_user.name),
          courseTitle: session.course.title,
          startTime: session.start_at,
          meetingUrl: session.meeting_url,
          meetingPasscode: session.meeting_passcode,
        }),
      };

      await this.sendEmail(teacherReminderEmail);
    } else {
      // 課後提醒
      for (const student of students) {
        const afterReminderEmail = {
          to: student.app_user.email,
          subject: `課後回饋 - ${session.course.title}`,
          html: this.generateAfterReminderHtml({
            studentName: student.app_user.name,
            teacherName: teacher.app_user.name,
            courseTitle: session.course.title,
            sessionId: session.id,
          }),
        };

        await this.sendEmail(afterReminderEmail);
      }

      // 給老師的課後提醒
      const teacherAfterReminderEmail = {
        to: teacher.app_user.email,
        subject: `課後報告提醒 - ${session.course.title}`,
        html: this.generateTeacherAfterReminderHtml({
          teacherName: teacher.app_user.name,
          studentNames: students.map(s => s.app_user.name),
          courseTitle: session.course.title,
          sessionId: session.id,
        }),
      };

      await this.sendEmail(teacherAfterReminderEmail);
    }
  }

  private generateBookingConfirmationHtml(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">課程預約確認</h2>
        <p>親愛的 ${data.studentName}，</p>
        <p>您的課程預約已確認！</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">課程詳情</h3>
          <p><strong>課程：</strong> ${data.courseTitle}</p>
          <p><strong>老師：</strong> ${data.teacherName}</p>
          <p><strong>時間：</strong> ${data.startTime.toLocaleString('zh-TW')} - ${data.endTime.toLocaleString('zh-TW')}</p>
          ${data.meetingUrl ? `<p><strong>會議連結：</strong> <a href="${data.meetingUrl}">${data.meetingUrl}</a></p>` : ''}
          ${data.meetingPasscode ? `<p><strong>會議密碼：</strong> ${data.meetingPasscode}</p>` : ''}
        </div>
        
        <p>請準時參加課程。如有任何問題，請聯繫我們。</p>
        <p>祝您學習愉快！</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          此郵件由系統自動發送，請勿回覆。
        </p>
      </div>
    `;
  }

  private generateTeacherNotificationHtml(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">新課程預約通知</h2>
        <p>親愛的 ${data.teacherName} 老師，</p>
        <p>您有新的課程預約！</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">課程詳情</h3>
          <p><strong>課程：</strong> ${data.courseTitle}</p>
          <p><strong>學生：</strong> ${data.studentNames.join(', ')}</p>
          <p><strong>時間：</strong> ${data.startTime.toLocaleString('zh-TW')} - ${data.endTime.toLocaleString('zh-TW')}</p>
          ${data.meetingUrl ? `<p><strong>會議連結：</strong> <a href="${data.meetingUrl}">${data.meetingUrl}</a></p>` : ''}
          ${data.meetingPasscode ? `<p><strong>會議密碼：</strong> ${data.meetingPasscode}</p>` : ''}
        </div>
        
        <p>請準時開始課程。記得在課後提交教學報告。</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          此郵件由系統自動發送，請勿回覆。
        </p>
      </div>
    `;
  }

  private generateBeforeReminderHtml(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">課程提醒</h2>
        <p>親愛的 ${data.studentName}，</p>
        <p>您的課程即將在 30 分鐘後開始！</p>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">課程詳情</h3>
          <p><strong>課程：</strong> ${data.courseTitle}</p>
          <p><strong>老師：</strong> ${data.teacherName}</p>
          <p><strong>開始時間：</strong> ${data.startTime.toLocaleString('zh-TW')}</p>
          ${data.meetingUrl ? `<p><strong>會議連結：</strong> <a href="${data.meetingUrl}">${data.meetingUrl}</a></p>` : ''}
          ${data.meetingPasscode ? `<p><strong>會議密碼：</strong> ${data.meetingPasscode}</p>` : ''}
        </div>
        
        <p>請提前準備好學習材料，準時參加課程。</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          此郵件由系統自動發送，請勿回覆。
        </p>
      </div>
    `;
  }

  private generateTeacherBeforeReminderHtml(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">課程提醒</h2>
        <p>親愛的 ${data.teacherName} 老師，</p>
        <p>您的課程即將在 30 分鐘後開始！</p>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">課程詳情</h3>
          <p><strong>課程：</strong> ${data.courseTitle}</p>
          <p><strong>學生：</strong> ${data.studentNames.join(', ')}</p>
          <p><strong>開始時間：</strong> ${data.startTime.toLocaleString('zh-TW')}</p>
          ${data.meetingUrl ? `<p><strong>會議連結：</strong> <a href="${data.meetingUrl}">${data.meetingUrl}</a></p>` : ''}
          ${data.meetingPasscode ? `<p><strong>會議密碼：</strong> ${data.meetingPasscode}</p>` : ''}
        </div>
        
        <p>請提前準備好教學材料，準時開始課程。</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          此郵件由系統自動發送，請勿回覆。
        </p>
      </div>
    `;
  }

  private generateAfterReminderHtml(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">課後回饋</h2>
        <p>親愛的 ${data.studentName}，</p>
        <p>感謝您參加今天的課程！</p>
        
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">課程詳情</h3>
          <p><strong>課程：</strong> ${data.courseTitle}</p>
          <p><strong>老師：</strong> ${data.teacherName}</p>
        </div>
        
        <p>請記得提交您的學習目標和心得，這將幫助老師為您提供更好的教學服務。</p>
        <p><a href="/sessions/${data.sessionId}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">提交學習心得</a></p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          此郵件由系統自動發送，請勿回覆。
        </p>
      </div>
    `;
  }

  private generateTeacherAfterReminderHtml(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">課後報告提醒</h2>
        <p>親愛的 ${data.teacherName} 老師，</p>
        <p>請記得提交今天課程的教學報告。</p>
        
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">課程詳情</h3>
          <p><strong>課程：</strong> ${data.courseTitle}</p>
          <p><strong>學生：</strong> ${data.studentNames.join(', ')}</p>
        </div>
        
        <p>請提交教學報告和課程證明，以完成課程記錄。</p>
        <p><a href="/sessions/${data.sessionId}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">提交教學報告</a></p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          此郵件由系統自動發送，請勿回覆。
        </p>
      </div>
    `;
  }
}
