import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

export const imageMulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new BadRequestException('Only PNG, JPG, or WEBP files are allowed') as any, false);
    }
    cb(null, true);
  },
};