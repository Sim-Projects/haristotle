'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { createReactBlockSpec } from '@blocknote/react'
import { defaultProps } from '@blocknote/core'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SafeReactComponentRuntime } from '../react-component-runtime'
import { useAIComponentPopup } from '@/hooks/use-ai-component-popup'
import { Sparkles, Settings, Trash2, Code } from 'lucide-react'
import { toast } from 'sonner'

interface AIComponentSandboxProps {
  block: any
  editor: any
}

// The custom block component
function AIComponentSandboxComponent({ block, editor }: AIComponentSandboxProps) {
  const { openPopup } = useAIComponentPopup()
  
  // Check if editor is editable
  const isEditable = editor.isEditable
  
  // Use the blockId from props or generate one
  const blockId = block.props?.blockId || block.id

  // Get component data directly from block props
  const componentData = useMemo(() => ({
    generatedCode: block.props.generatedCode || '',
    prompt: block.props.prompt || '',
    promptHistory: JSON.parse(block.props.promptHistory || '[]'),
    status: block.props.status || 'empty',
    errorMessage: block.props.errorMessage || '',
  }), [block.props])
  
  const handleOpenPopup = useCallback(() => {
    console.log('🚀 handleOpenPopup called for block:', blockId)
    openPopup(blockId, componentData)
  }, [blockId, componentData, openPopup])

  // Listen for component updates from popup and sidebar
  useEffect(() => {
    const handleComponentUpdate = (event: CustomEvent) => {
      if (event.detail.blockId === blockId && event.detail.componentData) {
        console.log('📥 Received component update for block:', blockId, event.detail.componentData)
        
        // Build new prompt history
        const currentHistory = JSON.parse(block.props.promptHistory || '[]')
        const newPrompt = event.detail.componentData.prompt
        const newHistory = newPrompt && !currentHistory.includes(newPrompt) 
          ? [...currentHistory, newPrompt]
          : currentHistory
        
        // Update block props with new component data
        editor.updateBlock(block, {
          props: {
            ...block.props,
            generatedCode: event.detail.componentData.generatedCode,
            prompt: event.detail.componentData.prompt,
            promptHistory: JSON.stringify(newHistory),
            status: event.detail.componentData.status,
            errorMessage: event.detail.componentData.errorMessage,
          }
        })
      }
    }
    
    // Listen to both event types
    window.addEventListener('ai-component-updated', handleComponentUpdate as EventListener)
    window.addEventListener('ai-component-applied', handleComponentUpdate as EventListener)
    return () => {
      window.removeEventListener('ai-component-updated', handleComponentUpdate as EventListener)
      window.removeEventListener('ai-component-applied', handleComponentUpdate as EventListener)
    }
  }, [blockId, block, editor])
  
  const handleDeleteBlock = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this AI component?')) {
      editor.removeBlocks([block])
    }
  }, [block, editor])
  
  if (componentData.status === 'empty') {
    // Empty state - show prompt to generate component
    return (
      <Card className="w-full min-h-[200px] border-dashed border-2 hover:border-blue-300 transition-colors">
        <CardContent className="flex items-center justify-center h-full p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Component Sandbox</h3>
              <p className="text-gray-600 text-sm mb-4">
                Generate custom React components with AI assistance
              </p>
              {isEditable && (
                <div className="flex justify-center space-x-2 mt-4">
                  <Button onClick={handleOpenPopup} className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Component</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Component with generated content
  return (
    <div className={`w-full ${isEditable ? 'border rounded-lg' : ''}`}>
      {/* Component header - only show in edit mode */}
      {isEditable && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-t-lg border-b">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">AI Generated Component</span>
            <Badge variant="secondary" className="text-xs">
              {componentData.status === 'completed' ? 'Ready' : 'Draft'}
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleOpenPopup}
              className="h-8 px-2"
              title="Open AI Assistant"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeleteBlock}
              className="h-8 px-2 text-red-600 hover:text-red-700"
              title="Delete component"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Component content */}
      {isEditable ? (
        <Card className="border-0 rounded-t-none shadow-none">
          <CardContent className="p-6">
            {componentData.status === 'completed' ? (
              <SafeReactComponentRuntime
                code={componentData.generatedCode}
                onError={(error) => {
                  toast.error(`Component error: ${error}`)
                }}
              />
            ) : componentData.status === 'generating' ? (
              <div className="min-h-[150px] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating component...</p>
                </div>
              </div>
            ) : componentData.status === 'failed' ? (
              <div className="min-h-[150px] flex items-center justify-center">
                <div className="text-center">
                  <Code className="w-12 h-12 text-red-300 mx-auto mb-4" />
                  <p className="text-red-600 font-medium">Generation failed</p>
                  <p className="text-gray-500 text-sm">{componentData.errorMessage}</p>
                  <Button
                    onClick={handleOpenPopup}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    Try again
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        // View mode - minimal wrapper without borders
        <div className="w-full">
          {componentData.status === 'completed' ? (
            <SafeReactComponentRuntime
              code={componentData.generatedCode}
              onError={(error) => {
                console.error('Component error in view mode:', error)
              }}
            />
          ) : componentData.status === 'generating' ? (
            <div className="min-h-[150px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          ) : componentData.status === 'failed' ? (
            <div className="min-h-[150px] flex items-center justify-center text-center">
              <div>
                <Code className="w-12 h-12 text-red-300 mx-auto mb-4" />
                <p className="text-red-600 font-medium">Component unavailable</p>
              </div>
            </div>
          ) : null}
        </div>
      )}
      
      {/* Component prompt/description - only show in edit mode */}
      {isEditable && componentData.promptHistory.length > 0 && (
        <div className="text-xs text-gray-500 px-3 pb-2 mt-3">
          <strong>Prompts:</strong> {componentData.promptHistory.join(' → ')}
        </div>
      )}
    </div>
  )
}

// Create the BlockNote block specification
export const AIComponentSandboxBlock = createReactBlockSpec(
  {
    type: 'aiComponentSandbox' as const,
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      backgroundColor: defaultProps.backgroundColor,
      blockId: {
        default: '' as const,
      },
      // Store the AI component data directly in the block
      generatedCode: {
        default: '' as const,
      },
      prompt: {
        default: '' as const,
      },
      promptHistory: {
        default: '[]' as const, // JSON array of all prompts used to create this component
      },
      status: {
        default: 'empty' as const, // 'empty', 'generating', 'completed', 'failed'
      },
      errorMessage: {
        default: '' as const,
      },
    },
    content: 'none',
  },
  {
    render: (props) => <AIComponentSandboxComponent {...props} />,
  }
)