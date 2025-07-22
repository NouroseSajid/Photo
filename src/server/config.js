// Configuration constants and environment setup
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export const CONFIG = {
  WS_PORT: Number(process.env.WS_PORT) || 3030,
  PING_INTERVAL: Number(process.env.PING_INTERVAL) || 30_000,
  DEBOUNCE_DELAY: Number(process.env.DEBOUNCE_DELAY) || 1_000,
  THUMBNAIL_WIDTH: Number(process.env.THUMBNAIL_WIDTH) || 400,
  MEDIUM_WIDTH: Number(process.env.MEDIUM_WIDTH) || 1200,
  MAX_FILE_SIZE: Number(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024,
  MAX_CONCURRENT_PROCESSING: Number(process.env.MAX_CONCURRENT_PROCESSING) || 5,
  JPEG_QUALITY: Number(process.env.JPEG_QUALITY) || 85,
  WEBP_QUALITY: Number(process.env.WEBP_QUALITY) || 80,
  MAX_RETRY_ATTEMPTS: Number(process.env.MAX_RETRY_ATTEMPTS) || 3,
  RETRY_DELAY: Number(process.env.RETRY_DELAY) || 1_000,
  QUEUE_SIZE_LIMIT: Number(process.env.QUEUE_SIZE_LIMIT) || 100,
  AUTH_TOKEN: process.env.WS_AUTH_TOKEN || '',
  RATE_LIMIT_WINDOW: Number(process.env.RATE_LIMIT_WINDOW) || 10_000,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 20,
  FULL_DIR: process.env.FULL_DIR || 'public/images/full',
  THUMB_DIR: process.env.THUMB_DIR || 'public/images/thumbs',
  MEDIUM_DIR: process.env.MEDIUM_DIR || 'public/images/medium',
};

export const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
