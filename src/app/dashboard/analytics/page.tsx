'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDistanceToNow, format } from 'date-fns'
import { 
  BarChart3, 
  Eye, 
  Heart, 
  MessageCircle, 
  TrendingUp,
  Calendar,
  Users,
  Clock
} from 'lucide-react'
import Link from 'next/link'

interface AnalyticsData {
  overview: {
    totalViews: number
    totalLikes: number
    totalComments: number
    avgReadTime: number
    postsPublished: number
    viewsThisMonth: number
    likesThisMonth: number
    commentsThisMonth: number
  }
  topPosts: Array<{
    id: string
    title: string
    slug: string
    viewCount: number
    likesCount: number
    commentsCount: number
    publishedAt: string
  }>
  recentActivity: Array<{
    type: 'view' | 'like' | 'comment'
    postTitle: string
    count: number
    date: string
  }>
  monthlyStats: Array<{
    month: string
    views: number
    likes: number
    comments: number
  }>
}

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    async function fetchAnalytics() {
      if (!session?.user?.id) return

      try {
        const response = await fetch(`/api/analytics/dashboard?range=${timeRange}`)
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [session?.user?.id, timeRange])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your content performance</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-24 rounded"></div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-pulse bg-gray-200 h-96 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-96 rounded"></div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your content performance</p>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
              <p className="text-muted-foreground">
                Start publishing posts to see your analytics data here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { overview, topPosts, recentActivity, monthlyStats } = analytics

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your content performance and audience engagement
          </p>
        </div>
        
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {range === '7d' && '7 days'}
              {range === '30d' && '30 days'}
              {range === '90d' && '90 days'}
              {range === '1y' && '1 year'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{overview.viewsThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalLikes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{overview.likesThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalComments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{overview.commentsThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Read Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.avgReadTime} min</div>
            <p className="text-xs text-muted-foreground">
              {overview.postsPublished} posts published
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Top Performing Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPosts.length > 0 ? (
              <div className="space-y-4">
                {topPosts.slice(0, 5).map((post, index) => (
                  <div key={post.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <Link 
                        href={`/${post.slug}`}
                        className="font-medium hover:underline line-clamp-1"
                      >
                        {post.title}
                      </Link>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Eye className="mr-1 h-3 w-3" />
                          {post.viewCount}
                        </div>
                        <div className="flex items-center">
                          <Heart className="mr-1 h-3 w-3" />
                          {post.likesCount}
                        </div>
                        <div className="flex items-center">
                          <MessageCircle className="mr-1 h-3 w-3" />
                          {post.commentsCount}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">#{index + 1}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No published posts yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Monthly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyStats.length > 0 ? (
              <div className="space-y-4">
                {monthlyStats.slice(0, 6).map((month) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <div className="font-medium">{month.month}</div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center text-blue-600">
                        <Eye className="mr-1 h-3 w-3" />
                        {month.views}
                      </div>
                      <div className="flex items-center text-red-600">
                        <Heart className="mr-1 h-3 w-3" />
                        {month.likes}
                      </div>
                      <div className="flex items-center text-green-600">
                        <MessageCircle className="mr-1 h-3 w-3" />
                        {month.comments}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No performance data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Post Performance */}
      {topPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Posts Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Likes</TableHead>
                  <TableHead>Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <Link 
                        href={`/${post.slug}`}
                        className="font-medium hover:underline"
                      >
                        {post.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(post.publishedAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{post.viewCount.toLocaleString()}</TableCell>
                    <TableCell>{post.likesCount.toLocaleString()}</TableCell>
                    <TableCell>{post.commentsCount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}