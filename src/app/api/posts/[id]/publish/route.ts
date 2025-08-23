import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { publishPostSchema } from '@/lib/validations/post'
import { calculateReadingTime, extractExcerpt } from '@/lib/utils/slug'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(
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
      select: { 
        authorId: true,
        status: true,
        title: true,
        content: true,
      },
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

    if (existingPost.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Post is already published' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = publishPostSchema.parse({ ...body, id: params.id })

    // Update post content and publish
    const readingTime = calculateReadingTime(validatedData.content)
    const excerpt = validatedData.excerpt || extractExcerpt(validatedData.content)

    const publishedPost = await prisma.$transaction(async (tx) => {
      // Update the post
      const post = await tx.post.update({
        where: { id: params.id },
        data: {
          title: validatedData.title,
          content: validatedData.content,
          excerpt,
          featuredImage: validatedData.featuredImage,
          readingTime,
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      })

      // Update categories
      if (validatedData.categoryIds.length > 0) {
        // Remove existing categories
        await tx.categoryOnPost.deleteMany({
          where: { postId: params.id },
        })
        
        // Add new categories
        await tx.categoryOnPost.createMany({
          data: validatedData.categoryIds.map((categoryId) => ({
            postId: params.id,
            categoryId,
          })),
        })
      }

      // Update tags
      if (validatedData.tagIds.length > 0) {
        // Remove existing tags
        await tx.tagOnPost.deleteMany({
          where: { postId: params.id },
        })
        
        // Add new tags
        await tx.tagOnPost.createMany({
          data: validatedData.tagIds.map((tagId) => ({
            postId: params.id,
            tagId,
          })),
        })
      }

      return post
    })

    return NextResponse.json(publishedPost)
  } catch (error) {
    console.error('Error publishing post:', error)
    
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