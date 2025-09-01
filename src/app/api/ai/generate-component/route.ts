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
  // Build context from existing code if available
  let context = ''
  if (existingCode && existingPrompt) {
    context = `\n\nExisting component:\nPrompt: ${existingPrompt}\nCode: ${existingCode}\n\nPlease modify or enhance this component based on the new prompt.`
  } else if (existingCode) {
    context = `\n\nExisting component code:\n${existingCode}\n\nPlease modify or enhance this component based on the new prompt.`
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
6. Make sure the components wrap properly and do not overflow
7. Use Tailwind CSS classes for styling
8. Do NOT include any imports - they are already available
9. Do NOT use any external libraries not listed above
10. Keep components self-contained and functional
11. Important: Do not mention the language in the code like tsx or typescript

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
  
  try {
    const completion = await openai.chat.completions.create({
      model: openRouterModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a React component: ${prompt}` }
      ],
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