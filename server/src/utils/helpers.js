import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const generateId = () => uuidv4();

export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const sanitizeHtml = (html) => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
};

export const extractExcerpt = (html, maxLength = 200) => {
  const text = html.replace(/<[^>]*>/g, '').trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
};

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const retry = async (fn, maxAttempts = 3, delayMs = 1000) => {
  let lastError;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxAttempts - 1) await delay(delayMs * Math.pow(2, i));
    }
  }
  throw lastError;
};

export const maskSensitiveData = (obj, keys = ['password', 'apiKey', 'apiKey', 'accessToken', 'credentials']) => {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (keys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
      result[key] = '***REDACTED***';
    }
  }
  return result;
};

export const parseCronExpression = (cron) => {
  const parts = cron.split(' ');
  return {
    second: parts[0] || '0',
    minute: parts[1],
    hour: parts[2],
    dayOfMonth: parts[3],
    month: parts[4],
    dayOfWeek: parts[5]
  };
};

export const getNextRunTime = (cronExpression) => {
  return new Date();
};
