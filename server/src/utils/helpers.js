import { CronExpressionParser } from 'cron-parser';

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

export const maskSensitiveData = (obj, keys = ['password', 'apiKey', 'accessToken', 'credentials']) => {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (keys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
      result[key] = '***REDACTED***';
    }
  }
  return result;
};

export const getNextRunTime = (cronExpression) => {
  try {
    const interval = CronExpressionParser.parse(cronExpression);
    return interval.next().toDate();
  } catch {
    return null;
  }
};
