import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding the database...')

  // Create default categories
  const techCategory = await prisma.category.upsert({
    where: { slug: 'technology' },
    update: {},
    create: {
      name: 'Technology',
      slug: 'technology',
      description: 'Articles about technology, programming, and software development',
      color: '#3B82F6',
    },
  })

  const designCategory = await prisma.category.upsert({
    where: { slug: 'design' },
    update: {},
    create: {
      name: 'Design',
      slug: 'design',
      description: 'Articles about UI/UX design, graphic design, and creative processes',
      color: '#8B5CF6',
    },
  })

  const businessCategory = await prisma.category.upsert({
    where: { slug: 'business' },
    update: {},
    create: {
      name: 'Business',
      slug: 'business',
      description: 'Articles about entrepreneurship, startup culture, and business strategy',
      color: '#10B981',
    },
  })

  const lifestyleCategory = await prisma.category.upsert({
    where: { slug: 'lifestyle' },
    update: {},
    create: {
      name: 'Lifestyle',
      slug: 'lifestyle',
      description: 'Articles about personal development, health, and life experiences',
      color: '#F59E0B',
    },
  })

  // Create default tags
  const tags = [
    'react',
    'nextjs',
    'javascript',
    'typescript',
    'nodejs',
    'web-development',
    'ui-design',
    'ux-design',
    'productivity',
    'career',
    'startup',
    'entrepreneurship',
  ]

  for (const tagName of tags) {
    await prisma.tag.upsert({
      where: { slug: tagName },
      update: {},
      create: {
        name: tagName.charAt(0).toUpperCase() + tagName.slice(1).replace('-', ' '),
        slug: tagName,
      },
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log(`📊 Created ${4} categories and ${tags.length} tags`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })