import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async createSlot(teacherId: string, dto: CreateAvailabilityDto) {
    // 驗證老師存在
    const teacher = await this.prisma.teacher_profile.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // 驗證時間格式和邏輯
    this.validateTimeSlot(dto.start_time, dto.end_time);

    // 檢查時間衝突
    await this.checkTimeConflict(teacherId, dto.weekday, dto.start_time, dto.end_time);

    const slot = await this.prisma.availability_slot.create({
      data: {
        teacher_id: teacherId,
        weekday: dto.weekday,
        start_time: new Date(`1970-01-01T${dto.start_time}:00Z`),
        end_time: new Date(`1970-01-01T${dto.end_time}:00Z`),
        capacity: dto.capacity ?? 1,
        effective_from: dto.effective_from ? new Date(dto.effective_from) : null,
        effective_to: dto.effective_to ? new Date(dto.effective_to) : null,
      },
    });

    return this.formatSlot(slot);
  }

  async getTeacherSlots(teacherId: string) {
    const teacher = await this.prisma.teacher_profile.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const slots = await this.prisma.availability_slot.findMany({
      where: { teacher_id: teacherId },
      orderBy: [{ weekday: 'asc' }, { start_time: 'asc' }],
    });

    return slots.map(slot => this.formatSlot(slot));
  }

  async updateSlot(slotId: string, teacherId: string, dto: UpdateAvailabilityDto) {
    const slot = await this.prisma.availability_slot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new NotFoundException('Availability slot not found');
    }

    if (slot.teacher_id !== teacherId) {
      throw new ForbiddenException('You can only update your own availability slots');
    }

    // 如果更新時間，需要驗證
    if (dto.start_time || dto.end_time) {
      const startTime = dto.start_time || this.formatTime(slot.start_time);
      const endTime = dto.end_time || this.formatTime(slot.end_time);
      this.validateTimeSlot(startTime, endTime);

      // 檢查與其他時段的衝突（排除當前時段）
      const weekday = dto.weekday ?? slot.weekday;
      await this.checkTimeConflict(teacherId, weekday, startTime, endTime, slotId);
    }

    const updateData: any = {};
    if (dto.weekday !== undefined) updateData.weekday = dto.weekday;
    if (dto.start_time) updateData.start_time = new Date(`1970-01-01T${dto.start_time}:00Z`);
    if (dto.end_time) updateData.end_time = new Date(`1970-01-01T${dto.end_time}:00Z`);
    if (dto.capacity !== undefined) updateData.capacity = dto.capacity;
    if (dto.effective_from !== undefined) {
      updateData.effective_from = dto.effective_from ? new Date(dto.effective_from) : null;
    }
    if (dto.effective_to !== undefined) {
      updateData.effective_to = dto.effective_to ? new Date(dto.effective_to) : null;
    }

    const updatedSlot = await this.prisma.availability_slot.update({
      where: { id: slotId },
      data: updateData,
    });

    return this.formatSlot(updatedSlot);
  }

  async deleteSlot(slotId: string, teacherId: string) {
    const slot = await this.prisma.availability_slot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new NotFoundException('Availability slot not found');
    }

    if (slot.teacher_id !== teacherId) {
      throw new ForbiddenException('You can only delete your own availability slots');
    }

    await this.prisma.availability_slot.delete({
      where: { id: slotId },
    });

    return { ok: true };
  }

  private validateTimeSlot(startTime: string, endTime: string) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new BadRequestException('Invalid time format. Use HH:MM');
    }

    const start = new Date(`1970-01-01T${startTime}:00Z`);
    const end = new Date(`1970-01-01T${endTime}:00Z`);

    if (start >= end) {
      throw new BadRequestException('Start time must be before end time');
    }

    // 檢查最小時長（例如至少15分鐘）
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (diffMinutes < 15) {
      throw new BadRequestException('Time slot must be at least 15 minutes');
    }
  }

  private async checkTimeConflict(
    teacherId: string,
    weekday: number,
    startTime: string,
    endTime: string,
    excludeSlotId?: string
  ) {
    const start = new Date(`1970-01-01T${startTime}:00Z`);
    const end = new Date(`1970-01-01T${endTime}:00Z`);

    const where: any = {
      teacher_id: teacherId,
      weekday: weekday,
      OR: [
        {
          AND: [
            { start_time: { lte: start } },
            { end_time: { gt: start } }
          ]
        },
        {
          AND: [
            { start_time: { lt: end } },
            { end_time: { gte: end } }
          ]
        },
        {
          AND: [
            { start_time: { gte: start } },
            { end_time: { lte: end } }
          ]
        }
      ]
    };

    if (excludeSlotId) {
      where.id = { not: excludeSlotId };
    }

    const conflictingSlots = await this.prisma.availability_slot.findMany({ where });

    if (conflictingSlots.length > 0) {
      throw new BadRequestException('Time slot conflicts with existing availability');
    }
  }

  private formatSlot(slot: any) {
    return {
      id: slot.id,
      teacher_id: slot.teacher_id,
      weekday: slot.weekday,
      start_time: this.formatTime(slot.start_time),
      end_time: this.formatTime(slot.end_time),
      capacity: slot.capacity,
      effective_from: slot.effective_from ? slot.effective_from.toISOString().split('T')[0] : null,
      effective_to: slot.effective_to ? slot.effective_to.toISOString().split('T')[0] : null,
    };
  }

  private formatTime(time: Date): string {
    return time.toISOString().substr(11, 5);
  }
}
