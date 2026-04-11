import * as cheerio from 'cheerio';
import { sanitizeHtml } from './helpers.js';

const ARTICLE_SELECTORS = [
  'article',
  '[role="main"]',
  'main',
  '.article',
  '.article-content',
  '.article-body',
  '.post',
  '.post-content',
  '.post-body',
  '.entry-content',
  '.entry-body',
  '.content',
  '.story',
  '.story-body',
  '#article',
  '#article-content',
  '#post-content',
  '#entry-content',
  '#main-content',
];

const UNwanted_SELECTORS = [
  'script',
  'style',
  'nav',
  'header',
  'footer',
  'aside',
  '.sidebar',
  '.advertisement',
  '.ad',
  '.social-share',
  '.comments',
  '.related',
  '.recommended',
  '[role="complementary"]',
  '[aria-label="advertisement"]',
];

/**
 * @param {string} url
 * @param {Object} options
 * @param {number} [options.timeout=15000]
 * @returns {Promise<{content: string, excerpt: string}|null>}
 */
export async function extractArticleContent(url, options = {}) {
  const timeout = options.timeout || 15000;
  
  let $;
  try {
    $ = await cheerio.fromURL(url, { timeout });
  } catch (error) {
    console.error(`Failed to fetch article from ${url}:`, error.message);
    return null;
  }

  for (const selector of UNwanted_SELECTORS) {
    $(selector).remove();
  }

  let articleContent = null;
  let bestScore = 0;

  for (const selector of ARTICLE_SELECTORS) {
    const element = $(selector).first();
    if (element.length) {
      const content = extractFromElement($, element);
      if (content.html && content.score > bestScore) {
        articleContent = content.html;
        bestScore = content.score;
      }
    }
  }

  if (!articleContent) {
    articleContent = findBestByDensity($);
  }

  if (!articleContent) {
    return null;
  }

  const sanitized = sanitizeHtml(articleContent);
  const excerpt = makeExcerpt(sanitized);

  return { content: sanitized, excerpt };
}

function extractFromElement($, element) {
  const text = element.text().trim();
  const paragraphs = element.find('p').length;
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const score = paragraphs * 10 + Math.min(wordCount / 10, 100);
  const html = element.html() || '';

  return { html, score, wordCount, paragraphs };
}

function findBestByDensity($) {
  let bestElement = null;
  let bestScore = 0;

  $('div, section, article').each((_, el) => {
    const element = $(el);
    const content = extractFromElement($, element);
    
    if (content.score > bestScore && content.wordCount > 100) {
      bestScore = content.score;
      bestElement = element;
    }
  });

  return bestElement ? bestElement.html() : null;
}

function makeExcerpt(html, maxLength = 300) {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return (lastSpace > maxLength * 0.8 
    ? truncated.substring(0, lastSpace) 
    : truncated
  ).trim() + '...';
}

export default extractArticleContent;