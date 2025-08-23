import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const [postsCount, authorsCount, categoriesCount] = await Promise.all([
      prisma.post.count({ where: { status: 'PUBLISHED' } }),
      prisma.user.count(),
      prisma.category.count(),
    ])

    const stats = {
      posts: postsCount,
      authors: authorsCount,
      categories: categoriesCount,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}