'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, FileText, TrendingUp, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  image?: string
  createdAt: string
  _count: {
    posts: number
  }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories?limit=100')
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
          setFilteredCategories(data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    if (!searchTerm) {
      setFilteredCategories(categories)
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCategories(filtered)
    }
  }, [searchTerm, categories])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Categories</h1>
              <p className="text-muted-foreground mb-8">
                Explore articles by topic and discover new interests
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-gray-200 h-32 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalPosts = categories.reduce((sum, category) => sum + category._count.posts, 0)
  const topCategories = categories.slice(0, 3)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Categories</h1>
            <p className="text-muted-foreground mb-8">
              Explore articles by topic and discover new interests
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                {categories.length} categories • {totalPosts} total posts
              </div>
            </div>
          </div>

          {/* Top Categories */}
          {!searchTerm && topCategories.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-center">Popular Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {topCategories.map((category, index) => (
                  <Card 
                    key={category.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer relative overflow-hidden"
                  >
                    <Link href={`/explore?category=${category.slug}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <Badge variant="secondary">#{index + 1}</Badge>
                        </div>
                        {category.description && (
                          <CardDescription>{category.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            {category._count.posts} posts
                          </div>
                          <div className="flex items-center">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Popular
                          </div>
                        </div>
                      </CardContent>
                      {category.color && (
                        <div 
                          className="absolute top-0 right-0 w-4 h-full opacity-60"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All Categories */}
          <div>
            <h2 className="text-2xl font-bold mb-6">
              {searchTerm ? `Search Results for "${searchTerm}"` : 'All Categories'}
            </h2>
            
            {filteredCategories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCategories.map((category) => (
                  <Card 
                    key={category.id} 
                    className="hover:shadow-md transition-all hover:scale-105 cursor-pointer group"
                  >
                    <Link href={`/explore?category=${category.slug}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                          {category.color && (
                            <div 
                              className="w-3 h-3 rounded-full opacity-80"
                              style={{ backgroundColor: category.color }}
                            />
                          )}
                        </div>
                        
                        {category.description && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {category._count.posts}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(new Date(category.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No categories found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm
                        ? `No categories match "${searchTerm}"`
                        : 'No categories available'}
                    </p>
                    {searchTerm && (
                      <Button variant="outline" onClick={() => setSearchTerm('')}>
                        Clear search
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Browse All Posts Link */}
          <div className="text-center pt-8">
            <Button asChild size="lg">
              <Link href="/explore">
                <FileText className="mr-2 h-4 w-4" />
                Browse All Posts
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}