import { BaseSource } from './index.js';
import { generateContent } from '../ai/index.js';

export class AiSource extends BaseSource {
  constructor(config) {
    super(config);
  }

  async fetch() {
    const { keywords, topic, tone, maxLength } = this.config;

    const prompt = this.buildPrompt(keywords, topic, tone, maxLength);

    try {
      const content = await generateContent(prompt, {
        maxTokens: maxLength || 2000
      });

      return [{
        title: this.generateTitle(content),
        content: content,
        excerpt: content.substring(0, 300) + '...',
        generatedAt: new Date().toISOString()
      }];
    } catch (error) {
      throw error;
    }
  }

  buildPrompt(keywords, topic, tone, maxLength) {
    let prompt = 'Write a blog post';

    if (topic) {
      prompt += ` about ${topic}`;
    }

    if (keywords && keywords.length > 0) {
      prompt += `. Include the following keywords: ${keywords.join(', ')}`;
    }

    if (tone) {
      prompt += `. Use a ${tone} tone`;
    }

    prompt += '. Format as HTML with proper paragraph tags.';

    return prompt;
  }

  generateTitle(content) {
    const firstSentence = content.match(/[^.!?]+[.!?]/);
    if (firstSentence) {
      let title = firstSentence[0].trim();
      title = title.replace(/<[^>]*>/g, '');
      if (title.length > 60) {
        title = title.substring(0, 57) + '...';
      }
      return title;
    }
    return 'Generated Blog Post';
  }
}
