import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { profileCompletionSchema } from '@/lib/validations/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = profileCompletionSchema.parse(body)
    
    const { name, username } = validatedData

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.toLowerCase(),
        NOT: {
          id: session.user.id,
        },
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Username is already taken' },
        { status: 400 }
      )
    }

    // Update the user profile
    const user = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name,
        username: username.toLowerCase(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
      },
    })

    return NextResponse.json(
      { message: 'Profile updated successfully', user },
      { status: 200 }
    )
  } catch (error) {
    console.error('Profile completion error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
}