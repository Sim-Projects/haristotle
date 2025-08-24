import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ blockId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const params = await context.params
    const { blockId } = params
    
    // Find the AI component by block ID
    const aiComponent = await prisma.aIComponent.findFirst({
      where: {
        blockId,
        post: {
          authorId: session.user.id
        }
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' }
        }
      }
    })
    
    if (!aiComponent) {
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(aiComponent)
  } catch (error) {
    console.error('API error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}