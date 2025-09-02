import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const recentPosts = await prisma.post.findMany({
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
        publishedContent: true,
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
      orderBy: { createdAt: 'desc' },
      take: 12,
    })

    // Transform posts to include content fields for backward compatibility
    const transformedPosts = recentPosts.map(post => ({
      ...post,
      title: post.publishedContent?.title || 'Untitled',
      excerpt: post.publishedContent?.excerpt || null,
      featuredImage: post.publishedContent?.featuredImage || null,
    }))

    return NextResponse.json(transformedPosts)
  } catch (error) {
    console.error('Error fetching recent posts:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}