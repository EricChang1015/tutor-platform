import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from './availability.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let prisma: PrismaService;

  const mockPrismaService = {
    teacher_profile: {
      findUnique: jest.fn(),
    },
    availability_slot: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSlot', () => {
    const teacherId = 'teacher-id';
    const createDto = {
      weekday: 1,
      start_time: '09:00',
      end_time: '10:00',
      capacity: 1,
    };

    it('should create availability slot successfully', async () => {
      const mockTeacher = { id: teacherId };
      const mockSlot = {
        id: 'slot-id',
        teacher_id: teacherId,
        weekday: 1,
        start_time: new Date('1970-01-01T09:00:00Z'),
        end_time: new Date('1970-01-01T10:00:00Z'),
        capacity: 1,
        effective_from: null,
        effective_to: null,
      };

      mockPrismaService.teacher_profile.findUnique.mockResolvedValue(mockTeacher);
      mockPrismaService.availability_slot.findMany.mockResolvedValue([]);
      mockPrismaService.availability_slot.create.mockResolvedValue(mockSlot);

      const result = await service.createSlot(teacherId, createDto);

      expect(result).toEqual({
        id: 'slot-id',
        teacher_id: teacherId,
        weekday: 1,
        start_time: '09:00',
        end_time: '10:00',
        capacity: 1,
        effective_from: null,
        effective_to: null,
      });
    });

    it('should throw NotFoundException when teacher not found', async () => {
      mockPrismaService.teacher_profile.findUnique.mockResolvedValue(null);

      await expect(service.createSlot(teacherId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid time format', async () => {
      const mockTeacher = { id: teacherId };
      mockPrismaService.teacher_profile.findUnique.mockResolvedValue(mockTeacher);

      const invalidDto = { ...createDto, start_time: '25:00' };

      await expect(service.createSlot(teacherId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when start time is after end time', async () => {
      const mockTeacher = { id: teacherId };
      mockPrismaService.teacher_profile.findUnique.mockResolvedValue(mockTeacher);

      const invalidDto = { ...createDto, start_time: '11:00', end_time: '10:00' };

      await expect(service.createSlot(teacherId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for time slot less than 15 minutes', async () => {
      const mockTeacher = { id: teacherId };
      mockPrismaService.teacher_profile.findUnique.mockResolvedValue(mockTeacher);

      const invalidDto = { ...createDto, start_time: '09:00', end_time: '09:10' };

      await expect(service.createSlot(teacherId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for conflicting time slots', async () => {
      const mockTeacher = { id: teacherId };
      const conflictingSlot = {
        id: 'existing-slot',
        teacher_id: teacherId,
        weekday: 1,
        start_time: new Date('1970-01-01T08:30:00Z'),
        end_time: new Date('1970-01-01T09:30:00Z'),
      };

      mockPrismaService.teacher_profile.findUnique.mockResolvedValue(mockTeacher);
      mockPrismaService.availability_slot.findMany.mockResolvedValue([conflictingSlot]);

      await expect(service.createSlot(teacherId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getTeacherSlots', () => {
    const teacherId = 'teacher-id';

    it('should return teacher slots successfully', async () => {
      const mockTeacher = { id: teacherId };
      const mockSlots = [
        {
          id: 'slot-1',
          teacher_id: teacherId,
          weekday: 1,
          start_time: new Date('1970-01-01T09:00:00Z'),
          end_time: new Date('1970-01-01T10:00:00Z'),
          capacity: 1,
          effective_from: null,
          effective_to: null,
        },
      ];

      mockPrismaService.teacher_profile.findUnique.mockResolvedValue(mockTeacher);
      mockPrismaService.availability_slot.findMany.mockResolvedValue(mockSlots);

      const result = await service.getTeacherSlots(teacherId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'slot-1',
        teacher_id: teacherId,
        weekday: 1,
        start_time: '09:00',
        end_time: '10:00',
        capacity: 1,
        effective_from: null,
        effective_to: null,
      });
    });

    it('should throw NotFoundException when teacher not found', async () => {
      mockPrismaService.teacher_profile.findUnique.mockResolvedValue(null);

      await expect(service.getTeacherSlots(teacherId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
