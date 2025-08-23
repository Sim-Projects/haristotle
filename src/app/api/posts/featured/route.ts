import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const featuredPosts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
      orderBy: [
        { likesCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 6,
    })

    return NextResponse.json(featuredPosts)
  } catch (error) {
    console.error('Error fetching featured posts:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}