import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { z } from 'zod'

const generateComponentSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  blockId: z.string().min(1, 'Block ID is required'),
  postId: z.string().cuid('Invalid post ID'),
  componentId: z.string().optional()
})

type GenerateComponentInput = z.infer<typeof generateComponentSchema>

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const validatedData = generateComponentSchema.parse(body)
    
    const { prompt, blockId, postId, componentId } = validatedData
    
    // Verify the user owns the post
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        authorId: session.user.id
      }
    })
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found or access denied' },
        { status: 404 }
      )
    }
    
    // Find or create the AI component record
    let aiComponent = componentId ? 
      await prisma.aIComponent.findUnique({
        where: { id: componentId },
        include: { versions: true }
      }) : 
      await prisma.aIComponent.findUnique({
        where: { blockId },
        include: { versions: true }
      })
    
    if (!aiComponent) {
      aiComponent = await prisma.aIComponent.create({
        data: {
          blockId,
          postId
        },
        include: { versions: true }
      })
    }
    
    // Generate the next version number
    const nextVersionNumber = (aiComponent.versions.length || 0) + 1
    
    // Create a new version in GENERATING state
    const newVersion = await prisma.aIComponentVersion.create({
      data: {
        componentId: aiComponent.id,
        prompt,
        generatedCode: '', // Will be updated after generation
        versionNumber: nextVersionNumber,
        status: 'GENERATING'
      }
    })
    
    try {
      // Generate the component using AI
      const generatedCode = await generateReactComponent(prompt, aiComponent.versions)
      
      // Update the version with the generated code
      const updatedVersion = await prisma.aIComponentVersion.update({
        where: { id: newVersion.id },
        data: {
          generatedCode,
          status: 'COMPLETED'
        }
      })
      
      // Update the AI component's current version
      await prisma.aIComponent.update({
        where: { id: aiComponent.id },
        data: { currentVersionId: updatedVersion.id }
      })
      
      // Fetch the complete component data with all versions
      const componentData = await prisma.aIComponent.findUnique({
        where: { id: aiComponent.id },
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' }
          }
        }
      })
      
      return NextResponse.json({
        success: true,
        componentData
      })
    } catch (error) {
      console.error('AI generation error:', error)
      
      // Update the version with error status
      await prisma.aIComponentVersion.update({
        where: { id: newVersion.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      
      return NextResponse.json(
        { error: 'Failed to generate component' },
        { status: 500 }
      )
    }
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

async function generateReactComponent(
  prompt: string, 
  previousVersions: any[] = []
): Promise<string> {
  // Build context from previous versions
  let context = ''
  if (previousVersions.length > 0) {
    const recentVersions = previousVersions
      .filter(v => v.status === 'COMPLETED')
      .slice(-2) // Last 2 versions for context
    
    if (recentVersions.length > 0) {
      context = `\n\nPrevious iterations:\n${recentVersions
        .map((v, i) => `Version ${v.versionNumber}:\nPrompt: ${v.prompt}\nCode: ${v.generatedCode}`)
        .join('\n\n')}`
    }
  }
  
  const systemPrompt = `You are an expert React developer. Generate a React functional component based on the user's prompt.

IMPORTANT RULES:
1. Return ONLY the React component code, no explanations
2. Use only these allowed imports/components:
   - React hooks: useState, useEffect, useCallback, useMemo
   - UI Components: Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Textarea, Alert, AlertDescription, Separator, Switch, Label
   - Icons: AlertCircle, CheckCircle, Clock, Heart, Star, Plus, Minus, Eye, EyeOff, Download, Upload, Search, Filter, Settings, User, Mail, Phone, Calendar, MapPin, Globe, Hash, DollarSign
   - All components are already imported in the scope
   - Make sure the components don't overflow horizontally and wraps to the next line if needed and add some margin/padding for better spacing

3. The component should be a default function or named function
4. Use TypeScript with proper types
5. Include proper error handling where appropriate
6. Make components responsive and accessible
7. Use Tailwind CSS classes for styling
8. Do NOT include any imports - they are already available
9. Do NOT use any external libraries not listed above
10. Keep components self-contained and functional

Example format:
\`\`\`
function MyComponent() {
  const [count, setCount] = useState(0)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Counter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <Button onClick={() => setCount(count - 1)}>
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold">{count}</span>
          <Button onClick={() => setCount(count + 1)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
\`\`\`${context}`
  
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    prompt: `Create a React component: ${prompt}`,
    temperature: 0.7
  })
  
  // Extract code from markdown if present
  const codeMatch = text.match(/```(?:tsx?|javascript)?\n?([\s\S]*?)\n?```/)
  return codeMatch ? codeMatch[1].trim() : text.trim()
}