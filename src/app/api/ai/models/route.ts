import { NextResponse } from 'next/server'
import { AI_MODELS, DEFAULT_MODEL } from '@/lib/openrouter-models'

export async function GET() {
  return NextResponse.json({
    models: AI_MODELS,
    defaultModel: DEFAULT_MODEL
  })
}