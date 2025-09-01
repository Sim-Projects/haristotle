'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { SafeReactComponentRuntime } from './react-component-runtime'
import { 
  X, 
  Sparkles, 
  AlertCircle, 
  Code,
  Loader2,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

interface AIComponentData {
  generatedCode: string
  prompt: string
  status: 'empty' | 'generating' | 'completed' | 'failed'
  errorMessage: string
}

interface AIComponentPopupProps {
  isOpen: boolean
  onClose: () => void
  currentBlockId: string | null
  currentComponentData: AIComponentData | null
  onApply: (componentData: AIComponentData) => void
}

export function AIComponentPopup({ 
  isOpen, 
  onClose, 
  currentBlockId, 
  currentComponentData, 
  onApply 
}: AIComponentPopupProps) {
  const [prompt, setPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState('gpt-4.1-mini')
  const [availableModels, setAvailableModels] = useState<Array<{value: string, label: string, description: string, icon: string}>>([])  
  const [modelsLoading, setModelsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [newComponentData, setNewComponentData] = useState<AIComponentData | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [currentGeneratingWord, setCurrentGeneratingWord] = useState('cooking')

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setModelsLoading(true)
        const response = await fetch('/api/ai/models')
        if (response.ok) {
          const data = await response.json()
          setAvailableModels(data.models)
          if (!selectedModel || selectedModel === 'gpt-4.1-mini') {
            setSelectedModel(data.defaultModel)
          }
        }
      } catch (error) {
        console.error('Failed to fetch models:', error)
        // Fallback to default model if fetch fails
        if (!selectedModel) {
          setSelectedModel('gpt-4.1-mini')
        }
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
    }, 1500)

    return () => clearInterval(interval)
  }, [isGenerating, generatingWords])

  // Reset state when popup opens
  useEffect(() => {
    if (isOpen) {
      setPrompt(currentComponentData?.prompt || '')
      setNewComponentData(null)
      setShowComparison(false)
      setIsGenerating(false)
    }
  }, [isOpen, currentComponentData])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt for the component')
      return
    }
    
    if (!currentBlockId) {
      toast.error('No block selected')
      return
    }
    
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/ai/generate-component', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          blockId: currentBlockId,
          existingCode: currentComponentData?.generatedCode || '',
          existingPrompt: currentComponentData?.prompt || '',
          model: selectedModel
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to generate component: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.componentData) {
        setNewComponentData(result.componentData)
        // Show comparison if there's existing content
        if (currentComponentData && currentComponentData.status !== 'empty') {
          setShowComparison(true)
        } else {
          // No existing content, can apply directly
          setShowComparison(false)
        }
        toast.success('Component generated successfully!')
      } else {
        toast.error('Invalid response from API')
      }
    } catch (error) {
      const errorData: AIComponentData = {
        generatedCode: currentComponentData?.generatedCode || '',
        prompt: prompt,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Failed to generate component'
      }
      setNewComponentData(errorData)
      toast.error(error instanceof Error ? error.message : 'Failed to generate component')
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, currentBlockId, currentComponentData, selectedModel])

  const handleAccept = useCallback(() => {
    if (newComponentData) {
      onApply(newComponentData)
      onClose()
      toast.success('Component applied successfully!')
    }
  }, [newComponentData, onApply, onClose])

  const handleDecline = useCallback(() => {
    setNewComponentData(null)
    setShowComparison(false)
    toast.info('New component discarded')
  }, [])

  const handleClose = useCallback(() => {
    if (isGenerating) {
      toast.error('Cannot close while generating')
      return
    }
    onClose()
  }, [isGenerating, onClose])

  if (!isOpen) return null

  // Render in a portal to ensure it's not affected by parent containers
  return createPortal(
    <div 
      className="fixed inset-0 z-[3000] flex items-center justify-center"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-7xl h-[90vh] mx-4 bg-white rounded-lg shadow-2xl flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Component Generator</h2>
              <p className="text-sm text-gray-600">Create and modify React components with AI</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleClose}
            className="h-10 w-10 p-0 hover:bg-gray-200"
            disabled={isGenerating}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {!showComparison ? (
            /* Generation View */
            <div className="flex-1 flex">
              {/* Left Panel - Input */}
              <div className="w-1/3 border-r bg-gray-50 p-6 flex flex-col">
                <div className="space-y-6 flex-1">
                  <div>
                    <Label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-2">
                      AI Model
                    </Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isGenerating || modelsLoading}>
                      <SelectTrigger id="model-select">
                        <SelectValue placeholder="Select AI model" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            <div className="flex items-center gap-2">
                              <Image 
                                src={model.icon}
                                alt={model.label}
                                width={16} 
                                height={16} 
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
                    <Label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                      Describe the component you want to create
                    </Label>
                    <Textarea
                      id="prompt"
                      placeholder="Create a card component with a title, description, and a button..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="h-40 resize-none"
                      disabled={isGenerating}
                    />
                  </div>

                  {currentComponentData && currentComponentData.status !== 'empty' && (
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Status
                      </Label>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">
                            {currentComponentData.status === 'completed' ? 'Ready' : 'Draft'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          <strong>Current prompt:</strong> {currentComponentData.prompt}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className={`w-full relative transition-all duration-300 ${
                    isGenerating 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
                      : 'bg-black hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600'
                  }`}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      <span className="font-semibold">
                        {currentGeneratingWord}...
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      {currentComponentData && currentComponentData.status !== 'empty' ? 'Regenerate Component' : 'Generate Component'}
                    </>
                  )}
                </Button>
              </div>
              
              {/* Right Panel - Preview */}
              <div className="flex-1 p-6 flex flex-col">
                <h3 className="text-lg font-semibold mb-4">Preview</h3>
                
                {isGenerating ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <Sparkles className="w-10 h-10 text-white animate-bounce" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                        <span className="animate-pulse text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 font-bold">
                          {currentGeneratingWord}...
                        </span>
                      </h3>
                      <p className="text-gray-600">Creating your AI component</p>
                    </div>
                  </div>
                ) : newComponentData ? (
                  newComponentData.status === 'completed' ? (
                    <div className="flex-1 border border-gray-200 rounded-lg p-6 overflow-auto">
                      <SafeReactComponentRuntime
                        code={newComponentData.generatedCode}
                        onError={(error) => {
                          toast.error(`Preview error: ${error}`)
                        }}
                      />
                    </div>
                  ) : newComponentData.status === 'failed' ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Alert variant="destructive" className="max-w-md">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Generation failed: {newComponentData.errorMessage}
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : null
                ) : currentComponentData && currentComponentData.status === 'completed' ? (
                  <div className="flex-1 border border-gray-200 rounded-lg p-6 overflow-auto">
                    <div className="mb-4 text-sm text-gray-600 font-medium">Current Component:</div>
                    <SafeReactComponentRuntime
                      code={currentComponentData.generatedCode}
                      onError={(error) => {
                        toast.error(`Preview error: ${error}`)
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center">
                    <div>
                      <Code className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No component yet</p>
                      <p className="text-sm text-gray-400">Generate a component to see the preview</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons - Generation View */}
                {newComponentData && newComponentData.status === 'completed' && !showComparison && (
                  <div className="mt-6 pt-4 border-t">
                    <Button
                      onClick={handleAccept}
                      className="w-full"
                      size="lg"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      Apply Component
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Comparison View */
            <div className="flex-1 flex flex-col">
              {/* Comparison Header */}
              <div className="p-6 border-b bg-amber-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900">Review Changes</h3>
                    <p className="text-sm text-amber-700">
                      Compare the new component with your existing one. 
                      <strong className="ml-1">Accepting will replace the current component permanently.</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Side by Side Comparison */}
              <div className="flex-1 flex overflow-hidden">
                {/* Current Component */}
                <div className="flex-1 border-r flex flex-col">
                  <div className="p-4 bg-red-50 border-b">
                    <h4 className="font-medium text-red-900 flex items-center">
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Current Component (will be lost)
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                      Prompt: {currentComponentData?.prompt}
                    </p>
                  </div>
                  <div className="flex-1 p-6 overflow-auto">
                    {currentComponentData && currentComponentData.status === 'completed' ? (
                      <SafeReactComponentRuntime
                        code={currentComponentData.generatedCode}
                        onError={(error) => {
                          console.error(`Current component error: ${error}`)
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No current component</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* New Component */}
                <div className="flex-1 flex flex-col">
                  <div className="p-4 bg-green-50 border-b">
                    <h4 className="font-medium text-green-900 flex items-center">
                      <ChevronRight className="h-4 w-4 mr-2" />
                      New Component (will be applied)
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      Prompt: {newComponentData?.prompt}
                    </p>
                  </div>
                  <div className="flex-1 p-6 overflow-auto">
                    {newComponentData && newComponentData.status === 'completed' ? (
                      <SafeReactComponentRuntime
                        code={newComponentData.generatedCode}
                        onError={(error) => {
                          console.error(`New component error: ${error}`)
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No new component</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons - Comparison View */}
              <div className="p-6 bg-gray-50 border-t flex space-x-4">
                <Button
                  onClick={handleDecline}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <X className="h-5 w-5 mr-2" />
                  Keep Current & Discard New
                </Button>
                <Button
                  onClick={handleAccept}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Apply New & Replace Current
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}