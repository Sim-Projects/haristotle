'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { DynamicBlockNoteEditor as BlockNoteEditor } from '@/components/editor/dynamic-block-note-editor'
import { ArticleCard } from '@/components/blog/article-card'
import { 
  Clock, 
  Calendar, 
  Eye, 
  Lock, 
  AlertTriangle,
  Edit
} from 'lucide-react'

interface PreviewPageProps {
  params: Promise<{ id: string }>
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    async function fetchPost() {
      try {
        const { id } = await params
        
        if (!session?.user?.id) {
          setError('You must be signed in to preview posts')
          setLoading(false)
          return
        }

        const response = await fetch(`/api/posts/preview/${id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Post not found')
            return
          }
          if (response.status === 403) {
            setError('You do not have permission to preview this post')
            return
          }
          throw new Error('Failed to fetch post')
        }

        const postData = await response.json()
        setPost(postData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [params, session])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading preview...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error || 'Post not found'}</p>
            <div className="space-x-2">
              <button onClick={() => router.back()} className="underline">
                Go back
              </button>
              {!session && (
                <Link href="/login" className="underline text-blue-600">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const createdAt = post.updatedAt ? new Date(post.updatedAt) : new Date(post.createdAt)
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true })
  const formattedDate = format(createdAt, 'MMMM d, yyyy')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Preview Notice */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-medium">Preview Mode</p>
                <p className="text-yellow-600 text-sm">This is a preview of your unpublished post</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                <Lock className="h-3 w-3 mr-1" />
                {post.status || 'DRAFT'}
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/write/${post.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Post
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <article className="bg-white">
        {/* Hero Section */}
        <div className="relative">
          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative aspect-[21/9] max-h-[400px]">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          )}
          
          {/* Article Header */}
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="py-12 relative z-10">
              {/* Categories */}
              {post.categories?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.categories.map(({ category }: any) => (
                    <Badge
                      key={category.id}
                      variant="secondary"
                      style={{ backgroundColor: category.color || undefined }}
                      className="text-sm"
                    >
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {post.title || 'Untitled Post'}
              </h1>
              
              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  {post.excerpt}
                </p>
              )}
              
              {/* Author and Meta Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={post.author.image || ''} alt={post.author.name || ''} />
                    <AvatarFallback>
                      {post.author.name?.charAt(0)?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold">{post.author.name}</p>
                      {post.author.isVerified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Last updated {formattedDate}</span>
                      </div>
                      {post.readingTime && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{post.readingTime} min read</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Article Content */}
        <div className="container mx-auto px-4 max-w-4xl py-12">
          <div className="prose prose-lg max-w-none">
            {post.content ? (
              <BlockNoteEditor
                initialContent={post.content}
                editable={false}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg mb-2">No content yet</p>
                <p className="text-sm">Start writing your post to see content here</p>
              </div>
            )}
          </div>
        </div>
        
        <Separator />
        
        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="container mx-auto px-4 max-w-4xl py-8">
            <div className="flex flex-wrap gap-2">
              {post.tags.map(({ tag }: any) => (
                <Badge key={tag.id} variant="outline" className="cursor-default">
                  #{tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <Separator />
        
        {/* Author Bio */}
        <div className="container mx-auto px-4 max-w-4xl py-12">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-start space-x-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={post.author.image || ''} alt={post.author.name || ''} />
                  <AvatarFallback className="text-2xl">
                    {post.author.name?.charAt(0)?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-bold">{post.author.name}</h3>
                    {post.author.isVerified && (
                      <Badge variant="secondary">Verified</Badge>
                    )}
                  </div>
                  {post.author.bio && (
                    <p className="text-muted-foreground mb-4">{post.author.bio}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </article>
    </div>
  )
}