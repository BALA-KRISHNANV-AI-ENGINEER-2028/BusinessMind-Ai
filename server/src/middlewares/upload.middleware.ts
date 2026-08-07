/**
 * Multipart File Upload Middleware.
 *
 * Configures Multer in-memory storage with strict file size, extension, MIME type,
 * and filename sanitization validation.
 */

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../errors/AppError';
import { HttpStatus } from '../constants/http.constants';
import { FILE_UPLOAD } from '../constants/app.constants';

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.xlsx', '.csv', '.txt', '.md']);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'text/markdown',
  'application/octet-stream', // Fallback for some plain text / csv headers
]);

const storage = multer.memoryStorage();

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new AppError(
        `Unsupported file type '${ext}'. Supported extensions are: .pdf, .docx, .xlsx, .csv, .txt, .md`,
        HttpStatus.BAD_REQUEST,
        'UNSUPPORTED_FILE_TYPE',
        true,
      ),
    );
  }

  if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new AppError(
        `Unsupported MIME type '${file.mimetype}'.`,
        HttpStatus.BAD_REQUEST,
        'UNSUPPORTED_MIME_TYPE',
        true,
      ),
    );
  }

  cb(null, true);
}

export const documentUploadMiddleware = multer({
  storage,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE_BYTES, // 25 MB
    files: 1,
  },
  fileFilter,
});

/**
 * Generates a safe server-side storage key scoped to organization ID.
 * Example: `org_123456/a1b2c3d4.pdf`
 */
export function generateStorageKey(organizationId: string, originalFilename: string): {
  storageKey: string;
  fileType: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'txt' | 'md';
} {
  const ext = path.extname(originalFilename).toLowerCase().replace('.', '');
  const validExt = (['pdf', 'docx', 'xlsx', 'csv', 'txt', 'md'].includes(ext) ? ext : 'txt') as
    | 'pdf'
    | 'docx'
    | 'xlsx'
    | 'csv'
    | 'txt'
    | 'md';

  const safeOrgId = organizationId.replace(/[^a-zA-Z0-9_-]/g, '');
  const uniqueId = uuidv4();
  const storageKey = `org_${safeOrgId}/${uniqueId}.${validExt}`;

  return { storageKey, fileType: validExt };
}
