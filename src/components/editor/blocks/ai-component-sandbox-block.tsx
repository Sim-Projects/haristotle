'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { createReactBlockSpec } from '@blocknote/react'
import { defaultProps } from '@blocknote/core'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SafeReactComponentRuntime } from '../react-component-runtime'
import { useAISidebar } from '@/hooks/use-ai-sidebar'
import { Sparkles, Settings, Trash2, Code } from 'lucide-react'
import { toast } from 'sonner'

interface AIComponentSandboxProps {
  block: any
  editor: any
}

// The custom block component
function AIComponentSandboxComponent({ block, editor }: AIComponentSandboxProps) {
  const { openSidebar, isOpen: isAISidebarOpen, currentBlockId } = useAISidebar()
  const [componentData, setComponentData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  // Check if editor is editable
  const isEditable = editor.isEditable
  
  // Use the blockId from props or generate one
  const blockId = block.props?.blockId || block.id
  const postId = useMemo(() => {
    // Extract postId from editor context
    return (editor as any)?.postId || null
  }, [editor])
  
  // Fetch component data when block loads
  useEffect(() => {
    if (!blockId) return
    
    const fetchComponentData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/ai/components/by-block/${blockId}`)
        if (response.ok) {
          const data = await response.json()
          setComponentData(data)
        } else if (response.status !== 404) {
          console.error('Error fetching component data:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching component data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchComponentData()
  }, [blockId])
  
  // Listen for component updates
  useEffect(() => {
    const handleComponentApplied = (event: CustomEvent) => {
      if (event.detail.blockId === blockId) {
        setComponentData((prev: any) => ({
          ...prev,
          currentVersion: event.detail.version
        }))
        toast.success('Component applied successfully!')
      }
    }
    
    window.addEventListener('ai-component-applied', handleComponentApplied as EventListener)
    return () => {
      window.removeEventListener('ai-component-applied', handleComponentApplied as EventListener)
    }
  }, [blockId])
  
  const handleOpenSidebar = useCallback(() => {
    if (!postId) {
      toast.error('Cannot open AI sidebar: Post ID not found')
      return
    }
    openSidebar(blockId, componentData)
  }, [blockId, componentData, postId, openSidebar])
  
  const handleDeleteBlock = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this AI component?')) {
      editor.removeBlocks([block])
    }
  }, [block, editor])
  
  // Get current version for rendering
  const currentVersion = useMemo(() => {
    if (!componentData?.versions || componentData.versions.length === 0) return null
    
    if (componentData.currentVersionId) {
      return componentData.versions.find((v: any) => v.id === componentData.currentVersionId)
    }
    
    // Fallback to latest completed version
    return componentData.versions
      .filter((v: any) => v.status === 'COMPLETED')
      .sort((a: any, b: any) => b.versionNumber - a.versionNumber)[0] || null
  }, [componentData])
  
  if (loading) {
    return (
      <Card className="w-full min-h-[200px] border-dashed">
        <CardContent className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading AI component...</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (!componentData || !currentVersion) {
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
                <div className="flex justify-center space-x-2">
                  <Button onClick={handleOpenSidebar} className="flex items-center space-x-2">
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
    <div className="w-full space-y-3">
      {/* Component header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-t-lg border border-b-0">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">AI Generated Component</span>
          <Badge variant="secondary" className="text-xs">
            v{currentVersion.versionNumber}
          </Badge>
          {componentData.versions.length > 1 && (
            <Badge variant="outline" className="text-xs">
              {componentData.versions.length} versions
            </Badge>
          )}
        </div>
        {isEditable && (
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleOpenSidebar}
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
        )}
      </div>
      
      {/* Component content */}
      <Card className="border border-t-0 rounded-t-none">
        <CardContent className="p-6">
          {isAISidebarOpen && currentBlockId === blockId ? (
            <div className="min-h-[200px] flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse rounded-lg"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Sparkles className="w-8 h-8 text-white animate-bounce" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Component Editor Active</h3>
                <p className="text-gray-600">This component is being edited in the AI sidebar</p>
              </div>
            </div>
          ) : currentVersion.status === 'COMPLETED' ? (
            <SafeReactComponentRuntime
              code={currentVersion.generatedCode}
              onError={(error) => {
                toast.error(`Component error: ${error}`)
              }}
            />
          ) : currentVersion.status === 'GENERATING' ? (
            <div className="min-h-[150px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating component...</p>
              </div>
            </div>
          ) : (
            <div className="min-h-[150px] flex items-center justify-center">
              <div className="text-center">
                <Code className="w-12 h-12 text-red-300 mx-auto mb-4" />
                <p className="text-red-600 font-medium">Generation failed</p>
                <p className="text-gray-500 text-sm">{currentVersion.errorMessage}</p>
                {isEditable && (
                  <Button
                    onClick={handleOpenSidebar}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    Try again
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Component prompt/description */}
      {currentVersion.prompt && (
        <div className="text-xs text-gray-500 px-3 pb-2">
          <strong>Prompt:</strong> {currentVersion.prompt}
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
    },
    content: 'none',
  },
  {
    render: (props) => <AIComponentSandboxComponent {...props} />,
  }
)