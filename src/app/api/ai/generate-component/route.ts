import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { z } from 'zod'

const generateComponentSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  blockId: z.string().min(1, 'Block ID is required'),
  postId: z.string().cuid('Invalid post ID'),
  componentId: z.string().optional(),
  model: z.string().optional().default('gpt-4.1-mini')
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
    
    const { prompt, blockId, postId, componentId, model } = validatedData
    
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
        include: { 
          currentDraftVersion: true,
          currentPublishedVersion: true 
        }
      }) : 
      await prisma.aIComponent.findUnique({
        where: { blockId },
        include: { 
          currentDraftVersion: true,
          currentPublishedVersion: true 
        }
      })
    
    if (!aiComponent) {
      aiComponent = await prisma.aIComponent.create({
        data: {
          blockId,
          postId
        },
        include: { 
          currentDraftVersion: true,
          currentPublishedVersion: true 
        }
      })
    }
    
    // If there's already a draft version, update it; otherwise create new one
    let newVersion
    if (aiComponent.currentDraftVersion) {
      // Update existing draft version
      newVersion = await prisma.aIComponentVersion.update({
        where: { id: aiComponent.currentDraftVersion.id },
        data: {
          prompt,
          generatedCode: '', // Will be updated after generation
          status: 'GENERATING',
          errorMessage: null
        }
      })
    } else {
      // Create new draft version
      newVersion = await prisma.aIComponentVersion.create({
        data: {
          componentId: aiComponent.id,
          prompt,
          generatedCode: '', // Will be updated after generation
          versionNumber: 1, // Always 1 for draft
          status: 'GENERATING',
          mode: 'DRAFT'
        }
      })
      
      // Update component to reference the new draft version
      await prisma.aIComponent.update({
        where: { id: aiComponent.id },
        data: { currentDraftVersionId: newVersion.id }
      })
    }
    
    try {
      // Generate the component using AI
      const generatedCode = await generateReactComponent(prompt, aiComponent.currentPublishedVersion, model)
      
      // Update the version with the generated code
      const updatedVersion = await prisma.aIComponentVersion.update({
        where: { id: newVersion.id },
        data: {
          generatedCode,
          status: 'COMPLETED'
        }
      })
      
      // Fetch the complete component data
      const componentData = await prisma.aIComponent.findUnique({
        where: { id: aiComponent.id },
        include: {
          currentDraftVersion: true,
          currentPublishedVersion: true
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

// Map user-friendly model names to actual model identifiers
function getModelProvider(modelName: string): { provider: 'openai' | 'anthropic', model: string } {
  const modelMap: { [key: string]: { provider: 'openai' | 'anthropic', model: string } } = {
    'gpt-4.1-mini': { provider: 'openai', model: 'gpt-4o-mini' },
    'gpt-4.1': { provider: 'openai', model: 'gpt-4o' },
    'gpt-5-mini': { provider: 'openai', model: 'gpt-4o-mini' },
    'claude-sonnet-3.7': { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
    'claude-sonnet-4': { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' }
  }
  
  return modelMap[modelName] || { provider: 'openai', model: 'gpt-4o-mini' }
}

async function generateReactComponent(
  prompt: string, 
  publishedVersion: any = null,
  modelName: string = 'gpt-4.1-mini'
): Promise<string> {
  // Build context from published version if available
  let context = ''
  if (publishedVersion && publishedVersion.status === 'COMPLETED') {
    context = `\n\nCurrent published version:\nPrompt: ${publishedVersion.prompt}\nCode: ${publishedVersion.generatedCode}`
  }
  
  const systemPrompt = `You are an expert React developer. Generate a React functional component based on the user's prompt.

IMPORTANT RULES:
1. Return ONLY the React component code
2. Use only these allowed imports/components:
   - React hooks: useState, useEffect, useCallback, useMemo
   - UI Components: Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Textarea, Alert, AlertDescription, Separator, Switch, Label
   - Icons: AlertCircle, CheckCircle, Clock, Heart, Star, Plus, Minus, Eye, EyeOff, Download, Upload, Search, Filter, Settings, User, Mail, Phone, Calendar, MapPin, Globe, Hash, DollarSign
   - All components are already imported in the scope
   - Make sure the components don't overflow horizontally and wraps to the next line if needed
   - add some margin to each component like button, input, label, etc for better spacing

3. The component should be a default function or named function
4. Use TypeScript with proper types
5. Include proper error handling where appropriate
6. Make components responsive and accessible
7. Use Tailwind CSS classes for styling
8. Do NOT include any imports - they are already available
9. Do NOT use any external libraries not listed above
10. Keep components self-contained and functional
11. Important: Do not mention the language or framework in the code

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
  
  const modelConfig = getModelProvider(modelName)
  const model = modelConfig.provider === 'openai' 
    ? openai(modelConfig.model)
    : anthropic(modelConfig.model)
  
  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: `Create a React component: ${prompt}`,
    temperature: 0.7
  })
  
  // Extract code from markdown if present
  const codeMatch = text.match(/```(?:tsx?|javascript)?\n?([\s\S]*?)\n?```/)
  return codeMatch ? codeMatch[1].trim() : text.trim()
}