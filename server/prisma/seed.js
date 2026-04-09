import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Comprehensive list of popular RSS feeds by category
const popularRssFeeds = [
  // News
  { name: 'BBC News', category: 'news', url: 'http://feeds.bbci.co.uk/news/rss.xml', refreshInterval: 30 },
  { name: 'Reuters Top News', category: 'news', url: 'https://feeds.reuters.com/reuters/topNews', refreshInterval: 30 },
  { name: 'CNN Top Stories', category: 'news', url: 'http://rss.cnn.com/rss/edition.rss', refreshInterval: 30 },
  { name: 'Al Jazeera', category: 'news', url: 'https://www.aljazeera.com/xml/rss/all.xml', refreshInterval: 30 },
  { name: 'NPR News', category: 'news', url: 'https://feeds.npr.org/1001/rss.xml', refreshInterval: 30 },
  { name: 'The Guardian UK', category: 'news', url: 'https://www.theguardian.com/world/rss', refreshInterval: 30 },
  { name: 'Washington Post', category: 'news', url: 'https://feeds.washingtonpost.com/rss/national', refreshInterval: 30 },
  { name: 'ABC News', category: 'news', url: 'https://abcnews.go.com/abcnews/topstories', refreshInterval: 30 },

  // Tech
  { name: 'TechCrunch', category: 'tech', url: 'https://techcrunch.com/feed/', refreshInterval: 60 },
  { name: 'Ars Technica', category: 'tech', url: 'https://feeds.arstechnica.com/arstechnica/index', refreshInterval: 60 },
  { name: 'The Verge', category: 'tech', url: 'https://www.theverge.com/rss/index.xml', refreshInterval: 60 },
  { name: 'Wired', category: 'tech', url: 'https://www.wired.com/feed/rss', refreshInterval: 60 },
  { name: 'Hacker News', category: 'tech', url: 'https://hnrss.org/frontpage', refreshInterval: 30 },
  { name: 'Mashable', category: 'tech', url: 'https://mashable.com/feeds/rss', refreshInterval: 60 },
  { name: 'Engadget', category: 'tech', url: 'https://www.engadget.com/rss.xml', refreshInterval: 60 },
  { name: 'CNET', category: 'tech', url: 'https://www.cnet.com/rss/news/', refreshInterval: 60 },
  { name: 'MIT Tech Review', category: 'tech', url: 'https://www.technologyreview.com/feed/', refreshInterval: 60 },
  { name: 'TechRadar', category: 'tech', url: 'https://www.techradar.com/rss', refreshInterval: 60 },

  // Finance
  { name: 'Reuters Business', category: 'finance', url: 'https://feeds.reuters.com/reuters/businessNews', refreshInterval: 30 },
  { name: 'CNBC', category: 'finance', url: 'https://www.cnbc.com/rss/news.rss', refreshInterval: 30 },
  { name: 'Bloomberg', category: 'finance', url: 'https://feeds.bloomberg.com/markets/news.rss', refreshInterval: 30 },
  { name: 'Financial Times', category: 'finance', url: 'https://www.ft.com/?format=rss', refreshInterval: 30 },
  { name: 'Wall Street Journal', category: 'finance', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', refreshInterval: 30 },
  { name: 'Yahoo Finance', category: 'finance', url: 'https://finance.yahoo.com/news/rssindex', refreshInterval: 30 },
  { name: 'Investopedia', category: 'finance', url: 'https://www.investopedia.com/feedbuilder/feed/getfeed?feedName=rss_headline', refreshInterval: 60 },

  // Science
  { name: 'NASA News', category: 'science', url: 'https://www.nasa.gov/news-release/feed/', refreshInterval: 60 },
  { name: 'ScienceDaily', category: 'science', url: 'https://www.sciencedaily.com/rss/all.xml', refreshInterval: 60 },
  { name: 'New Scientist', category: 'science', url: 'https://www.newscientist.com/feed/home/', refreshInterval: 60 },
  { name: 'Nature', category: 'science', url: 'https://www.nature.com/nature.rss', refreshInterval: 60 },
  { name: 'Scientific American', category: 'science', url: 'https://rss.sciam.com/ScientificAmerican-Global', refreshInterval: 60 },
  { name: 'Phys.org', category: 'science', url: 'https://phys.org/rss-feed/', refreshInterval: 60 },

  // Programming / Dev
  { name: 'DEV Community', category: 'programming', url: 'https://dev.to/feed', refreshInterval: 30 },
  { name: 'Stack Overflow', category: 'programming', url: 'https://stackoverflow.com/feeds', refreshInterval: 60 },
  { name: 'GitHub Blog', category: 'programming', url: 'https://github.blog/feed/', refreshInterval: 60 },
  { name: 'CSS-Tricks', category: 'programming', url: 'https://css-tricks.com/feed/', refreshInterval: 60 },
  { name: 'Smashing Magazine', category: 'programming', url: 'https://www.smashingmagazine.com/feed/', refreshInterval: 60 },

  // Design / UX
  { name: 'Designer News', category: 'design', url: 'https://www.designernews.co/rss', refreshInterval: 60 },
  { name: 'Designboom', category: 'design', url: 'https://www.designboom.com/feed/', refreshInterval: 60 },
  { name: 'Creative Bloq', category: 'design', url: 'http://feeds.feedburner.com/creativebloq/blog', refreshInterval: 60 },

  // Marketing / Business
  { name: 'HubSpot Blog', category: 'marketing', url: 'https://blog.hubspot.com/marketing/feed', refreshInterval: 60 },
  { name: 'Moz Blog', category: 'marketing', url: 'https://moz.com/blog/feed', refreshInterval: 60 },
  { name: 'Search Engine Land', category: 'marketing', url: 'https://searchengineland.com/feed', refreshInterval: 60 },
  { name: 'Fast Company', category: 'business', url: 'https://fastcompany.com/feed/rss', refreshInterval: 60 },
  { name: 'Forbes', category: 'business', url: 'https://www.forbes.com/real-time/feed2/', refreshInterval: 30 },

  // General / Lifestyle
  { name: 'Lifehacker', category: 'lifestyle', url: 'https://lifehacker.com/rss', refreshInterval: 60 },
  { name: 'Medium', category: 'general', url: 'https://medium.com/feed', refreshInterval: 60 },
  { name: 'Reddit r/worldnews', category: 'news', url: 'https://www.reddit.com/r/worldnews/.rss', refreshInterval: 30 },
  { name: 'Product Hunt', category: 'tech', url: 'https://www.producthunt.com/feed', refreshInterval: 60 },
];

async function main() {
  console.log('Seeding database...');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@autoblog.local' },
    update: {},
    create: {
      email: 'admin@autoblog.local',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyDAiNqj1A1q0m',
      name: 'Admin',
      role: 'admin'
    }
  });

  console.log('Created admin user:', adminUser.email);

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'technology' },
      update: {},
      create: { name: 'Technology', slug: 'technology', description: 'Tech news and tutorials' }
    }),
    prisma.category.upsert({
      where: { slug: 'business' },
      update: {},
      create: { name: 'Business', slug: 'business', description: 'Business insights and strategies' }
    }),
    prisma.category.upsert({
      where: { slug: 'lifestyle' },
      update: {},
      create: { name: 'Lifestyle', slug: 'lifestyle', description: 'Lifestyle and personal development' }
    }),
    prisma.category.upsert({
      where: { slug: 'marketing' },
      update: {},
      create: { name: 'Marketing', slug: 'marketing', description: 'Marketing tips and strategies' }
    }),
    prisma.category.upsert({
      where: { slug: 'news' },
      update: {},
      create: { name: 'News', slug: 'news', description: 'Breaking news and current events' }
    }),
    prisma.category.upsert({
      where: { slug: 'finance' },
      update: {},
      create: { name: 'Finance', slug: 'finance', description: 'Financial news and markets' }
    }),
    prisma.category.upsert({
      where: { slug: 'science' },
      update: {},
      create: { name: 'Science', slug: 'science', description: 'Scientific discoveries and research' }
    }),
    prisma.category.upsert({
      where: { slug: 'programming' },
      update: {},
      create: { name: 'Programming', slug: 'programming', description: 'Programming and development' }
    }),
    prisma.category.upsert({
      where: { slug: 'design' },
      update: {},
      create: { name: 'Design', slug: 'design', description: 'Design and UX' }
    })
  ]);

  console.log('Created categories:', categories.length);

  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { slug: 'ai' },
      update: {},
      create: { name: 'AI', slug: 'ai' }
    }),
    prisma.tag.upsert({
      where: { slug: 'automation' },
      update: {},
      create: { name: 'Automation', slug: 'automation' }
    }),
    prisma.tag.upsert({
      where: { slug: 'productivity' },
      update: {},
      create: { name: 'Productivity', slug: 'productivity' }
    }),
    prisma.tag.upsert({
      where: { slug: 'trending' },
      update: {},
      create: { name: 'Trending', slug: 'trending' }
    })
  ]);

  console.log('Created tags:', tags.length);

  // Seed popular RSS feeds
  let feedsCreated = 0;
  for (const feed of popularRssFeeds) {
    // Create a stable UUID based on the feed name
    const uuid = require('uuid');
    const id = uuid.v5(feed.name, '00000000-0000-0000-0000-000000000000');

    await prisma.source.upsert({
      where: { id },
      update: {},
      create: {
        id,
        name: feed.name,
        type: 'rss',
        config: {
          url: feed.url,
          refreshInterval: feed.refreshInterval,
          maxItems: 20,
          category: feed.category
        },
        enabled: true
      }
    });
    feedsCreated++;
  }

  console.log(`Created ${feedsCreated} popular RSS feeds`);

  const aiSource = await prisma.source.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'AI Content Generator',
      type: 'ai_generation',
      config: {
        keywords: ['technology', 'automation', 'AI'],
        topic: 'Latest trends in artificial intelligence',
        tone: 'professional',
        maxLength: 1500
      },
      enabled: true
    }
  });

  console.log('Created AI source:', aiSource.name);

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
