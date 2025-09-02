import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { format, subDays, subMonths } from 'date-fns'

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
    const range = url.searchParams.get('range') || '30d'
    
    const userId = session.user.id
    const now = new Date()
    
    // Calculate date range
    let startDate: Date
    switch (range) {
      case '7d':
        startDate = subDays(now, 7)
        break
      case '90d':
        startDate = subDays(now, 90)
        break
      case '1y':
        startDate = subDays(now, 365)
        break
      default: // 30d
        startDate = subDays(now, 30)
    }

    // Get all user's published posts for analysis
    const userPosts = await prisma.post.findMany({
      where: {
        authorId: userId,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        viewCount: true,
        likesCount: true,
        commentsCount: true,
        publishedAt: true,
        readingTime: true,
        publishedContent: {
          select: {
            title: true,
          },
        },
      },
    })

    // Calculate overview stats
    const totalViews = userPosts.reduce((sum, post) => sum + post.viewCount, 0)
    const totalLikes = userPosts.reduce((sum, post) => sum + post.likesCount, 0)
    const totalComments = userPosts.reduce((sum, post) => sum + post.commentsCount, 0)
    const avgReadTime = userPosts.length > 0 
      ? Math.round(userPosts.reduce((sum, post) => sum + (post.readingTime || 0), 0) / userPosts.length)
      : 0

    // Get this month's stats
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthPosts = userPosts.filter(post => 
      post.publishedAt && new Date(post.publishedAt) >= thisMonthStart
    )
    
    const viewsThisMonth = thisMonthPosts.reduce((sum, post) => sum + post.viewCount, 0)
    const likesThisMonth = thisMonthPosts.reduce((sum, post) => sum + post.likesCount, 0)
    const commentsThisMonth = thisMonthPosts.reduce((sum, post) => sum + post.commentsCount, 0)

    // Get top performing posts
    const topPosts = userPosts
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10)

    // Generate monthly stats for the last 6 months
    const monthlyStats = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const monthPosts = userPosts.filter(post => {
        if (!post.publishedAt) return false
        const publishedDate = new Date(post.publishedAt)
        return publishedDate >= monthStart && publishedDate <= monthEnd
      })

      monthlyStats.push({
        month: format(monthStart, 'MMM yyyy'),
        views: monthPosts.reduce((sum, post) => sum + post.viewCount, 0),
        likes: monthPosts.reduce((sum, post) => sum + post.likesCount, 0),
        comments: monthPosts.reduce((sum, post) => sum + post.commentsCount, 0),
      })
    }

    // Mock recent activity data (you can implement this based on your needs)
    const recentActivity = [
      {
        type: 'view' as const,
        postTitle: topPosts[0]?.publishedContent?.title || 'Sample Post',
        count: 25,
        date: new Date().toISOString(),
      },
      {
        type: 'like' as const,
        postTitle: topPosts[1]?.publishedContent?.title || 'Another Post',
        count: 5,
        date: subDays(now, 1).toISOString(),
      },
      {
        type: 'comment' as const,
        postTitle: topPosts[2]?.publishedContent?.title || 'Third Post',
        count: 2,
        date: subDays(now, 2).toISOString(),
      },
    ].filter(activity => activity.postTitle !== 'Sample Post' && activity.postTitle !== 'Another Post' && activity.postTitle !== 'Third Post')

    const analytics = {
      overview: {
        totalViews,
        totalLikes,
        totalComments,
        avgReadTime,
        postsPublished: userPosts.length,
        viewsThisMonth,
        likesThisMonth,
        commentsThisMonth,
      },
      topPosts,
      recentActivity,
      monthlyStats,
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}