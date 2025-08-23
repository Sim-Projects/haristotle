import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  location: z.string().max(30, 'Location must be less than 30 characters').optional(),
  twitter: z.string().max(15, 'Twitter handle must be less than 15 characters').optional(),
  linkedin: z.string().max(30, 'LinkedIn username must be less than 30 characters').optional(),
  github: z.string().max(39, 'GitHub username must be less than 39 characters').optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        website: true,
        twitter: true,
        linkedin: true,
        github: true,
        location: true,
        image: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            posts: {
              where: {
                status: 'PUBLISHED'
              }
            },
            followers: true,
            following: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Check if username is already taken by another user
    if (validatedData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          id: {
            not: session.user.id,
          },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        )
      }
    }

    // Clean up social media handles (remove @ if present)
    const cleanData = {
      ...validatedData,
      twitter: validatedData.twitter?.replace(/^@/, '') || null,
      website: validatedData.website || null,
      bio: validatedData.bio || null,
      location: validatedData.location || null,
      linkedin: validatedData.linkedin || null,
      github: validatedData.github || null,
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: cleanData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        website: true,
        twitter: true,
        linkedin: true,
        github: true,
        location: true,
        image: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            posts: {
              where: {
                status: 'PUBLISHED'
              }
            },
            followers: true,
            following: true,
          },
        },
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}