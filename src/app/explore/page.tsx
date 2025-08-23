'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { ArticleCard } from '@/components/blog/article-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Clock, 
  TrendingUp, 
  Calendar,
  Eye,
  Heart,
  MessageCircle
} from 'lucide-react'
import Link from 'next/link'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featuredImage: string | null
  publishedAt: string
  readingTime: number | null
  viewCount: number
  likesCount: number
  commentsCount: number
  createdAt: string
  author: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  }
  categories: Array<{
    category: {
      id: string
      name: string
      slug: string
      color: string | null
    }
  }>
  tags: Array<{
    tag: {
      id: string
      name: string
      slug: string
    }
  }>
  _count: {
    likes: number
    comments: number
    bookmarks: number
  }
}

interface Category {
  id: string
  name: string
  slug: string
  color?: string
  _count: {
    posts: number
  }
}

export default function ExplorePage() {
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recent')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    async function fetchExploreData() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchTerm) params.append('q', searchTerm)
        if (sortBy !== 'recent') params.append('sort', sortBy)
        if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory)
        params.append('page', currentPage.toString())
        params.append('limit', '12')

        const [postsRes, categoriesRes] = await Promise.all([
          fetch(`/api/explore/posts?${params}`),
          fetch('/api/categories'),
        ])

        if (postsRes.ok) {
          const postsData = await postsRes.json()
          setPosts(postsData.posts)
          setTotalPages(postsData.pagination.pages)
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData)
        }
      } catch (error) {
        console.error('Error fetching explore data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchExploreData()
  }, [searchTerm, sortBy, selectedCategory, currentPage])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setSortBy('recent')
    setSelectedCategory('all')
    setCurrentPage(1)
  }

  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'trending', label: 'Trending' },
    { value: 'oldest', label: 'Oldest' },
  ]

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Explore Articles</h1>
              <p className="text-muted-foreground mb-8">
                Discover amazing stories and insights from our community
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-gray-200 h-64 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Explore Articles</h1>
            <p className="text-muted-foreground mb-8">
              Discover amazing stories and insights from our community
            </p>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search articles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </form>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.slug}>
                        {category.name} ({category._count.posts})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                {(searchTerm || sortBy !== 'recent' || selectedCategory !== 'all') && (
                  <Button variant="outline" onClick={handleClearFilters}>
                    <Filter className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Popular Categories */}
          {!searchTerm && selectedCategory === 'all' && categories.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Popular Categories</h2>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 10).map((category) => (
                  <Link
                    key={category.id}
                    href={`/explore?category=${category.slug}`}
                  >
                    <Badge
                      variant="secondary"
                      className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                      style={{ backgroundColor: category.color || undefined }}
                    >
                      {category.name} ({category._count.posts})
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="text-muted-foreground">
                {searchTerm && `Search results for "${searchTerm}"`}
                {selectedCategory !== 'all' && !searchTerm && `Posts in ${categories.find(c => c.slug === selectedCategory)?.name}`}
                {!searchTerm && selectedCategory === 'all' && 'All posts'}
              </div>
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
            </div>

            {posts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {posts.map((post) => (
                    <ArticleCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = currentPage <= 3 
                          ? i + 1 
                          : currentPage >= totalPages - 2
                            ? totalPages - 4 + i
                            : currentPage - 2 + i
                        
                        if (pageNum < 1 || pageNum > totalPages) return null
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={loading}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || loading}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No posts found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm
                        ? `No posts match "${searchTerm}"`
                        : selectedCategory !== 'all'
                        ? `No posts in this category`
                        : 'No posts available'}
                    </p>
                    {(searchTerm || selectedCategory !== 'all') && (
                      <Button variant="outline" onClick={handleClearFilters}>
                        Clear filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}