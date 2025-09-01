import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { Clock, MessageCircle, Heart, Bookmark } from 'lucide-react'

interface ArticleCardProps {
  post: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    featuredImage: string | null
    readingTime: number | null
    createdAt: Date | string
    author: {
      id: string
      name: string | null
      username: string | null
      image: string | null
    }
    categories: {
      category: {
        id: string
        name: string
        slug: string
        color: string | null
      }
    }[]
    _count: {
      likes: number
      comments: number
      bookmarks: number
    }
  }
  variant?: 'default' | 'featured' | 'compact'
}

export function ArticleCard({ post, variant = 'default' }: ArticleCardProps) {
  const createdAt = typeof post.createdAt === 'string' ? new Date(post.createdAt) : post.createdAt
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true })

  if (variant === 'featured') {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative aspect-[16/10] lg:aspect-auto">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          {/* Content */}
          <div className="p-4 flex flex-col justify-between">
            <div>
              {/* Categories */}
              {post.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.categories.slice(0, 2).map(({ category }) => (
                    <Badge
                      key={category.id}
                      variant="secondary"
                      style={{ backgroundColor: category.color || undefined }}
                      className="text-xs"
                    >
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Title */}
              <a href={`/post/${post.id}`}>
                <h2 className="text-2xl font-bold mb-3 line-clamp-2 hover:text-primary cursor-pointer">
                  {post.title}
                </h2>
              </a>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
              )}
            </div>

            {/* Author and Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={post.author.image || ''} alt={post.author.name || ''} />
                  <AvatarFallback>
                    {post.author.name?.charAt(0)?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">{post.author.name}</p>
                  <p className="text-muted-foreground">{timeAgo}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                {post.readingTime && (
                  <div className="flex items-center space-x-1 whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    <span>{post.readingTime}m</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Heart className="h-3 w-3" />
                  <span>{post._count.likes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>{post._count.comments}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex space-x-4">
            {post.featuredImage && (
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <Link href={`/post/${post.id}`}>
                <h3 className="font-semibold line-clamp-2 hover:text-primary cursor-pointer mb-1">
                  {post.title}
                </h3>
              </Link>
              
              {post.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {post.excerpt}
                </p>
              )}
              
              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                <span>{post.author.name}</span>
                <span>•</span>
                <span>{timeAgo}</span>
                {post.readingTime && (
                  <>
                    <span>•</span>
                    <span className="whitespace-nowrap">{post.readingTime}m</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <a href={`/post/${post.id}`} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="relative aspect-[16/10]">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        
        <div className="p-3">
          {/* Title */}
          <h3 className="text-base font-semibold line-clamp-2 hover:text-primary mb-2">
            {post.title}
          </h3>

          {/* Author */}
          <div className="flex items-center space-x-2 mb-2">
            <Avatar className="h-4 w-4">
              <AvatarImage src={post.author.image || ''} alt={post.author.name || ''} />
              <AvatarFallback className="text-xs">
                {post.author.name?.charAt(0)?.toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">{post.author.name}</span>
          </div>

          {/* Meta Info */}
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>{timeAgo}</span>
            {post.readingTime && (
              <>
                <span>•</span>
                <span className="whitespace-nowrap">{post.readingTime}m</span>
              </>
            )}
            <span>•</span>
            <span>{post._count.likes} ♡</span>
            {post.categories.length > 0 && (
              <>
                <span>•</span>
                <span className="text-xs">{post.categories[0].category.name}</span>
              </>
            )}
          </div>
        </div>
      </Card>
    </a>
  )
}