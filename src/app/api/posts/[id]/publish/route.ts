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

    // Check if post exists and user owns it
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

    if (!post.draftContent) {
      return NextResponse.json(
        { error: 'No draft content to publish' },
        { status: 400 }
      )
    }

    // Publish the draft content
    const result = await prisma.$transaction(async (tx) => {
      // Create or update published content
      if (post.publishedContent) {
        // Update existing published content
        await tx.publishedContent.update({
          where: { postId: params.id },
          data: {
            title: post.draftContent!.title,
            content: post.draftContent!.content as any,
            excerpt: post.draftContent!.excerpt,
            featuredImage: post.draftContent!.featuredImage,
            publishedAt: new Date(),
          },
        })
      } else {
        // Create new published content
        await tx.publishedContent.create({
          data: {
            postId: params.id,
            title: post.draftContent!.title,
            content: post.draftContent!.content as any,
            excerpt: post.draftContent!.excerpt,
            featuredImage: post.draftContent!.featuredImage,
          },
        })
      }

      // Delete the draft content
      await tx.draftContent.delete({
        where: { postId: params.id },
      })

      // Update post status and publishedAt
      const updatedPost = await tx.post.update({
        where: { id: params.id },
        data: {
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
          publishedContent: true,
        },
      })

      return updatedPost
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error publishing post:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}