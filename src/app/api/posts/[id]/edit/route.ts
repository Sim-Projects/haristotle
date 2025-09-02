import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
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

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        draftContent: true,
        publishedContent: true,
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

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // If there's already a draft, return it
    if (post.draftContent) {
      return NextResponse.json({
        ...post,
        editingContent: post.draftContent,
      })
    }

    // If no draft but there's published content, create draft from published
    if (post.publishedContent && !post.draftContent) {
      const draftContent = await prisma.draftContent.create({
        data: {
          postId: post.id,
          title: post.publishedContent.title,
          content: post.publishedContent.content as any,
          excerpt: post.publishedContent.excerpt,
          featuredImage: post.publishedContent.featuredImage,
        },
      })

      return NextResponse.json({
        ...post,
        draftContent,
        editingContent: draftContent,
      })
    }

    // Return the post with whatever content exists
    return NextResponse.json({
      ...post,
      editingContent: post.draftContent || post.publishedContent,
    })
  } catch (error) {
    console.error('Error fetching post for edit:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}