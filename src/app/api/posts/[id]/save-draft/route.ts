import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
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

    const body = await request.json()
    const { title, content, excerpt, featuredImage } = body

    // Check if post exists and user owns it
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        draftContent: true,
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

    const readingTime = calculateReadingTime(content)
    const finalExcerpt = excerpt || extractExcerpt(content)

    let draftContent
    if (post.draftContent) {
      // Update existing draft
      draftContent = await prisma.draftContent.update({
        where: { postId: params.id },
        data: {
          title,
          content,
          excerpt: finalExcerpt,
          featuredImage,
        },
      })
    } else {
      // Create new draft
      draftContent = await prisma.draftContent.create({
        data: {
          postId: params.id,
          title,
          content,
          excerpt: finalExcerpt,
          featuredImage,
        },
      })
    }

    // Update reading time on main post
    await prisma.post.update({
      where: { id: params.id },
      data: { readingTime },
    })

    return NextResponse.json({
      success: true,
      draftContent,
    })
  } catch (error) {
    console.error('Error saving draft:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}