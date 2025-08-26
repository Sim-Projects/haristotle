import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ componentId: string }>
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
    
    // Get the AI component and verify ownership
    const aiComponent = await prisma.aIComponent.findUnique({
      where: { id: params.componentId },
      include: {
        post: true,
        currentDraftVersion: true,
        currentPublishedVersion: true
      }
    })
    
    if (!aiComponent) {
      return NextResponse.json(
        { error: 'AI component not found' },
        { status: 404 }
      )
    }
    
    if (aiComponent.post.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    if (!aiComponent.currentDraftVersion) {
      return NextResponse.json(
        { error: 'No draft version to publish' },
        { status: 400 }
      )
    }
    
    // Create or update published version
    await prisma.$transaction(async (tx) => {
      if (aiComponent.currentPublishedVersion) {
        // Update existing published version with draft content
        await tx.aIComponentVersion.update({
          where: { id: aiComponent.currentPublishedVersion.id },
          data: {
            prompt: aiComponent.currentDraftVersion!.prompt,
            generatedCode: aiComponent.currentDraftVersion!.generatedCode,
            status: aiComponent.currentDraftVersion!.status,
            errorMessage: aiComponent.currentDraftVersion!.errorMessage,
          }
        })
      } else {
        // Create new published version based on draft
        const publishedVersion = await tx.aIComponentVersion.create({
          data: {
            componentId: aiComponent.id,
            prompt: aiComponent.currentDraftVersion!.prompt,
            generatedCode: aiComponent.currentDraftVersion!.generatedCode,
            versionNumber: (await tx.aIComponentVersion.count({ 
              where: { componentId: aiComponent.id } 
            })) + 1,
            status: aiComponent.currentDraftVersion!.status,
            mode: 'PUBLISHED',
            errorMessage: aiComponent.currentDraftVersion!.errorMessage,
          }
        })
        
        // Update component to reference the published version
        await tx.aIComponent.update({
          where: { id: aiComponent.id },
          data: { currentPublishedVersionId: publishedVersion.id }
        })
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error publishing AI component:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}