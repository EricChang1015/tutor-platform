export interface FileTypeConfig {
  allowedMimeTypes: string[];
  maxSizeBytes: number;
  extensions: string[];
}

export interface UploadConfig {
  [key: string]: FileTypeConfig;
}

// 可配置的文件上傳限制
export const UPLOAD_CONFIG: UploadConfig = {
  avatar: {
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/bmp',
      'image/webp'
    ],
    maxSizeBytes: 1 * 1024 * 1024, // 1MB
    extensions: ['.jpg', '.jpeg', '.png', '.bmp', '.webp']
  },
  
  teacher_intro_video: {
    allowedMimeTypes: [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo', // AVI
      'video/webm'
    ],
    maxSizeBytes: 100 * 1024 * 1024, // 100MB
    extensions: ['.mp4', '.mpeg', '.mov', '.avi', '.webm']
  },
  
  teacher_audio: {
    allowedMimeTypes: [
      'audio/mpeg', // MP3
      'audio/aac',
      'audio/mp4', // M4A
      'audio/wav',
      'audio/ogg'
    ],
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    extensions: ['.mp3', '.aac', '.m4a', '.wav', '.ogg']
  },
  
  teaching_material: {
    allowedMimeTypes: [
      'application/pdf',
      'text/html',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    maxSizeBytes: 20 * 1024 * 1024, // 20MB
    extensions: ['.pdf', '.html', '.txt', '.doc', '.docx', '.ppt', '.pptx']
  },
  
  student_homework: {
    allowedMimeTypes: [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ],
    maxSizeBytes: 20 * 1024 * 1024, // 20MB
    extensions: ['.pdf', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png']
  },
  
  class_recording: {
    allowedMimeTypes: [
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ],
    maxSizeBytes: 500 * 1024 * 1024, // 500MB
    extensions: ['.mp4', '.webm', '.mov']
  },
  
  teacher_gallery: {
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ],
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    extensions: ['.jpg', '.jpeg', '.png', '.webp']
  }
};

export enum FileCategory {
  AVATAR = 'avatar',
  TEACHER_INTRO_VIDEO = 'teacher_intro_video',
  TEACHER_AUDIO = 'teacher_audio',
  TEACHING_MATERIAL = 'teaching_material',
  STUDENT_HOMEWORK = 'student_homework',
  CLASS_RECORDING = 'class_recording',
  TEACHER_GALLERY = 'teacher_gallery'
}

export enum FileVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private'
}

// 文件類型對應的可見性設定
export const FILE_VISIBILITY_MAP: Record<FileCategory, FileVisibility> = {
  [FileCategory.AVATAR]: FileVisibility.PUBLIC,
  [FileCategory.TEACHER_INTRO_VIDEO]: FileVisibility.PUBLIC,
  [FileCategory.TEACHER_AUDIO]: FileVisibility.PUBLIC,
  [FileCategory.TEACHING_MATERIAL]: FileVisibility.PUBLIC,
  [FileCategory.STUDENT_HOMEWORK]: FileVisibility.PRIVATE,
  [FileCategory.CLASS_RECORDING]: FileVisibility.PRIVATE,
  [FileCategory.TEACHER_GALLERY]: FileVisibility.PUBLIC
};
