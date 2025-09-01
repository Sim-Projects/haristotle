'use client'

import React, { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useAISidebar } from '@/hooks/use-ai-sidebar'
import { SafeReactComponentRuntime } from './react-component-runtime'
import { 
  X, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Code,
  Eye,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'

interface AIComponentSidebarProps {
  postId: string
}

export function AIComponentSidebar({ postId }: AIComponentSidebarProps) {
  const {
    isOpen,
    isGenerating,
    currentBlockId,
    currentPrompt,
    componentData,
    closeSidebar,
    setPrompt,
    setGenerating,
    setComponentData
  } = useAISidebar()
  
  const [activeTab, setActiveTab] = useState<'prompt' | 'preview'>('prompt')
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4.1-mini')
  const [availableModels, setAvailableModels] = useState<Array<{value: string, label: string, description: string, icon: string}>>([])  
  const [modelsLoading, setModelsLoading] = useState(true)
  const [currentGeneratingWord, setCurrentGeneratingWord] = useState<string>('cooking')

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setModelsLoading(true)
        const response = await fetch('/api/ai/models')
        if (response.ok) {
          const data = await response.json()
          setAvailableModels(data.models)
          setSelectedModel(data.defaultModel)
        }
      } catch (error) {
        console.error('Failed to fetch models:', error)
        // Fallback to default model if fetch fails
        setSelectedModel('gpt-4.1-mini')
      } finally {
        setModelsLoading(false)
      }
    }
    fetchModels()
  }, [])

  const generatingWords = [
    'cooking', 'storyboarding', 'diving', 'crafting', 'brewing', 'sculpting',
    'weaving', 'painting', 'composing', 'designing', 'building', 'creating',
    'forging', 'molding', 'dreaming', 'imagining', 'conjuring', 'spinning',
    'orchestrating', 'architecting', 'inventing', 'sketching', 'mapping', 'drafting',
    'plotting', 'animating', 'envisioning', 'modeling', 'rendering', 'simulating',
    'refining', 'exploring', 'generating', 'synthesizing', 'curating', 'editing',
    'shaping', 'assembling', 'programming', 'coding', 'prototyping', 'testing',
    'debugging', 'optimizing', 'refactoring', 'enriching', 'expanding',
    'reimagining', 'revising', 'reworking', 'rebuilding', 'reconstructing',
    'gigglecoding', 'snackifying', 'quackitecting', 'bananifying', 'jellyfying',
    'wobblifying', 'doodling', 'snoozling', 'bamboozling', 'whimsifying', 'fluffing',
    'zombifying', 'splatting', 'blorpifying', 'squigglizing', 'memeifying', 'derping',
    'honkifying', 'booping', 'glitching', 'froggling', 'sporking', 'noodling'
  ]

  // Cycle through generating words when isGenerating is true
  useEffect(() => {
    if (!isGenerating) return

    const interval = setInterval(() => {
      setCurrentGeneratingWord(prev => {
        const currentIndex = generatingWords.indexOf(prev)
        const nextIndex = (currentIndex + 1) % generatingWords.length
        return generatingWords[nextIndex]
      })
    }, 1500) // Change word every 800ms

    return () => clearInterval(interval)
  }, [isGenerating, generatingWords])
  
  
  const handleGenerateComponent = useCallback(async () => {
    if (!currentPrompt.trim()) {
      toast.error('Please enter a prompt for the component')
      return
    }
    
    if (!currentBlockId) {
      toast.error('No block selected')
      return
    }
    
    setGenerating(true)
    
    // Set generating status
    const generatingData = {
      generatedCode: componentData?.generatedCode || '',
      prompt: currentPrompt,
      status: 'generating' as const,
      errorMessage: ''
    }
    setComponentData(generatingData)
    
    // Dispatch event to update block immediately with generating status
    const generatingEvent = new CustomEvent('ai-component-applied', {
      detail: {
        blockId: currentBlockId,
        componentData: generatingData
      }
    })
    window.dispatchEvent(generatingEvent)
    
    try {
      const response = await fetch('/api/ai/generate-component', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          blockId: currentBlockId,
          existingCode: componentData?.generatedCode || '',
          existingPrompt: componentData?.prompt || '',
          model: selectedModel
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to generate component: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      // Update component data with new version
      if (result.componentData) {
        // Check if this is the first generation BEFORE updating state
        const isFirstGeneration = !componentData?.generatedCode || componentData.status === 'empty'
        
        setComponentData(result.componentData)
        setActiveTab('preview')
        
        // Auto-apply if this is the first generation (no existing code)
        if (isFirstGeneration && result.componentData.status === 'completed') {
          // Auto-apply the component
          const event = new CustomEvent('ai-component-applied', {
            detail: {
              blockId: currentBlockId,
              componentData: result.componentData
            }
          })
          window.dispatchEvent(event)
          toast.success('Component generated and applied automatically!')
        } else {
          toast.success('Component generated successfully!')
        }
      }
    } catch (error) {
      console.error('Error generating component:', error)
      const errorData = {
        generatedCode: componentData?.generatedCode || '',
        prompt: currentPrompt,
        status: 'failed' as const,
        errorMessage: error instanceof Error ? error.message : 'Failed to generate component'
      }
      setComponentData(errorData)
      toast.error(error instanceof Error ? error.message : 'Failed to generate component')
    } finally {
      setGenerating(false)
    }
  }, [currentPrompt, currentBlockId, componentData, selectedModel, setGenerating, setComponentData])
  
  const handleApplyComponent = useCallback(async () => {
    if (!componentData || !currentBlockId) {
      toast.error('No component to apply')
      return
    }
    
    if (componentData.status !== 'completed') {
      toast.error('Component is not ready to apply')
      return
    }
    
    try {
      // Trigger update in the editor (this will be handled by the block component)
      const event = new CustomEvent('ai-component-applied', {
        detail: {
          blockId: currentBlockId,
          componentData: componentData
        }
      })
      window.dispatchEvent(event)
      
      toast.success('Component applied to editor!')
    } catch (error) {
      console.error('Error applying component:', error)
      toast.error('Failed to apply component')
    }
  }, [componentData, currentBlockId, closeSidebar])
  
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-y-0 right-0 w-1/2 bg-white border-l shadow-lg flex flex-col z-50 h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h2 className="font-semibold text-gray-900">AI Component Generator</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={closeSidebar}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b bg-gray-50">
        {[
          { id: 'prompt', label: 'Prompt', icon: Sparkles },
          { id: 'preview', label: 'Preview', icon: Eye }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden h-full">
        {activeTab === 'prompt' && (
          <ScrollArea className="flex-1 h-full">
            <div className="p-4 h-full flex flex-col">
              <div className="space-y-4 flex-1">
              <div>
                <Label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-2">
                  AI Model
                </Label>
                <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isGenerating || modelsLoading}>
                  <SelectTrigger id="model-select">
                    <div className="flex items-center gap-2">
                      <SelectValue placeholder="Select AI model" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex items-center gap-2">
                          <Image 
                            src={model.icon}
                            alt={model.label}
                            width={14} 
                            height={14} 
                            className="flex-shrink-0"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{model.label}</span>
                            <span className="text-xs text-gray-500">{model.description}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the component you want to create
                </label>
                <Textarea
                  id="prompt"
                  placeholder="Create a card component with a title, description, and a button..."
                  value={currentPrompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="h-32 resize-none"
                  disabled={isGenerating}
                />
              </div>
              
              {componentData && componentData.status !== 'empty' && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Status: {componentData.status}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {componentData.status === 'completed' ? 'Ready' : 'In Progress'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleGenerateComponent}
                disabled={isGenerating || !currentPrompt.trim()}
                className={`w-full relative transition-all duration-300 ${
                  isGenerating 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
                    : 'bg-black hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600'
                } ${
                  !isGenerating && !currentPrompt.trim() ? 'opacity-50' : ''
                }`}
                style={{
                  boxShadow: isGenerating ? '0 0 20px rgba(59,130,246,0.8)' : '',
                }}
              >
                <div className={`absolute inset-0 rounded-md ${!isGenerating ? 'animate-border-glow' : ''}`} 
                     style={{
                       background: !isGenerating ? 'linear-gradient(45deg, #ff0000, #00ff00, #0000ff, #ff0000)' : 'none',
                       backgroundSize: '400% 400%',
                       zIndex: -1,
                       margin: '-2px',
                       opacity: !isGenerating && currentPrompt.trim() ? 1 : 0,
                     }}
                />
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="font-semibold">
                      {currentGeneratingWord}...
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {componentData && componentData.status !== 'empty' ? 'Regenerate' : 'Generate Component'}
                  </>
                )}
              </Button>
              
              {componentData && componentData.status === 'completed' && (
                <Button
                  onClick={handleApplyComponent}
                  variant="outline"
                  className="w-full"
                  disabled={isGenerating}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Apply to Editor
                </Button>
              )}
              </div>
            </div>
          </ScrollArea>
        )}
        
        {activeTab === 'preview' && (
          <ScrollArea className="flex-1 h-full">
            <div className="p-4 h-full">
            {componentData && componentData.status !== 'empty' ? (
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Component Preview</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {componentData.status}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      componentData.status === 'completed' ? 'default' :
                      componentData.status === 'generating' ? 'secondary' : 'destructive'
                    }
                  >
                    {componentData.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {componentData.status === 'generating' && <Clock className="h-3 w-3 mr-1" />}
                    {componentData.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                    {componentData.status}
                  </Badge>
                </div>
                
                {componentData.prompt && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Prompt</h4>
                    <div className="text-sm text-gray-600 bg-gray-50 rounded p-2 border">
                      {componentData.prompt}
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex-1 flex flex-col min-h-0">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                  {componentData.status === 'completed' ? (
                    <ScrollArea className="flex-1 h-full">
                      <div className="p-4">
                        <SafeReactComponentRuntime
                          code={componentData.generatedCode}
                          className="min-h-full"
                          onError={(error) => {
                            toast.error(`Preview error: ${error}`)
                          }}
                        />
                      </div>
                    </ScrollArea>
                  ) : componentData.status === 'generating' ? (
                    <div className="flex-1 flex items-center justify-center border rounded-lg bg-gray-50">
                      <div className="text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">
                          <span className="animate-pulse text-white font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-[0_0_20px_rgba(59,130,246,0.8)] border border-blue-300 transition-all duration-300">
                            {currentGeneratingWord}...
                          </span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <Alert variant="destructive" className="max-w-sm">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Generation failed: {componentData.errorMessage}
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
                
                {componentData.status === 'completed' && (
                  <Button
                    onClick={handleApplyComponent}
                    className="w-full"
                    disabled={isGenerating}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Apply to Editor
                  </Button>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <Code className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No component generated yet</p>
                  <p className="text-sm text-gray-400">Generate a component to see the preview</p>
                </div>
              </div>
            )}
            </div>
          </ScrollArea>
        )}
        
      </div>
    </div>
  )
}