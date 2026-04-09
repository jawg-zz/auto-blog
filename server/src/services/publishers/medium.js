import fetch from 'node-fetch';
import { BasePublisher } from './index.js';
import { logger } from '../../utils/logger.js';

export class MediumPublisher extends BasePublisher {
  constructor(credentials) {
    super(credentials);
    this.accessToken = credentials.accessToken;
    this.userId = credentials.userId;
  }

  async publish(post) {
    const postData = this.preparePostData(post);

    try {
      const response = await fetch('https://api.medium.com/v1/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          userId: this.userId,
          title: postData.title,
          contentFormat: 'html',
          content: postData.content,
          tags: postData.tags || [],
          publishStatus: 'public',
          notifyFollowers: true,
          canonicalUrl: postData.seo?.canonicalUrl
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      const data = result.data;

      logger.info(`Post published to Medium: ${data.url}`);
      
      return {
        success: true,
        url: data.url,
        id: data.id
      };
    } catch (error) {
      logger.error('Medium publish failed:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const response = await fetch('https://api.medium.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const user = await response.json();
        return { success: true, user: { id: user.data.id, username: user.data.username } };
      }

      return { success: false, error: `Authentication failed: ${response.status}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export async function testMediumConnection(credentials) {
  const publisher = new MediumPublisher(credentials);
  return publisher.testConnection();
}
