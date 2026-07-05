import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRAPER = path.resolve(__dirname, '../../scripts/kenyan-news');

export class KenyanNewsSource {
  constructor(config) {
    this.config = config;
    this.sites = config.sites || ['kenyans'];
    this.maxItems = config.maxItems || 10;
  }

  async fetch() {
    logger.info(`KenyanNewsSource: Fetching from ${this.sites.join(', ')}`);

    const cmd = this._buildCmd(`--site ${this.sites[0]} --json 2>/dev/null`, false);
    let headlines = [];

    try {
      const stdout = execSync(cmd, { timeout: 60000, maxBuffer: 5 * 1024 * 1024 });
      const data = JSON.parse(stdout.toString());
      const siteName = this.sites[0];
      headlines = (data[siteName] || []).slice(0, this.maxItems);
      logger.info(`KenyanNewsSource: Got ${headlines.length} headlines from ${siteName}`);
    } catch (error) {
      logger.error(`KenyanNewsSource: Failed to fetch headlines: ${error.message}`);
      throw error;
    }

    // Get full article text for each headline (batched)
    const items = [];
    for (let i = 0; i < headlines.length; i += 3) {
      const batch = headlines.slice(i, i + 3);
      const results = await Promise.allSettled(batch.map(h => this._fetchArticle(h)));
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) items.push(result.value);
      }
    }

    logger.info(`KenyanNewsSource: Fetched ${items.length} articles`);
    return items;
  }

  async _fetchArticle(headline) {
    const url = headline.url;
    if (!url) return null;
    try {
      const cmd = this._buildCmd(`--open "${url}" 2>/dev/null`, true);
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

  _buildCmd(args, withPlaywright) {
    const deps = withPlaywright
      ? '--with newspaper4k --with lxml_html_clean --with pillow --with playwright'
      : '--with newspaper4k --with lxml_html_clean --with pillow';
    return `cd /app && uv run ${deps} python3 scripts/kenyan-news ${args}`;
  }
}

export const kenyanNewsService = {
  async fetch(config) {
    const source = new KenyanNewsSource(config);
    return source.fetch();
  }
};
