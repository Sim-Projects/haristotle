'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
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
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2, 
  Edit,
  AlertTriangle
} from 'lucide-react'

interface PostContentProps {
  postId: string
}

export function PostContent({ postId }: PostContentProps) {
  const [post, setPost] = useState<any>(null)
  const [relatedPosts, setRelatedPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/api/posts/${postId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Post not found')
            return
          }
          throw new Error('Failed to fetch post')
        }

        const postData = await response.json()
        setPost(postData)

        // Fetch related posts
        if (postData.categories?.length > 0) {
          const categoryIds = postData.categories.map((cat: any) => cat.category.id)
          const relatedResponse = await fetch(`/api/posts/related?postId=${postData.id}&categoryIds=${categoryIds.join(',')}`)
          if (relatedResponse.ok) {
            const related = await relatedResponse.json()
            setRelatedPosts(related)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId])

  const handleLike = () => {
    // TODO: Implement like functionality
    console.log('Like clicked')
  }

  const handleComment = () => {
    // TODO: Implement comment functionality
    console.log('Comment clicked')
  }

  const handleBookmark = () => {
    // TODO: Implement bookmark functionality
    console.log('Bookmark clicked')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading article...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Post not found'}</p>
          <button onClick={() => router.back()} className="underline">
            Go back
          </button>
        </div>
      </div>
    )
  }

  const publishedAt = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt)
  const timeAgo = formatDistanceToNow(publishedAt, { addSuffix: true })
  const formattedDate = format(publishedAt, 'MMMM d, yyyy')

  // Check if user can edit this post
  const canEdit = session?.user?.id === post.authorId

  return (
    <>
      {/* Edit Button for Author */}
      {canEdit && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Edit className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800 font-medium">You can edit this post</span>
              </div>
              <a href={`/write/${post.id}`}>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Post
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
      
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
                {post.title}
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
                        <span>{formattedDate}</span>
                      </div>
                      {post.readingTime && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{post.readingTime} min read</span>
                        </div>
                      )}
                      <span>{post.viewCount || 0} views</span>
                    </div>
                  </div>
                </div>
                
                {/* Social Actions */}
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleLike}>
                    <Heart className="h-4 w-4 mr-1" />
                    {post._count?.likes || 0}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleComment}>
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {post._count?.comments || 0}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleBookmark}>
                    <Bookmark className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
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
                viewMode="published"
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg mb-2">No content available</p>
                <p className="text-sm">This post appears to be empty</p>
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
                <Link key={tag.id} href={`/tag/${tag.slug}`}>
                  <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground cursor-pointer">
                    #{tag.name}
                  </Badge>
                </Link>
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
                  <div className="flex items-center space-x-4">
                    {post.author.website && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={post.author.website} target="_blank" rel="noopener noreferrer">
                          Website
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </article>
      
      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <ArticleCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
