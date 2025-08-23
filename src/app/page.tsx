'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { ArticleCard } from '@/components/blog/article-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { TrendingUp, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([])
  const [recentPosts, setRecentPosts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [stats, setStats] = useState({ posts: 0, authors: 0, categories: 0 })
  const [loading, setLoading] = useState(true)
  const { requireAuth, isAuthenticated } = useAuth()

  useEffect(() => {
    async function fetchData() {
      try {
        const [featuredRes, recentRes, categoriesRes, statsRes] = await Promise.all([
          fetch('/api/posts/featured'),
          fetch('/api/posts/recent'),
          fetch('/api/categories'),
          fetch('/api/stats'),
        ])

        if (featuredRes.ok) {
          const featured = await featuredRes.json()
          setFeaturedPosts(featured)
        }

        if (recentRes.ok) {
          const recent = await recentRes.json()
          setRecentPosts(recent)
        }

        if (categoriesRes.ok) {
          const cats = await categoriesRes.json()
          setCategories(cats)
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
      } catch (error) {
        console.error('Error fetching homepage data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleStartWriting = () => {
    if (isAuthenticated) {
      window.location.href = '/write'
    } else {
      requireAuth({
        title: "Sign in to start writing",
        description: "Create an account or sign in to start writing and sharing your stories on Haristotle.",
        callbackUrl: "/write"
      })
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-white to-gray-50 border-b">
          <div className="container mx-auto px-4 py-16 max-w-screen-2xl">
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-primary bg-clip-text text-transparent">
                Write, Publish, <span className="text-primary">Share</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                A modern blog platform with a Notion-like editor. Share your thoughts and stories with the world.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button size="lg" onClick={handleStartWriting} className="text-lg px-8 py-3 cursor-pointer">
                  Start Writing
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3 cursor-pointer">
                  <Link href="/explore">Explore Articles</Link>
                </Button>
              </div>
            </div>

            {/* Stats - Ultra Compact Design */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-xs sm:max-w-md mx-auto">
              <Card className="hover:shadow-md transition-all hover:scale-105 border-0 shadow-sm">
                <CardContent className="flex flex-col items-center text-center p-2 sm:p-3">
                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-primary mb-1" />
                  <p className="text-sm sm:text-base font-bold">{stats.posts}</p>
                  <p className="text-xs text-muted-foreground">Articles</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-all hover:scale-105 border-0 shadow-sm">
                <CardContent className="flex flex-col items-center text-center p-2 sm:p-3">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary mb-1" />
                  <p className="text-sm sm:text-base font-bold">{stats.authors}</p>
                  <p className="text-xs text-muted-foreground">Writers</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-all hover:scale-105 border-0 shadow-sm">
                <CardContent className="flex flex-col items-center text-center p-2 sm:p-3">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary mb-1" />
                  <p className="text-sm sm:text-base font-bold">{stats.categories}</p>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="py-12">
            <div className="container mx-auto px-4 max-w-6xl">
              <h2 className="text-3xl font-bold mb-8">Featured Articles</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {featuredPosts.slice(0, 4).map((post) => (
                  <ArticleCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recent Posts */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Latest Articles</h2>
              <Button asChild variant="outline" className="cursor-pointer">
                <Link href="/explore">View All</Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recentPosts.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
