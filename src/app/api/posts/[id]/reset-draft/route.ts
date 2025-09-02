import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        draftContent: true,
        publishedContent: true,
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

    if (!post.publishedContent) {
      return NextResponse.json(
        { error: 'No published content to reset from' },
        { status: 400 }
      )
    }

    // Reset draft content to match published content
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing draft if any
      if (post.draftContent) {
        await tx.draftContent.delete({
          where: { postId: params.id },
        })
      }

      // Create new draft from published content
      const draftContent = await tx.draftContent.create({
        data: {
          postId: params.id,
          title: post.publishedContent!.title,
          content: post.publishedContent!.content as any,
          excerpt: post.publishedContent!.excerpt,
          featuredImage: post.publishedContent!.featuredImage,
        },
      })

      return draftContent
    })

    return NextResponse.json({
      message: 'Draft reset to published content',
      draftContent: result,
    })
  } catch (error) {
    console.error('Error resetting draft:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}