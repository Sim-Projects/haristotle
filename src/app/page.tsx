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

  const [mainFeatured, ...otherFeatured] = featuredPosts

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
        <section className="bg-white border-b">
          <div className="container mx-auto px-4 py-12 max-w-screen-2xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Write, Publish, <span className="text-primary">Share</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                A modern blog platform with a Notion-like editor. Share your thoughts and stories with the world.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={handleStartWriting}>
                  Start Writing
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/explore">Explore Articles</Link>
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardContent className="flex items-center p-6">
                  <BookOpen className="h-8 w-8 text-primary mr-4" />
                  <div>
                    <p className="text-2xl font-bold">{stats.posts}</p>
                    <p className="text-sm text-muted-foreground">Articles Published</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center p-6">
                  <Users className="h-8 w-8 text-primary mr-4" />
                  <div>
                    <p className="text-2xl font-bold">{stats.authors}</p>
                    <p className="text-sm text-muted-foreground">Active Writers</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center p-6">
                  <TrendingUp className="h-8 w-8 text-primary mr-4" />
                  <div>
                    <p className="text-2xl font-bold">{stats.categories}</p>
                    <p className="text-sm text-muted-foreground">Categories</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="py-12">
            <div className="container mx-auto px-4 max-w-screen-2xl">
              <h2 className="text-3xl font-bold mb-8">Featured Articles</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Main Featured */}
                {mainFeatured && (
                  <div className="lg:row-span-2">
                    <ArticleCard post={mainFeatured} variant="featured" />
                  </div>
                )}
                
                {/* Other Featured */}
                <div className="space-y-6">
                  {otherFeatured.slice(0, 3).map((post) => (
                    <ArticleCard key={post.id} post={post} variant="compact" />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Recent Posts */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 max-w-screen-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Latest Articles</h2>
              <Button asChild variant="outline">
                <Link href="/explore">View All</Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="py-12">
            <div className="container mx-auto px-4 max-w-screen-2xl">
              <h2 className="text-3xl font-bold mb-8">Popular Categories</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {categories.map((category) => (
                  <Link key={category.id} href={`/category/${category.slug}`}>
                    <Badge
                      variant="secondary"
                      className="w-full justify-center py-2 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                      style={{ backgroundColor: category.color || undefined }}
                    >
                      <span className="text-center">
                        {category.name}
                        <br />
                        <span className="text-xs opacity-70">
                          {category._count.posts} posts
                        </span>
                      </span>
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
