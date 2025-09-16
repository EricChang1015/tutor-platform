import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { FileType } from './dto/get-upload-url.dto';

// Mock MinIO client
const mockMinioClient = {
  presignedPutObject: jest.fn(),
  presignedGetObject: jest.fn(),
  removeObject: jest.fn(),
  listObjects: jest.fn(),
};

jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => mockMinioClient),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('StorageService', () => {
  let service: StorageService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    configService = module.get<ConfigService>(ConfigService);

    // Setup default config values
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'S3_ENDPOINT':
          return 'localhost:9000';
        case 'S3_ACCESS_KEY':
          return 'minioadmin';
        case 'S3_SECRET_KEY':
          return 'minioadmin';
        case 'S3_BUCKET':
          return 'proofs';
        case 'S3_USE_SSL':
          return 'false';
        default:
          return undefined;
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUploadUrl', () => {
    const userId = 'user-id';
    const userRole = 'teacher';
    const dto = {
      filename: 'test.png',
      file_type: FileType.IMAGE,
      content_type: 'image/png',
      file_size: 1024000,
    };

    it('should generate upload URL successfully', async () => {
      const mockUploadUrl = 'http://localhost:9000/bucket/file?signature=abc';
      const mockDownloadUrl = 'http://localhost:9000/bucket/file?signature=def';

      mockMinioClient.presignedPutObject.mockResolvedValue(mockUploadUrl);
      mockMinioClient.presignedGetObject.mockResolvedValue(mockDownloadUrl);

      const result = await service.getUploadUrl(userId, userRole, dto);

      expect(result).toEqual({
        upload_url: mockUploadUrl,
        download_url: mockDownloadUrl,
        file_key: 'teacher/user-id/mock-uuid-1234.png',
        expires_in: 900,
      });

      expect(mockMinioClient.presignedPutObject).toHaveBeenCalledWith(
        'proofs',
        expect.any(String),
        900
      );
    });

    it('should throw BadRequestException for invalid file extension', async () => {
      const invalidDto = {
        ...dto,
        filename: 'test.exe',
        content_type: 'application/octet-stream',
      };

      await expect(service.getUploadUrl(userId, userRole, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid content type', async () => {
      const invalidDto = {
        ...dto,
        content_type: 'application/octet-stream',
      };

      await expect(service.getUploadUrl(userId, userRole, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for file too large', async () => {
      const invalidDto = {
        ...dto,
        file_size: 50 * 1024 * 1024, // 50MB for image (max is 10MB)
      };

      await expect(service.getUploadUrl(userId, userRole, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate different file types correctly', async () => {
      const videoDto = {
        filename: 'test.mp4',
        file_type: FileType.VIDEO,
        content_type: 'video/mp4',
        file_size: 50 * 1024 * 1024, // 50MB
      };

      mockMinioClient.presignedPutObject.mockResolvedValue('upload-url');
      mockMinioClient.presignedGetObject.mockResolvedValue('download-url');

      const result = await service.getUploadUrl(userId, userRole, videoDto);

      expect(result.file_key).toBe('teacher/user-id/mock-uuid-1234.mp4');
    });
  });

  describe('getDownloadUrl', () => {
    const userId = 'user-id';
    const userRole = 'teacher';
    const fileKey = 'teacher/user-id/test-file.png';

    it('should generate download URL for authorized user', async () => {
      const mockDownloadUrl = 'http://localhost:9000/bucket/file?signature=abc';
      mockMinioClient.presignedGetObject.mockResolvedValue(mockDownloadUrl);

      const result = await service.getDownloadUrl(fileKey, userId, userRole);

      expect(result).toEqual({
        download_url: mockDownloadUrl,
        expires_in: 86400,
      });
    });

    it('should throw BadRequestException for unauthorized access', async () => {
      const unauthorizedFileKey = 'teacher/other-user-id/test-file.png';

      await expect(service.getDownloadUrl(unauthorizedFileKey, userId, userRole)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow admin to access any file', async () => {
      const adminRole = 'admin';
      const anyFileKey = 'teacher/other-user-id/test-file.png';
      const mockDownloadUrl = 'http://localhost:9000/bucket/file?signature=abc';

      mockMinioClient.presignedGetObject.mockResolvedValue(mockDownloadUrl);

      const result = await service.getDownloadUrl(anyFileKey, userId, adminRole);

      expect(result.download_url).toBe(mockDownloadUrl);
    });
  });

  describe('deleteFile', () => {
    const userId = 'user-id';
    const userRole = 'teacher';
    const fileKey = 'teacher/user-id/test-file.png';

    it('should delete file for authorized user', async () => {
      mockMinioClient.removeObject.mockResolvedValue(undefined);

      const result = await service.deleteFile(fileKey, userId, userRole);

      expect(result).toEqual({
        ok: true,
        message: 'File deleted successfully',
      });

      expect(mockMinioClient.removeObject).toHaveBeenCalledWith('proofs', fileKey);
    });

    it('should throw BadRequestException for unauthorized deletion', async () => {
      const unauthorizedFileKey = 'teacher/other-user-id/test-file.png';

      await expect(service.deleteFile(unauthorizedFileKey, userId, userRole)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listUserFiles', () => {
    const userId = 'user-id';
    const userRole = 'teacher';

    it('should list user files successfully', async () => {
      const mockFiles = [
        {
          name: 'teacher/user-id/file1.png',
          size: 1024,
          lastModified: new Date(),
          etag: 'abc123',
        },
        {
          name: 'teacher/user-id/file2.jpg',
          size: 2048,
          lastModified: new Date(),
          etag: 'def456',
        },
      ];

      const mockStream = {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            mockFiles.forEach(callback);
          } else if (event === 'end') {
            callback();
          }
        }),
      };

      mockMinioClient.listObjects.mockReturnValue(mockStream);

      const result = await service.listUserFiles(userId, userRole);

      expect(result).toEqual([
        {
          key: 'teacher/user-id/file1.png',
          size: 1024,
          last_modified: mockFiles[0].lastModified,
          etag: 'abc123',
        },
        {
          key: 'teacher/user-id/file2.jpg',
          size: 2048,
          last_modified: mockFiles[1].lastModified,
          etag: 'def456',
        },
      ]);

      expect(mockMinioClient.listObjects).toHaveBeenCalledWith(
        'proofs',
        'teacher/user-id/',
        true
      );
    });
  });
});
