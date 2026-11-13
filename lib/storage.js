import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const STORAGE_DIR = path.join(process.cwd(), 'storage', 'uploads');
export const COVERS_DIR = path.join(process.cwd(), 'storage', 'covers');

// Ensure directories exist
export function initStorageDirectories() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(COVERS_DIR)) {
    fs.mkdirSync(COVERS_DIR, { recursive: true });
  }
}

export const ALLOWED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'jpg',
  'jpeg',
  'png',
  'zip',
];

export const MIME_MAP = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  zip: 'application/zip',
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function sanitizeFileName(fileName) {
  // Strip path traversal attempts and special characters
  const base = path.basename(fileName);
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function validateFile({ fileName, size, mimeType }) {
  if (!fileName) return { valid: false, error: 'File name is required' };

  const ext = path.extname(fileName).toLowerCase().replace('.', '');
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File extension .${ext} is not allowed. Supported formats: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the 50MB limit (${(size / (1024 * 1024)).toFixed(2)} MB)`,
    };
  }

  return { valid: true, ext, detectedMime: MIME_MAP[ext] || mimeType };
}

export async function saveUploadedFile(fileBuffer, originalName, subfolder = 'uploads') {
  initStorageDirectories();
  const ext = path.extname(originalName).toLowerCase();
  const safeId = crypto.randomUUID();
  const safeName = `${safeId}${ext}`;
  const targetDir = subfolder === 'covers' ? COVERS_DIR : STORAGE_DIR;
  const filePath = path.join(targetDir, safeName);

  await fs.promises.writeFile(filePath, Buffer.from(fileBuffer));
  return {
    safeName,
    storagePath: safeName,
    fullPath: filePath,
  };
}

export function getSafeFilePath(fileName, subfolder = 'uploads') {
  const targetDir = subfolder === 'covers' ? COVERS_DIR : STORAGE_DIR;
  // Guard against path traversal
  const resolved = path.resolve(targetDir, path.basename(fileName));
  if (!resolved.startsWith(targetDir)) {
    throw new Error('Access denied: Invalid file path');
  }
  return resolved;
}
