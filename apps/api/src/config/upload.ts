import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

export const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/gif'];

export const FILE_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.ms-excel',
  'application/octet-stream',
];

export const ALLOWED_MIME_TYPES = [...IMAGE_MIME_TYPES, ...FILE_MIME_TYPES];

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_FILES_PER_UPLOAD = 10;

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new Error('Định dạng tệp không được hỗ trợ!'));
    return;
  }
  cb(null, true);
};

// Files are buffered in memory (not written to local disk) then streamed straight to Cloudinary.
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const getMaxSizeForMime = (mimeType: string) =>
  IMAGE_MIME_TYPES.includes(mimeType) ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
