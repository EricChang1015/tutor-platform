import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('SessionsService', () => {
  let service: SessionsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    session: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session_report: {
      upsert: jest.fn(),
    },
    session_proof: {
      create: jest.fn(),
    },
    teacher_profile: {
      findUnique: jest.fn(),
    },
    student_profile: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSessionDetails', () => {
    const sessionId = 'session-id';
    const userId = 'user-id';
    const userRole = 'student';

    it('should throw NotFoundException when session not found', async () => {
      mockPrismaService.session.findUnique.mockResolvedValue(null);

      await expect(service.getSessionDetails(sessionId, userId, userRole)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user has no access', async () => {
      const mockSession = {
        id: sessionId,
        teacher_id: 'other-teacher-id',
        session_attendee: [],
      };

      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.student_profile.findUnique.mockResolvedValue({ id: 'student-id' });

      await expect(service.getSessionDetails(sessionId, userId, userRole)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return session details for authorized user', async () => {
      const mockSession = {
        id: sessionId,
        teacher_id: 'teacher-id',
        start_at: new Date('2025-09-16T09:00:00Z'),
        end_at: new Date('2025-09-16T09:25:00Z'),
        status: 'confirmed',
        meeting_url: 'https://zoom.us/j/123456789',
        meeting_passcode: null,
        created_at: new Date(),
        course: {
          id: 'course-id',
          title: 'English 1-on-1',
          description: '25-min session',
          duration_min: 25,
        },
        teacher_profile: {
          id: 'teacher-id',
          app_user: {
            name: 'Teacher One',
            email: 'teacher@example.com',
          },
        },
        session_attendee: [
          {
            student_id: 'student-id',
            student_profile: {
              id: 'student-id',
              app_user: {
                name: 'Student One',
                email: 'student@example.com',
              },
            },
            status: 'booked',
          },
        ],
        session_report: null,
        session_proof: [],
      };

      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.student_profile.findUnique.mockResolvedValue({ id: 'student-id' });

      const result = await service.getSessionDetails(sessionId, userId, userRole);

      expect(result).toEqual({
        id: sessionId,
        course: {
          id: 'course-id',
          title: 'English 1-on-1',
          description: '25-min session',
          duration_min: 25,
        },
        teacher: {
          id: 'teacher-id',
          name: 'Teacher One',
          email: 'teacher@example.com',
        },
        students: [
          {
            id: 'student-id',
            name: 'Student One',
            email: 'student@example.com',
            status: 'booked',
          },
        ],
        start_at: '2025-09-16T09:00:00.000Z',
        end_at: '2025-09-16T09:25:00.000Z',
        status: 'confirmed',
        meeting_url: 'https://zoom.us/j/123456789',
        meeting_passcode: null,
        report: null,
        proofs: [],
        created_at: mockSession.created_at.toISOString(),
      });
    });
  });

  describe('updateMeetingInfo', () => {
    const sessionId = 'session-id';
    const teacherId = 'teacher-id';
    const updateDto = {
      meeting_url: 'https://zoom.us/j/new-meeting',
      meeting_passcode: 'newpass',
    };

    it('should throw NotFoundException when session not found', async () => {
      mockPrismaService.session.findUnique.mockResolvedValue(null);

      await expect(service.updateMeetingInfo(sessionId, teacherId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when teacher does not own session', async () => {
      const mockSession = {
        id: sessionId,
        teacher_id: 'other-teacher-id',
        status: 'confirmed',
      };

      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);

      await expect(service.updateMeetingInfo(sessionId, teacherId, updateDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException for cancelled session', async () => {
      const mockSession = {
        id: sessionId,
        teacher_id: teacherId,
        status: 'cancelled',
      };

      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);

      await expect(service.updateMeetingInfo(sessionId, teacherId, updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update meeting info successfully', async () => {
      const mockSession = {
        id: sessionId,
        teacher_id: teacherId,
        status: 'confirmed',
      };

      const updatedSession = {
        ...mockSession,
        meeting_url: updateDto.meeting_url,
        meeting_passcode: updateDto.meeting_passcode,
        course_id: 'course-id',
        start_at: new Date('2025-09-16T09:00:00Z'),
        end_at: new Date('2025-09-16T09:25:00Z'),
        created_at: new Date(),
      };

      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.session.update.mockResolvedValue(updatedSession);

      const result = await service.updateMeetingInfo(sessionId, teacherId, updateDto);

      expect(result).toEqual({
        id: sessionId,
        course_id: 'course-id',
        teacher_id: teacherId,
        start_at: '2025-09-16T09:00:00.000Z',
        end_at: '2025-09-16T09:25:00.000Z',
        status: 'confirmed',
        meeting_url: updateDto.meeting_url,
        meeting_passcode: updateDto.meeting_passcode,
        created_at: updatedSession.created_at.toISOString(),
      });
    });
  });

  describe('submitTeacherReport', () => {
    const sessionId = 'session-id';
    const teacherId = 'teacher-id';
    const reportDto = {
      teacher_notes: 'Student showed good progress',
    };

    it('should throw NotFoundException when session not found', async () => {
      mockPrismaService.session.findUnique.mockResolvedValue(null);

      await expect(service.submitTeacherReport(sessionId, teacherId, reportDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when teacher does not own session', async () => {
      const mockSession = {
        id: sessionId,
        teacher_id: 'other-teacher-id',
        status: 'confirmed',
        start_at: new Date('2020-01-01T09:00:00Z'),
      };

      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);

      await expect(service.submitTeacherReport(sessionId, teacherId, reportDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException for non-confirmed session', async () => {
      const mockSession = {
        id: sessionId,
        teacher_id: teacherId,
        status: 'cancelled',
        start_at: new Date('2020-01-01T09:00:00Z'),
      };

      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);

      await expect(service.submitTeacherReport(sessionId, teacherId, reportDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when session has not started', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const mockSession = {
        id: sessionId,
        teacher_id: teacherId,
        status: 'confirmed',
        start_at: futureDate,
      };

      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);

      await expect(service.submitTeacherReport(sessionId, teacherId, reportDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should submit teacher report successfully', async () => {
      const mockSession = {
        id: sessionId,
        teacher_id: teacherId,
        status: 'confirmed',
        start_at: new Date('2020-01-01T09:00:00Z'),
      };

      const mockReport = {
        id: 'report-id',
        session_id: sessionId,
        teacher_notes: reportDto.teacher_notes,
        teacher_submitted_at: new Date(),
      };

      mockPrismaService.session.findUnique
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce({
          ...mockSession,
          session_report: mockReport,
          session_proof: [],
        });
      mockPrismaService.session_report.upsert.mockResolvedValue(mockReport);

      const result = await service.submitTeacherReport(sessionId, teacherId, reportDto);

      expect(result).toEqual({
        ok: true,
        report_id: 'report-id',
      });
    });
  });
});
