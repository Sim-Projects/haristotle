'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SafeReactComponentRuntime } from './react-component-runtime'
import { useAISidebar } from '@/hooks/use-ai-sidebar'
import { Sparkles, Settings, Trash2, Code } from 'lucide-react'
import { toast } from 'sonner'

interface AIComponentRendererProps {
  blockId: string
  onDelete?: () => void
  className?: string
  editable?: boolean
  mode?: 'DRAFT' | 'PUBLISHED'
}

export function AIComponentRenderer({ blockId, onDelete, className = '', editable = true, mode = 'DRAFT' }: AIComponentRendererProps) {
  const { openSidebar, isOpen: isAISidebarOpen, currentBlockId } = useAISidebar()
  const [componentData, setComponentData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const { postId, isPublishedView } = useMemo(() => {
    // Extract postId from URL or window context
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      const writeMatch = path.match(/\/write\/([a-zA-Z0-9]+)/)
      const postMatch = path.match(/\/post\/([a-zA-Z0-9]+)/)
      
      return {
        postId: writeMatch ? writeMatch[1] : postMatch ? postMatch[1] : null,
        isPublishedView: !!postMatch
      }
    }
    return { postId: null, isPublishedView: false }
  }, [])
  
  // Fetch component data when block loads
  useEffect(() => {
    if (!blockId) return
    
    const fetchComponentData = async () => {
      try {
        setLoading(true)
        // Use published mode when viewing published posts, otherwise use the provided mode or draft
        const fetchMode = isPublishedView ? 'PUBLISHED' : (mode || 'DRAFT')
        const response = await fetch(`/api/ai/components/by-block/${blockId}?mode=${fetchMode}`)
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
  }, [blockId, mode, isPublishedView])
  
  // Listen for component updates
  useEffect(() => {
    const handleComponentApplied = (event: CustomEvent) => {
      if (event.detail.blockId === blockId) {
        // Refresh component data when a component is applied
        const fetchComponentData = async () => {
          try {
            const fetchMode = isPublishedView ? 'PUBLISHED' : (mode || 'DRAFT')
            const response = await fetch(`/api/ai/components/by-block/${blockId}?mode=${fetchMode}`)
            if (response.ok) {
              const data = await response.json()
              setComponentData(data)
            }
          } catch (error) {
            console.error('Error fetching updated component data:', error)
          }
        }
        fetchComponentData()
        toast.success('Component applied successfully!')
      }
    }
    
    const handleOpenSidebar = (event: CustomEvent) => {
      if (event.detail.blockId === blockId) {
        handleOpenSidebarClick()
      }
    }
    
    const handleSidebarClosed = () => {
      // Force re-render when sidebar closes to ensure header is visible
      setComponentData((prev: any) => prev ? { ...prev } : prev)
    }
    
    window.addEventListener('ai-component-applied', handleComponentApplied as EventListener)
    window.addEventListener('open-ai-sidebar', handleOpenSidebar as EventListener)
    window.addEventListener('ai-sidebar-closed', handleSidebarClosed as EventListener)
    
    return () => {
      window.removeEventListener('ai-component-applied', handleComponentApplied as EventListener)
      window.removeEventListener('open-ai-sidebar', handleOpenSidebar as EventListener)
      window.removeEventListener('ai-sidebar-closed', handleSidebarClosed as EventListener)
    }
  }, [blockId, mode, isPublishedView])
  
  const handleOpenSidebarClick = useCallback(() => {
    if (!postId) {
      toast.error('Cannot open AI sidebar: Post ID not found')
      return
    }
    openSidebar(blockId, componentData)
  }, [blockId, componentData, postId, openSidebar])
  
  const handleDelete = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this AI component?')) {
      onDelete?.()
    }
  }, [onDelete])
  
  // Get current version for rendering
  const currentVersion = useMemo(() => {
    if (!componentData) return null
    
    const viewMode = isPublishedView ? 'PUBLISHED' : (mode || 'DRAFT')
    
    if (viewMode === 'DRAFT') {
      // In draft mode, use currentDraftVersion
      return componentData.currentDraftVersion || null
    } else {
      // In published mode, use currentPublishedVersion
      return componentData.currentPublishedVersion || null
    }
  }, [componentData, mode, isPublishedView])
  
  if (loading) {
    return (
      <Card className={`w-full min-h-[200px] border-dashed ${className}`}>
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
      <Card className={`w-full min-h-[200px] border-dashed border-2 hover:border-blue-300 transition-colors ${className}`}>
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
              {editable && (
                <div className="flex justify-center space-x-2">
                  <Button onClick={handleOpenSidebarClick} className="flex items-center space-x-2">
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
    <div className={`w-full max-w-full space-y-3 overflow-hidden ${className}`}>
      {/* Component header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-t-lg border border-b-0">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">AI Generated Component</span>
          <Badge variant="secondary" className="text-xs">
            {isPublishedView || mode === 'PUBLISHED' ? 'Published' : 'Draft'}
          </Badge>
        </div>
        {editable && (
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleOpenSidebarClick}
              className="h-8 px-2"
              title="Open AI Assistant"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="h-8 px-2 text-red-600 hover:text-red-700"
              title="Delete component"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Component content */}
      <Card className="border border-t-0 rounded-t-none overflow-hidden">
        <CardContent className="p-6 overflow-hidden">
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
            <div className="w-full overflow-hidden">
              <SafeReactComponentRuntime
                code={currentVersion.generatedCode}
                onError={(error) => {
                  toast.error(`Component error: ${error}`)
                }}
              />
            </div>
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
                <Button
                  onClick={handleOpenSidebarClick}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Try again
                </Button>
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