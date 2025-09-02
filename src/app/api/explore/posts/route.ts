import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const searchQuery = url.searchParams.get('q')
    const sortBy = url.searchParams.get('sort') || 'recent'
    const categorySlug = url.searchParams.get('category')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      status: 'PUBLISHED',
      publishedAt: {
        not: null,
      },
    }

    // Add search filter
    if (searchQuery) {
      where.OR = [
        {
          title: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          excerpt: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          author: {
            name: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
        },
      ]
    }

    // Add category filter
    if (categorySlug) {
      where.categories = {
        some: {
          category: {
            slug: categorySlug,
          },
        },
      }
    }

    // Build orderBy clause
    let orderBy: any = {}
    switch (sortBy) {
      case 'popular':
        orderBy = { viewCount: 'desc' }
        break
      case 'trending':
        orderBy = { likesCount: 'desc' }
        break
      case 'oldest':
        orderBy = { publishedAt: 'asc' }
        break
      default: // recent
        orderBy = { publishedAt: 'desc' }
    }

    // Fetch posts and total count
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        select: {
          id: true,
          publishedContent: {
            select: {
              title: true,
              excerpt: true,
              featuredImage: true,
            },
          },
          publishedAt: true,
          createdAt: true,
          readingTime: true,
          viewCount: true,
          likesCount: true,
          commentsCount: true,
          _count: {
            select: {
              likes: true,
              comments: true,
              bookmarks: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  color: true,
                },
              },
            },
          },
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
            take: 3, // Limit tags for performance
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.post.count({ where }),
    ])

    // Transform posts to include content fields for backward compatibility
    const transformedPosts = posts.map(post => ({
      ...post,
      title: post.publishedContent?.title || 'Untitled',
      excerpt: post.publishedContent?.excerpt || null,
      featuredImage: post.publishedContent?.featuredImage || null,
    }))

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching explore posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}