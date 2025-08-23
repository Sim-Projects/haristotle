'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PostsTable } from '@/components/dashboard/posts-table'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PenTool, Plus, FileText, Edit, Eye, Archive } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter') || 'all'
  const [posts, setPosts] = useState([])
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, views: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      if (!session?.user?.id) return

      try {
        const postsUrl = filter === 'all' 
          ? '/api/posts/my-posts' 
          : `/api/posts/my-posts?filter=${filter}`
        
        const [postsRes, statsRes] = await Promise.all([
          fetch(postsUrl),
          fetch('/api/stats/my-stats'),
        ])

        if (postsRes.ok) {
          const postsData = await postsRes.json()
          setPosts(postsData.posts || postsData)
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [session?.user?.id, filter])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {session?.user?.name}!</p>
          </div>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-24 rounded"></div>
          ))}
        </div>
        
        <div className="animate-pulse bg-gray-200 h-96 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {session?.user?.name}!
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/write">
              <PenTool className="mr-2 h-4 w-4" />
              New Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardStats stats={stats} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PenTool className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <Link href="/write">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Post
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard?filter=drafts">
                  Resume Draft
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your recent posts and activities will appear here.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Post Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Posts</CardTitle>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All Posts', icon: FileText, count: stats.total },
                { key: 'published', label: 'Published', icon: Eye, count: stats.published },
                { key: 'drafts', label: 'Drafts', icon: Edit, count: stats.drafts },
                { key: 'archived', label: 'Archived', icon: Archive, count: 0 },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = filter === tab.key
                return (
                  <Link
                    key={tab.key}
                    href={tab.key === 'all' ? '/dashboard' : `/dashboard?filter=${tab.key}`}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                    {tab.count > 0 && (
                      <Badge 
                        variant="secondary" 
                        className={`ml-2 ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : ''}`}
                      >
                        {tab.count}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PostsTable posts={posts} onUpdate={() => window.location.reload()} />
        </CardContent>
      </Card>
    </div>
  )
}