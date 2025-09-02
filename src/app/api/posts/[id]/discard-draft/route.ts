import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
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
        { error: 'No draft to discard' },
        { status: 400 }
      )
    }

    // Delete the draft content
    await prisma.draftContent.delete({
      where: { postId: params.id },
    })

    // If there's no published content, delete the whole post
    if (!post.publishedContent) {
      await prisma.post.delete({
        where: { id: params.id },
      })
      
      return NextResponse.json({
        message: 'Draft discarded and post deleted',
        deleted: true,
      })
    }

    return NextResponse.json({
      message: 'Draft discarded successfully',
      deleted: false,
    })
  } catch (error) {
    console.error('Error discarding draft:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}