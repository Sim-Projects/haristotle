'use client'

import React, { useState, useCallback, useEffect } from 'react'
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
  History,
  RotateCcw,
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
  
  const [activeTab, setActiveTab] = useState<'prompt' | 'preview' | 'history'>('prompt')
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4.1-mini')
  const [currentGeneratingWord, setCurrentGeneratingWord] = useState<string>('cooking')

  const availableModels = [
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', description: 'Fast and efficient' },
    { value: 'gpt-4.1', label: 'GPT-4.1', description: 'Balanced performance' },
    { value: 'gpt-5-mini', label: 'GPT-5 Mini', description: 'Latest mini model' }
  ]

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
    }, 800) // Change word every 800ms

    return () => clearInterval(interval)
  }, [isGenerating, generatingWords])
  
  // Get the currently selected version for preview
  const selectedVersion = React.useMemo(() => {
    if (!componentData?.versions) return null
    
    if (selectedVersionId) {
      return componentData.versions.find(v => v.id === selectedVersionId) || null
    }
    
    // Default to current version or latest
    const currentVersion = componentData.versions.find(v => v.id === componentData.currentVersionId)
    return currentVersion || componentData.versions[componentData.versions.length - 1] || null
  }, [componentData, selectedVersionId])
  
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
    
    try {
      const response = await fetch('/api/ai/generate-component', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          blockId: currentBlockId,
          postId: postId,
          componentId: componentData?.id,
          model: selectedModel
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to generate component: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      // Update component data with new version
      if (result.componentData) {
        setComponentData(result.componentData)
        // Auto-switch to latest version
        const latestVersion = result.componentData.versions[result.componentData.versions.length - 1]
        if (latestVersion) {
          setSelectedVersionId(latestVersion.id)
        }
        setActiveTab('preview')
        toast.success('Component generated successfully!')
      }
    } catch (error) {
      console.error('Error generating component:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate component')
    } finally {
      setGenerating(false)
    }
  }, [currentPrompt, currentBlockId, postId, componentData, setGenerating, setComponentData])
  
  const handleApplyComponent = useCallback(async () => {
    if (!selectedVersion || !currentBlockId) {
      toast.error('No component version selected')
      return
    }
    
    try {
      // Update the current version in the database
      const response = await fetch(`/api/ai/components/${componentData?.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          versionId: selectedVersion.id,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to apply component')
      }
      
      // Trigger update in the editor (this will be handled by the block component)
      const event = new CustomEvent('ai-component-applied', {
        detail: {
          blockId: currentBlockId,
          version: selectedVersion
        }
      })
      window.dispatchEvent(event)
      
      toast.success('Component applied to editor!')
      closeSidebar()
    } catch (error) {
      console.error('Error applying component:', error)
      toast.error('Failed to apply component')
    }
  }, [selectedVersion, currentBlockId, componentData, closeSidebar])
  
  const handleRollbackToVersion = useCallback((version: any) => {
    setSelectedVersionId(version.id)
    setActiveTab('preview')
    toast.info(`Rolled back to version ${version.versionNumber}`)
  }, [])
  
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
          { id: 'preview', label: 'Preview', icon: Eye },
          { id: 'history', label: 'History', icon: History }
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
                <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isGenerating}>
                  <SelectTrigger id="model-select">
                    <SelectValue placeholder="Select AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.label}</span>
                          <span className="text-xs text-gray-500">{model.description}</span>
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
              
              {componentData?.versions && componentData.versions.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Current version: {componentData.versions.length}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {componentData.versions.length} iteration{componentData.versions.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleGenerateComponent}
                disabled={isGenerating || !currentPrompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="animate-pulse text-blue-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-300">
                      {currentGeneratingWord}...
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {componentData?.versions?.length ? 'Generate New Version' : 'Generate Component'}
                  </>
                )}
              </Button>
              
              {selectedVersion && (
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
            {selectedVersion ? (
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Version {selectedVersion.versionNumber}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedVersion.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      selectedVersion.status === 'COMPLETED' ? 'default' :
                      selectedVersion.status === 'GENERATING' ? 'secondary' : 'destructive'
                    }
                  >
                    {selectedVersion.status === 'COMPLETED' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {selectedVersion.status === 'GENERATING' && <Clock className="h-3 w-3 mr-1" />}
                    {selectedVersion.status === 'FAILED' && <AlertCircle className="h-3 w-3 mr-1" />}
                    {selectedVersion.status.toLowerCase()}
                  </Badge>
                </div>
                
                {selectedVersion.prompt && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Prompt</h4>
                    <div className="text-sm text-gray-600 bg-gray-50 rounded p-2 border">
                      {selectedVersion.prompt}
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex-1 flex flex-col min-h-0">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                  {selectedVersion.status === 'COMPLETED' ? (
                    <ScrollArea className="flex-1 h-full">
                      <div className="p-4">
                        <SafeReactComponentRuntime
                          code={selectedVersion.generatedCode}
                          className="min-h-full"
                          onError={(error) => {
                            toast.error(`Preview error: ${error}`)
                          }}
                        />
                      </div>
                    </ScrollArea>
                  ) : selectedVersion.status === 'GENERATING' ? (
                    <div className="flex-1 flex items-center justify-center border rounded-lg bg-gray-50">
                      <div className="text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          <span className="animate-pulse text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)] transition-all duration-300 font-medium">
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
                          Generation failed: {selectedVersion.errorMessage}
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
                
                {selectedVersion.status === 'COMPLETED' && (
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
        
        {activeTab === 'history' && (
          <div className="p-4 flex-1 flex flex-col min-h-0 h-full">
            {componentData?.versions && componentData.versions.length > 0 ? (
              <ScrollArea className="flex-1 h-full">
                <div className="space-y-3 pr-4">
                  {componentData.versions
                    .sort((a, b) => b.versionNumber - a.versionNumber)
                    .map((version) => (
                      <Card 
                        key={version.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedVersionId === version.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedVersionId(version.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Version {version.versionNumber}</span>
                            <Badge 
                              variant={
                                version.status === 'COMPLETED' ? 'default' :
                                version.status === 'GENERATING' ? 'secondary' : 'destructive'
                              }
                              className="text-xs"
                            >
                              {version.status.toLowerCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {version.prompt}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{new Date(version.createdAt).toLocaleString()}</span>
                            {version.status === 'COMPLETED' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRollbackToVersion(version)
                                }}
                                className="h-6 px-2"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Use
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center h-full">
                <div>
                  <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No version history</p>
                  <p className="text-sm text-gray-400">Generated components will appear here</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}