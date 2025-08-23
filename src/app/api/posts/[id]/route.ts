import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updatePostSchema } from '@/lib/validations/post'
import { generateUniqueSlug, calculateReadingTime, extractExcerpt } from '@/lib/utils/slug'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
            isVerified: true,
          },
        },
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
            views: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if post exists and user owns it
    const existingPost = await prisma.post.findUnique({
      where: { id: params.id },
      select: { authorId: true, slug: true },
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (existingPost.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updatePostSchema.parse({ ...body, id: params.id })

    const updateData: any = {}

    // Update title and slug if title changed
    if (validatedData.title) {
      updateData.title = validatedData.title
      
      // Only update slug if title changed significantly
      const baseSlug = validatedData.title
      if (baseSlug !== existingPost.slug) {
        updateData.slug = await generateUniqueSlug(
          baseSlug,
          async (slug: string) => {
            const existing = await prisma.post.findFirst({
              where: { 
                slug,
                NOT: { id: params.id }
              },
            })
            return !!existing
          }
        )
      }
    }

    // Update content and related fields
    if (validatedData.content !== undefined) {
      updateData.content = validatedData.content
      updateData.readingTime = calculateReadingTime(validatedData.content)
      
      if (!validatedData.excerpt) {
        updateData.excerpt = extractExcerpt(validatedData.content)
      }
    }

    if (validatedData.excerpt !== undefined) {
      updateData.excerpt = validatedData.excerpt
    }

    if (validatedData.featuredImage !== undefined) {
      updateData.featuredImage = validatedData.featuredImage
    }

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
      
      // Set publishedAt when publishing
      if (validatedData.status === 'PUBLISHED') {
        updateData.publishedAt = new Date()
      }
    }

    // Update the post
    const post = await prisma.post.update({
      where: { id: params.id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
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
      },
    })

    // Handle category updates
    if (validatedData.categoryIds !== undefined) {
      // Remove existing categories
      await prisma.categoryOnPost.deleteMany({
        where: { postId: params.id },
      })
      
      // Add new categories
      if (validatedData.categoryIds.length > 0) {
        await prisma.categoryOnPost.createMany({
          data: validatedData.categoryIds.map((categoryId) => ({
            postId: params.id,
            categoryId,
          })),
        })
      }
    }

    // Handle tag updates
    if (validatedData.tagIds !== undefined) {
      // Remove existing tags
      await prisma.tagOnPost.deleteMany({
        where: { postId: params.id },
      })
      
      // Add new tags
      if (validatedData.tagIds.length > 0) {
        await prisma.tagOnPost.createMany({
          data: validatedData.tagIds.map((tagId) => ({
            postId: params.id,
            tagId,
          })),
        })
      }
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating post:', error)
    
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

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if post exists and user owns it
    const existingPost = await prisma.post.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (existingPost.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await prisma.post.delete({
      where: { id: params.id },
    })

    return NextResponse.json(
      { message: 'Post deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}