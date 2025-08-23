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
      select: { 
        authorId: true, 
        slug: true, 
        status: true,
        title: true,
        content: true,
        excerpt: true,
        featuredImage: true,
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

    const body = await request.json()
    const validatedData = updatePostSchema.parse({ ...body, id: params.id })

    // Handle versioning for published posts
    if (existingPost.status === 'PUBLISHED' && !existingPost.parentPostId) {
      // This is a published post being edited
      // If we're not publishing (just saving), create a draft version
      if (validatedData.status !== 'PUBLISHED') {
        // Create a new draft version linked to the original post
        const updateData: any = {
          title: validatedData.title || existingPost.title,
          content: validatedData.content !== undefined ? validatedData.content : existingPost.content,
          excerpt: validatedData.excerpt !== undefined ? validatedData.excerpt : existingPost.excerpt,
          featuredImage: validatedData.featuredImage !== undefined ? validatedData.featuredImage : existingPost.featuredImage,
          status: 'DRAFT',
          authorId: session.user.id,
          parentPostId: params.id, // Link to the original published post
          slug: existingPost.slug + '-draft-' + Date.now(), // Temporary slug for the draft
        }

        // Calculate reading time and excerpt if content provided
        if (validatedData.content !== undefined) {
          updateData.readingTime = calculateReadingTime(validatedData.content)
          
          if (!validatedData.excerpt) {
            updateData.excerpt = extractExcerpt(validatedData.content)
          }
        }

        // Create the draft version
        const draftPost = await prisma.post.create({
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

        // Copy categories and tags from original if not specified
        if (validatedData.categoryIds === undefined) {
          const originalCategories = await prisma.categoryOnPost.findMany({
            where: { postId: params.id },
          })
          
          if (originalCategories.length > 0) {
            await prisma.categoryOnPost.createMany({
              data: originalCategories.map((cat) => ({
                postId: draftPost.id,
                categoryId: cat.categoryId,
              })),
            })
          }
        }

        if (validatedData.tagIds === undefined) {
          const originalTags = await prisma.tagOnPost.findMany({
            where: { postId: params.id },
          })
          
          if (originalTags.length > 0) {
            await prisma.tagOnPost.createMany({
              data: originalTags.map((tag) => ({
                postId: draftPost.id,
                tagId: tag.tagId,
              })),
            })
          }
        }

        return NextResponse.json({
          ...draftPost,
          message: 'Draft version created. The published post remains unchanged.',
        })
      }
    }

    // Handle publishing a draft version of a published post
    if (validatedData.status === 'PUBLISHED' && existingPost.parentPostId) {
      // This is a draft version being published - update the original post
      const parentPostId = existingPost.parentPostId
      
      const updateData: any = {
        title: validatedData.title || existingPost.title,
        content: validatedData.content !== undefined ? validatedData.content : existingPost.content,
        excerpt: validatedData.excerpt !== undefined ? validatedData.excerpt : existingPost.excerpt,
        featuredImage: validatedData.featuredImage !== undefined ? validatedData.featuredImage : existingPost.featuredImage,
        publishedAt: new Date(),
      }

      // Calculate reading time if content changed
      if (validatedData.content !== undefined) {
        updateData.readingTime = calculateReadingTime(validatedData.content)
        
        if (!validatedData.excerpt) {
          updateData.excerpt = extractExcerpt(validatedData.content)
        }
      }

      // Update the parent (published) post
      const updatedParentPost = await prisma.post.update({
        where: { id: parentPostId },
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

      // Update categories if specified
      if (validatedData.categoryIds !== undefined) {
        await prisma.categoryOnPost.deleteMany({
          where: { postId: parentPostId },
        })
        
        if (validatedData.categoryIds.length > 0) {
          await prisma.categoryOnPost.createMany({
            data: validatedData.categoryIds.map((categoryId) => ({
              postId: parentPostId,
              categoryId,
            })),
          })
        }
      }

      // Update tags if specified
      if (validatedData.tagIds !== undefined) {
        await prisma.tagOnPost.deleteMany({
          where: { postId: parentPostId },
        })
        
        if (validatedData.tagIds.length > 0) {
          await prisma.tagOnPost.createMany({
            data: validatedData.tagIds.map((tagId) => ({
              postId: parentPostId,
              tagId,
            })),
          })
        }
      }

      // Delete the draft version
      await prisma.post.delete({
        where: { id: params.id },
      })

      return NextResponse.json({
        ...updatedParentPost,
        message: 'Changes published successfully. Draft version removed.',
      })
    }

    // Standard update for draft posts or unpublished posts
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