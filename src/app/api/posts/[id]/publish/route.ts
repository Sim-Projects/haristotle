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
        parentPostId: true,
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

    // Handle different publishing scenarios
    const isAlreadyPublished = existingPost.status === 'PUBLISHED' && !existingPost.parentPostId
    const isDraftOfPublishedPost = existingPost.status === 'DRAFT' && existingPost.parentPostId

    const body = await request.json()
    const validatedData = publishPostSchema.parse({ ...body, id: params.id })

    // Update post content and publish
    const readingTime = calculateReadingTime(validatedData.content)
    const excerpt = validatedData.excerpt || extractExcerpt(validatedData.content)

    const publishedPost = await prisma.$transaction(async (tx) => {
      let post
      // Use the correct post ID (parent post ID if this is a draft of a published post)
      const targetPostId = isDraftOfPublishedPost ? existingPost.parentPostId! : params.id
      
      if (isDraftOfPublishedPost) {
        // This is a draft version of a published post - update the original post
        const parentPostId = existingPost.parentPostId!
        
        post = await tx.post.update({
          where: { id: parentPostId },
          data: {
            title: validatedData.title,
            content: validatedData.content,
            excerpt,
            featuredImage: validatedData.featuredImage,
            readingTime,
            publishedAt: new Date(), // Update published time
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
        
        // Delete the draft version after publishing
        await tx.post.delete({
          where: { id: params.id },
        })
      } else {
        // This is a regular draft post - publish it normally
        post = await tx.post.update({
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
      }

      // Update categories
      if (validatedData.categoryIds.length > 0) {
        // Remove existing categories
        await tx.categoryOnPost.deleteMany({
          where: { postId: targetPostId },
        })
        
        // Add new categories
        await tx.categoryOnPost.createMany({
          data: validatedData.categoryIds.map((categoryId) => ({
            postId: targetPostId,
            categoryId,
          })),
        })
      }

      // Update tags
      if (validatedData.tagIds.length > 0) {
        // Remove existing tags
        await tx.tagOnPost.deleteMany({
          where: { postId: targetPostId },
        })
        
        // Add new tags
        await tx.tagOnPost.createMany({
          data: validatedData.tagIds.map((tagId) => ({
            postId: targetPostId,
            tagId,
          })),
        })
      }

      // Also publish all AI components in this post
      const aiComponents = await tx.aIComponent.findMany({
        where: { postId: targetPostId },
        include: {
          currentDraftVersion: true,
          currentPublishedVersion: true
        }
      })

      for (const aiComponent of aiComponents) {
        if (aiComponent.currentDraftVersion) {
          if (aiComponent.currentPublishedVersion) {
            // Update existing published version with draft content
            await tx.aIComponentVersion.update({
              where: { id: aiComponent.currentPublishedVersion.id },
              data: {
                prompt: aiComponent.currentDraftVersion.prompt,
                generatedCode: aiComponent.currentDraftVersion.generatedCode,
                status: aiComponent.currentDraftVersion.status,
                errorMessage: aiComponent.currentDraftVersion.errorMessage,
              }
            })
          } else {
            // Create new published version based on draft
            const publishedVersion = await tx.aIComponentVersion.create({
              data: {
                componentId: aiComponent.id,
                prompt: aiComponent.currentDraftVersion.prompt,
                generatedCode: aiComponent.currentDraftVersion.generatedCode,
                versionNumber: 1, // Always version 1 for published
                status: aiComponent.currentDraftVersion.status,
                mode: 'PUBLISHED',
                errorMessage: aiComponent.currentDraftVersion.errorMessage,
              }
            })
            
            // Update component to reference the published version
            await tx.aIComponent.update({
              where: { id: aiComponent.id },
              data: { currentPublishedVersionId: publishedVersion.id }
            })
          }
        }
      }

      return { ...post, id: targetPostId }
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