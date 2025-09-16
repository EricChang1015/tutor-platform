import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BookingService', () => {
  let service: BookingService;
  let prisma: PrismaService;

  const mockPrismaService = {
    student_profile: {
      findUnique: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
    teacher_profile: {
      findUnique: jest.fn(),
    },
    availability_slot: {
      findMany: jest.fn(),
    },
    renamedpackage: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    credit_ledger: {
      aggregate: jest.fn(),
      create: jest.fn(),
    },
    session: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session_attendee: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    const studentId = 'student-id';
    const createDto = {
      course_id: 'course-id',
      teacher_id: 'teacher-id',
      start_at: '2025-09-22T09:00:00Z',
      end_at: '2025-09-22T09:25:00Z',
      meeting_url: 'https://zoom.us/j/123456789',
    };

    const mockStudent = { id: studentId };
    const mockCourse = { id: 'course-id', active: true };
    const mockTeacher = { id: 'teacher-id' };

    beforeEach(() => {
      mockPrismaService.student_profile.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.teacher_profile.findUnique.mockResolvedValue(mockTeacher);
      mockPrismaService.availability_slot.findMany.mockResolvedValue([{ id: 'slot-id' }]);
      mockPrismaService.renamedpackage.findMany.mockResolvedValue([{ remaining_sessions: 5 }]);
      mockPrismaService.credit_ledger.aggregate.mockResolvedValue({ _sum: { delta_sessions: 0 } });
      mockPrismaService.session.findMany.mockResolvedValue([]);
    });

    it('should throw NotFoundException when student not found', async () => {
      mockPrismaService.student_profile.findUnique.mockResolvedValue(null);

      await expect(service.createBooking(studentId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when course not found', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);

      await expect(service.createBooking(studentId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when course is inactive', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({ ...mockCourse, active: false });

      await expect(service.createBooking(studentId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when teacher not found', async () => {
      mockPrismaService.teacher_profile.findUnique.mockResolvedValue(null);

      await expect(service.createBooking(studentId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when start time is after end time', async () => {
      const invalidDto = {
        ...createDto,
        start_at: '2025-09-22T10:00:00Z',
        end_at: '2025-09-22T09:00:00Z',
      };

      await expect(service.createBooking(studentId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when booking in the past', async () => {
      const pastDto = {
        ...createDto,
        start_at: '2020-01-01T09:00:00Z',
        end_at: '2020-01-01T09:25:00Z',
      };

      await expect(service.createBooking(studentId, pastDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when teacher not available', async () => {
      mockPrismaService.availability_slot.findMany.mockResolvedValue([]);

      await expect(service.createBooking(studentId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when insufficient balance', async () => {
      mockPrismaService.renamedpackage.findMany.mockResolvedValue([]);
      mockPrismaService.credit_ledger.aggregate.mockResolvedValue({ _sum: { delta_sessions: 0 } });

      await expect(service.createBooking(studentId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when time conflicts', async () => {
      mockPrismaService.session.findMany.mockResolvedValue([{ id: 'conflicting-session' }]);

      await expect(service.createBooking(studentId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create booking successfully', async () => {
      const mockSession = {
        id: 'session-id',
        course_id: createDto.course_id,
        teacher_id: createDto.teacher_id,
        start_at: new Date(createDto.start_at),
        end_at: new Date(createDto.end_at),
        status: 'confirmed',
        meeting_url: createDto.meeting_url,
        meeting_passcode: null,
        created_at: new Date(),
      };

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          session: { create: jest.fn().mockResolvedValue(mockSession) },
          session_attendee: { create: jest.fn() },
          renamedpackage: { 
            findFirst: jest.fn().mockResolvedValue({ id: 'package-id' }),
            update: jest.fn(),
          },
        };
        return callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await service.createBooking(studentId, createDto);

      expect(result).toEqual({
        id: 'session-id',
        course_id: createDto.course_id,
        teacher_id: createDto.teacher_id,
        start_at: '2025-09-22T09:00:00.000Z',
        end_at: '2025-09-22T09:25:00.000Z',
        status: 'confirmed',
        meeting_url: createDto.meeting_url,
        meeting_passcode: null,
        created_at: mockSession.created_at.toISOString(),
      });
    });
  });

  describe('getStudentBookings', () => {
    const studentId = 'student-id';

    it('should throw NotFoundException when student not found', async () => {
      mockPrismaService.student_profile.findUnique.mockResolvedValue(null);

      await expect(service.getStudentBookings(studentId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return student bookings successfully', async () => {
      const mockStudent = { id: studentId };
      const mockAttendees = [
        {
          session: {
            id: 'session-id',
            course: { id: 'course-id', title: 'English 1-on-1' },
            teacher_profile: {
              id: 'teacher-id',
              app_user: { name: 'Teacher One', email: 'teacher@example.com' },
            },
            start_at: new Date('2025-09-22T09:00:00Z'),
            end_at: new Date('2025-09-22T09:25:00Z'),
            status: 'confirmed',
            meeting_url: 'https://zoom.us/j/123456789',
            meeting_passcode: null,
            created_at: new Date(),
          },
          status: 'booked',
        },
      ];

      mockPrismaService.student_profile.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.session_attendee.findMany.mockResolvedValue(mockAttendees);

      const result = await service.getStudentBookings(studentId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'session-id',
        course: { id: 'course-id', title: 'English 1-on-1' },
        teacher: {
          id: 'teacher-id',
          name: 'Teacher One',
          email: 'teacher@example.com',
        },
        start_at: '2025-09-22T09:00:00.000Z',
        end_at: '2025-09-22T09:25:00.000Z',
        status: 'confirmed',
        attendee_status: 'booked',
        meeting_url: 'https://zoom.us/j/123456789',
        meeting_passcode: null,
        created_at: mockAttendees[0].session.created_at.toISOString(),
      });
    });
  });
});
