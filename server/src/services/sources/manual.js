import { BaseSource } from './index.js';

export class ManualSource extends BaseSource {
  constructor(config) {
    super(config);
  }

  async fetch() {
    return [];
  }

  async process(data) {
    return {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || null,
      featuredImage: data.featuredImage || null,
      seoTitle: data.seoTitle || data.title,
      seoDescription: data.seoDescription || null,
      categories: data.categories || [],
      tags: data.tags || [],
      status: 'draft'
    };
  }
}
