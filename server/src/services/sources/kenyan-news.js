import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class KenyanNewsSource {
  constructor(config) {
    this.config = config;
    this.sites = config.sites || ['kenyans'];
    this.maxItems = config.maxItems || 10;
  }

  async fetch() {
    logger.info(`KenyanNewsSource: Fetching from ${this.sites.join(', ')}`);

    const cmd = `cd /app && uv run --no-project python3 scripts/kenyan-news --site ${this.sites[0]} --json 2>/dev/null`;
    let headlines = [];

    try {
      const stdout = execSync(cmd, { timeout: 60000, maxBuffer: 5 * 1024 * 1024 });
      const data = JSON.parse(stdout.toString());
      headlines = (data[this.sites[0]] || []).slice(0, this.maxItems);
      logger.info(`KenyanNewsSource: Got ${headlines.length} headlines`);
    } catch (error) {
      logger.error(`KenyanNewsSource: Failed to fetch headlines: ${error.message}`);
      throw error;
    }

    const items = [];
    for (let i = 0; i < headlines.length; i += 3) {
      const batch = headlines.slice(i, i + 3);
      const results = await Promise.allSettled(batch.map(h => this._fetchArticle(h)));
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) items.push(r.value);
      }
    }

    logger.info(`KenyanNewsSource: Fetched ${items.length} articles`);
    return items;
  }

  async _fetchArticle(headline) {
    const url = headline.url;
    if (!url) return null;
    try {
      const cmd = `cd /app && uv run --no-project python3 scripts/kenyan-news --open "${url}" 2>/dev/null`;
      const stdout = execSync(cmd, { timeout: 30000, maxBuffer: 2 * 1024 * 1024 });
      const output = stdout.toString().trim();
      const titleMatch = output.match(/={65}\n\s{2}(.+?)\n/);
      const title = titleMatch ? titleMatch[1].trim() : headline.title;
      const parts = output.split(/={65}\n/);
      const bodySection = parts.length > 1 ? parts[parts.length - 1] : output;
      let content = bodySection
        .replace(/^\s*📷\s+https?:\/\/\S+\s*\n?/m, '')
        .replace(/─{65}\n\s*⚠️.+?\n─{65}\n?/s, '')
        .replace(/Subscribe.*$/s, '')
        .trim();
      if (!content || content.length < 50) content = headline.title;
      return {
        title: title.slice(0, 500),
        content,
        excerpt: content.slice(0, 300),
        link: url,
        pubDate: new Date().toISOString(),
        categories: [],
        author: 'Kenyan News Scraper',
        featuredImage: headline.top_image || ''
      };
    } catch (error) {
      logger.warn(`KenyanNewsSource: Failed to fetch article ${url}: ${error.message}`);
      return {
        title: headline.title.slice(0, 500),
        content: headline.title,
        excerpt: headline.title,
        link: url,
        pubDate: new Date().toISOString(),
        categories: [],
        author: 'Kenyan News Scraper',
        featuredImage: headline.top_image || ''
      };
    }
  }
}

export const kenyanNewsService = {
  async fetch(config) {
    const source = new KenyanNewsSource(config);
    return source.fetch();
  }
};
