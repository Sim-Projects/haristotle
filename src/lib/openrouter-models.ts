export interface AIModel {
  value: string
  label: string
  description: string
  icon: string
  openRouterModel: string
}

export const AI_MODELS: AIModel[] = [
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', description: 'Cost-effective', icon: '/static/images/openai-icon.svg', openRouterModel: 'openai/gpt-4.1-mini' },
  { value: 'gpt-4.1', label: 'GPT-4.1', description: 'Advanced multimodal model', icon: '/static/images/openai-icon.svg', openRouterModel: 'openai/gpt-4.1' },
  { value: 'gpt-4o', label: 'GPT-4o', description: 'Optimized for chat and coding', icon: '/static/images/openai-icon.svg', openRouterModel: 'openai/gpt-4o' },
  { value: 'claude-3.7-sonnet', label: 'Claude 3.7 Sonnet', description: 'Improved reasoning and coding', icon: '/static/images/claude-ai-icon.svg', openRouterModel: 'anthropic/claude-3.7-sonnet' },
  { value: 'claude-4-sonnet', label: 'Claude 4 Sonnet', description: 'Latest Claude', icon: '/static/images/claude-ai-icon.svg', openRouterModel: 'anthropic/claude-sonnet-4' },
  { value: 'grok-3', label: 'Grok 3', description: 'Conversational with wit and personality', icon: '/static/images/grok.svg', openRouterModel: 'x-ai/grok-3' },
  { value: 'grok-4', label: 'Grok 4', description: 'Latest Grok with enhanced reasoning', icon: '/static/images/grok.svg', openRouterModel: 'x-ai/grok-4' }
]

export const DEFAULT_MODEL = 'gpt-4.1-mini'

// Get OpenRouter model identifier from AI_MODELS list
export function getOpenRouterModel(modelName: string): string {
  const model = AI_MODELS.find(m => m.value === modelName)
  return model?.openRouterModel || AI_MODELS[0].openRouterModel
}