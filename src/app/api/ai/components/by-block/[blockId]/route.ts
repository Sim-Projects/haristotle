import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ blockId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'DRAFT' // Default to DRAFT for editing
    
    const params = await context.params
    const { blockId } = params
    
    // Find the AI component by block ID
    const aiComponent = await prisma.aIComponent.findFirst({
      where: {
        blockId
      },
      include: {
        post: true,
        currentDraftVersion: mode === 'DRAFT',
        currentPublishedVersion: mode === 'PUBLISHED'
      }
    })
    
    if (!aiComponent) {
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      )
    }
    
    // For published mode, allow public access
    // For draft mode, require ownership
    const session = await getServerSession(authOptions)
    if (mode === 'DRAFT' && (!session?.user?.id || aiComponent.post.authorId !== session.user.id)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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