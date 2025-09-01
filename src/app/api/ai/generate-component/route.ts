import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'
import { z } from 'zod'
import { DEFAULT_MODEL, getOpenRouterModel } from '@/lib/openrouter-models'

const generateComponentSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  blockId: z.string().min(1, 'Block ID is required'),
  existingCode: z.string().optional().default(''),
  existingPrompt: z.string().optional().default(''),
  model: z.string().optional().default(DEFAULT_MODEL)
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
    const { prompt, blockId, existingCode, existingPrompt, model } = validatedData
    
    try {
      // Generate the component using AI with existing code as context
      const generatedCode = await generateReactComponent(prompt, existingCode, existingPrompt, model)
      
      return NextResponse.json({
        success: true,
        componentData: {
          generatedCode,
          prompt,
          status: 'completed',
          errorMessage: ''
        }
      })
    } catch (error) {
      console.error('AI generation error:', error)
      
      return NextResponse.json({
        success: false,
        componentData: {
          generatedCode: existingCode,
          prompt,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      }, { status: 500 })
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
  existingCode: string = '',
  existingPrompt: string = '',
  modelName: string = DEFAULT_MODEL
): Promise<string> {
  const systemPrompt = `You are a React component specialist. Create clean, functional React components that follow modern best practices.

## CORE REQUIREMENTS
- Return ONLY the React component code (no explanations, comments, markdown formatting and definitely no mentioning of language like tsx or typescript)
- Component must be a named or default function using TypeScript
- Use Tailwind CSS for all styling
- Ensure responsive design and proper spacing

## AVAILABLE RESOURCES
### React Hooks
useState, useEffect, useCallback, useMemo

### UI Components  
Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Textarea, Alert, AlertDescription, Separator, Switch, Label

### Icons
AlertCircle, CheckCircle, Clock, Heart, Star, Plus, Minus, Eye, EyeOff, Download, Upload, Search, Filter, Settings, User, Mail, Phone, Calendar, MapPin, Globe, Hash, DollarSign

*All imports are pre-loaded - DO NOT include import statements*

## DESIGN GUIDELINES
- Prevent horizontal overflow - components must wrap properly
- Add appropriate margins/padding between elements for good spacing
- Use semantic HTML structure
- Implement proper error boundaries where needed
- Keep components self-contained and reusable

## OUTPUT FORMAT
Return only the component function:

function ComponentName() {
  const [state, setState] = useState(defaultValue)
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4">
        {/* Component content */}
      </CardContent>
    </Card>
  )
}`
  
  const openRouterModel = getOpenRouterModel(modelName)
  
  // Validate OpenRouter API key
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set')
  }
  
  console.log('Using model:', openRouterModel)
  
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  })
  
  // Build conversation history for regenerations
  const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [
    { role: 'system', content: systemPrompt }
  ]
  
  // For regenerations, add the previous conversation context
  if (existingCode && existingPrompt) {
    messages.push({ role: 'user', content: existingPrompt })
    messages.push({ role: 'assistant', content: existingCode })
    messages.push({ role: 'user', content: `Please modify the component: ${prompt}` })
  } else {
    messages.push({ role: 'user', content: prompt })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: openRouterModel,
      messages,
      temperature: 0.7,
    })
    
    const text = completion.choices[0]?.message?.content
    
    if (!text) {
      throw new Error('No response from OpenRouter API')
    }
    
    // Check if response is HTML (error page) instead of expected text
    if (text.startsWith('<!DOCTYPE html') || text.startsWith('<html')) {
      throw new Error('OpenRouter returned HTML error page instead of AI response. Check API key and model availability.')
    }
    
    // Extract code from markdown if present
    const codeMatch = text.match(/```(?:tsx?|javascript)?\n?([\s\S]*?)\n?```/)
    return codeMatch ? codeMatch[1].trim() : text.trim()
  } catch (error) {
    console.error('OpenRouter API error:', error)
    throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}