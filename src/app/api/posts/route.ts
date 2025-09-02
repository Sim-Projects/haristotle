import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createPostSchema } from '@/lib/validations/post'
import { calculateReadingTime, extractExcerpt } from '@/lib/utils/slug'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const authorId = searchParams.get('authorId')
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status) where.status = status
    if (authorId) where.authorId = authorId
    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category
          }
        }
      }
    }
    if (tag) {
      where.tags = {
        some: {
          tag: {
            slug: tag
          }
        }
      }
    }
    if (search) {
      where.OR = [
        { 
          publishedContent: {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { excerpt: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        { 
          draftContent: {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { excerpt: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ]
    }

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              bio: true,
            },
          },
          draftContent: true,
          publishedContent: true,
          categories: {
            include: {
              category: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              bookmarks: true,
            },
          },
        },
        orderBy: [
          { status: 'desc' }, // Published first
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.post.count({ where })
    ])

    // Transform posts to include content fields for backward compatibility
    const transformedPosts = posts.map(post => {
      const content = post.publishedContent || post.draftContent
      return {
        ...post,
        title: content?.title || 'Untitled',
        excerpt: content?.excerpt || null,
        featuredImage: content?.featuredImage || null,
        content: content?.content || '',
      }
    })

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: skip + limit < totalCount,
        hasPrevPage: page > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createPostSchema.parse(body)


    // Calculate reading time and extract excerpt
    const readingTime = calculateReadingTime(validatedData.content)
    const excerpt = validatedData.excerpt || extractExcerpt(validatedData.content)

    // Ensure user exists in database
    const author = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!author) {
      console.error('User not found in database:', session.user.id)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create the post with draft content using transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the main post record
      const post = await tx.post.create({
        data: {
          status: 'DRAFT', // Always start as draft
          readingTime,
          authorId: session.user.id,
        },
      })

      // Create draft content
      await tx.draftContent.create({
        data: {
          postId: post.id,
          title: validatedData.title,
          content: validatedData.content,
          excerpt,
          featuredImage: validatedData.featuredImage,
        },
      })

      return post
    })

    const post = result

    // Handle categories and tags if provided
    if (validatedData.categoryIds.length > 0) {
      await prisma.categoryOnPost.createMany({
        data: validatedData.categoryIds.map((categoryId) => ({
          postId: post.id,
          categoryId,
        })),
      })
    }

    if (validatedData.tagIds.length > 0) {
      await prisma.tagOnPost.createMany({
        data: validatedData.tagIds.map((tagId) => ({
          postId: post.id,
          tagId,
        })),
      })
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}