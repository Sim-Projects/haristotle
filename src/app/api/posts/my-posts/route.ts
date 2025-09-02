import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const filter = url.searchParams.get('filter')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Build where clause based on filter
    const where: any = {
      authorId: session.user.id,
    }

    if (filter) {
      switch (filter) {
        case 'drafts':
          where.status = 'DRAFT'
          break
        case 'published':
          where.status = 'PUBLISHED'
          break
        case 'archived':
          where.status = 'ARCHIVED'
          break
        case 'private':
          where.status = 'PRIVATE'
          break
        // 'all' or any other value shows all posts
      }
    }

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          draftContent: true,
          publishedContent: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.post.count({ where }),
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching user posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}