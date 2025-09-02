import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get post counts by status
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      archivedPosts,
      totalViews,
      totalLikes,
      totalComments,
    ] = await Promise.all([
      // Total posts count
      prisma.post.count({
        where: { authorId: userId },
      }),
      
      // Published posts count
      prisma.post.count({
        where: { 
          authorId: userId,
          status: 'PUBLISHED',
        },
      }),
      
      // Draft posts count
      prisma.post.count({
        where: { 
          authorId: userId,
          status: 'DRAFT',
        },
      }),
      
      // Archived posts count
      prisma.post.count({
        where: { 
          authorId: userId,
          status: 'ARCHIVED',
        },
      }),
      
      // Total views across all posts
      prisma.post.aggregate({
        where: { authorId: userId },
        _sum: {
          viewCount: true,
        },
      }),
      
      // Total likes across all posts
      prisma.post.aggregate({
        where: { authorId: userId },
        _sum: {
          likesCount: true,
        },
      }),
      
      // Total comments across all posts
      prisma.post.aggregate({
        where: { authorId: userId },
        _sum: {
          commentsCount: true,
        },
      }),
    ])

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentStats = await prisma.post.count({
      where: {
        authorId: userId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    })

    // Get top performing posts
    const topPosts = await prisma.post.findMany({
      where: {
        authorId: userId,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        slug: true,
        viewCount: true,
        likesCount: true,
        publishedAt: true,
        publishedContent: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: 5,
    })

    const stats = {
      total: totalPosts,
      published: publishedPosts,
      drafts: draftPosts,
      archived: archivedPosts,
      views: totalViews._sum.viewCount || 0,
      likes: totalLikes._sum.likesCount || 0,
      comments: totalComments._sum.commentsCount || 0,
      recentPosts: recentStats,
      topPosts: topPosts.map(post => ({
        id: post.id,
        slug: post.slug,
        viewCount: post.viewCount,
        likesCount: post.likesCount,
        publishedAt: post.publishedAt,
        title: post.publishedContent?.title || 'Untitled',
      })),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}