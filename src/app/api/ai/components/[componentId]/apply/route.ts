import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const applyComponentSchema = z.object({
  versionId: z.string().cuid('Invalid version ID')
})

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ componentId: string }> }
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
    const { componentId } = params
    const body = await request.json()
    const { versionId } = applyComponentSchema.parse(body)
    
    // Verify the component belongs to a post owned by the user
    const aiComponent = await prisma.aIComponent.findFirst({
      where: {
        id: componentId,
        post: {
          authorId: session.user.id
        }
      },
      include: {
        versions: true
      }
    })
    
    if (!aiComponent) {
      return NextResponse.json(
        { error: 'Component not found or access denied' },
        { status: 404 }
      )
    }
    
    // Verify the version exists and belongs to this component
    const version = aiComponent.versions.find(v => v.id === versionId)
    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }
    
    if (version.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot apply incomplete version' },
        { status: 400 }
      )
    }
    
    // Update the current version
    const updatedComponent = await prisma.aIComponent.update({
      where: { id: componentId },
      data: { currentVersionId: versionId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      componentData: updatedComponent
    })
  } catch (error) {
    console.error('API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}