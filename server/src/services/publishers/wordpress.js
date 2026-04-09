import fetch from 'node-fetch';
import { BasePublisher } from './index.js';
import { logger } from '../../utils/logger.js';

export class WordPressPublisher extends BasePublisher {
  constructor(credentials) {
    super(credentials);
    this.siteUrl = credentials.siteUrl.replace(/\/$/, '');
    this.username = credentials.username;
    this.appPassword = credentials.appPassword;
  }

  async publish(post) {
    const postData = this.preparePostData(post);
    
    const auth = Buffer.from(`${this.username}:${this.appPassword}`).toString('base64');

    try {
      const response = await fetch(`${this.siteUrl}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: postData.title,
          content: postData.content,
          excerpt: postData.excerpt || postData.seo?.description || '',
          status: 'publish',
          featured_media: postData.featuredImage ? await this.uploadMedia(postData.featuredImage) : 0,
          categories: await this.getCategoryIds(postData.categories),
          tags: await this.getTagIds(postData.tags),
          meta: {
            _yoast_wpseo_title: postData.seo?.title || '',
            _yoast_wpseo_metadesc: postData.seo?.description || ''
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      logger.info(`Post published to WordPress: ${result.link}`);
      
      return {
        success: true,
        url: result.link,
        id: result.id
      };
    } catch (error) {
      logger.error('WordPress publish failed:', error);
      throw error;
    }
  }

  async uploadMedia(imageUrl) {
    try {
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.buffer();
      const imageName = imageUrl.split('/').pop() || 'image.jpg';

      const mediaResponse = await fetch(`${this.siteUrl}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.username}:${this.appPassword}`).toString('base64')}`,
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="${imageName}"`
        },
        body: imageBuffer
      });

      if (mediaResponse.ok) {
        const media = await mediaResponse.json();
        return media.id;
      }
    } catch (error) {
      logger.warn('Media upload failed:', error);
    }
    return 0;
  }

  async getCategoryIds(categories) {
    return [];
  }

  async getTagIds(tags) {
    return [];
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.siteUrl}/wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.username}:${this.appPassword}`).toString('base64')}`
        }
      });

      if (response.ok) {
        const user = await response.json();
        return { success: true, user: { name: user.name, url: this.siteUrl } };
      }

      return { success: false, error: `Authentication failed: ${response.status}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export async function testWordPressConnection(credentials) {
  const publisher = new WordPressPublisher(credentials);
  return publisher.testConnection();
}
