import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  const rssSource = await prisma.source.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'TechCrunch RSS',
      type: 'rss',
      config: {
        url: 'https://techcrunch.com/feed/',
        refreshInterval: 60,
        maxItems: 20
      },
      enabled: true
    }
  });

  console.log('Created RSS source:', rssSource.name);

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
