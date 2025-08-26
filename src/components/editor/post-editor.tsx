'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DynamicBlockNoteEditor as BlockNoteEditor } from './dynamic-block-note-editor'
import { AIComponentSidebar } from './ai-component-sidebar'
import { AISandboxHelp } from './ai-sandbox-help'
import { useNavigationProtection, useAISidebar } from '@/hooks/use-ai-sidebar'
import { Save, Eye, Globe, Lock, Clock, User } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PostEditorProps {
  post?: {
    id: string
    title: string
    content: string | null
    status: string
    slug: string
  }
  isNew?: boolean
}

export function PostEditor({ post, isNew = false }: PostEditorProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState(post?.title || '')
  const [content, setContent] = useState(post?.content || '')
  const [status, setStatus] = useState(post?.status || 'DRAFT')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  
  // Add navigation protection for AI sidebar
  useNavigationProtection()
  
  // Get AI sidebar state
  const { isOpen: isAISidebarOpen, hasUnsavedChanges: hasAIUnsavedChanges } = useAISidebar()

  // Auto-focus title for new posts
  useEffect(() => {
    if (isNew && titleRef.current) {
      titleRef.current.focus()
    }
  }, [isNew])

  // Track unsaved changes
  useEffect(() => {
    const initialTitle = post?.title || ''
    const initialContent = post?.content || ''
    const hasChanges = title !== initialTitle || content !== initialContent
    setHasUnsavedChanges(hasChanges)
  }, [title, content, post?.title, post?.content])

  // Debounced auto-save
  useEffect(() => {
    if (!hasUnsavedChanges || !post?.id) return

    const timeoutId = setTimeout(() => {
      autoSave(content, false)
    }, 3000) // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(timeoutId)
  }, [title, content, hasUnsavedChanges, post?.id, autoSave])

  // Add beforeunload protection for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Auto-save function
  const autoSave = useCallback(async (contentToSave: string, showToast: boolean = false) => {
    if (!session?.user?.id) return
    if (!title.trim() && !contentToSave.trim()) return

    setIsSaving(true)

    try {
      const endpoint = `/api/posts/${post?.id}`
      const method = 'PUT'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title || 'Untitled',
          content: contentToSave,
          status: 'DRAFT',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save post')
      }

      const savedPost = await response.json()

      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      if (showToast) {
        toast.success('Draft saved')
      }
    } catch (error) {
      console.error('Auto-save error:', error)
      if (showToast) {
        toast.error('Failed to save draft')
      }
    } finally {
      setIsSaving(false)
    }
  }, [title, session, post?.id])

  // Manual save function
  const handleSave = useCallback(async () => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to save posts')
      return
    }

    if (!title.trim()) {
      toast.error('Please enter a title for your post')
      titleRef.current?.focus()
      return
    }

    await autoSave(content, true)
  }, [autoSave, content, title, session])

  // Publish function
  const handlePublish = useCallback(async () => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to publish posts')
      return
    }

    if (!title.trim()) {
      toast.error('Please enter a title for your post')
      titleRef.current?.focus()
      return
    }

    if (!content.trim()) {
      toast.error('Please add some content to your post')
      return
    }

    setIsSaving(true)

    try {
      const endpoint = `/api/posts/${post?.id}/publish`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to publish post')
      }

      const publishedPost = await response.json()
      setStatus('PUBLISHED')
      toast.success('Post published successfully!')
      
      // Navigate to the published post
      router.push(`/post/${publishedPost.id}`)
    } catch (error) {
      console.error('Publish error:', error)
      toast.error('Failed to publish post')
    } finally {
      setIsSaving(false)
    }
  }, [title, content, post?.id, session, router])

  // Preview function
  const handlePreview = useCallback(() => {
    if (post?.id) {
      window.open(`/preview/${post.id}`, '_blank')
    } else {
      toast.error('Save the post first to preview')
    }
  }, [post?.id])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b">
        {/* Unsaved changes indicator */}
        {(hasUnsavedChanges || hasAIUnsavedChanges) && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-800">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  You have unsaved changes
                  {hasUnsavedChanges && hasAIUnsavedChanges 
                    ? ' in your post and the AI component generator'
                    : hasUnsavedChanges 
                    ? ' in your post' 
                    : ' in the AI component generator'
                  }
                </span>
              </div>
              <div className="text-xs text-amber-700">
                Changes will be lost if you leave without saving
              </div>
            </div>
          </div>
        )}
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {session?.user?.name || 'Anonymous'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {status === 'PUBLISHED' ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <Globe className="h-3 w-3 mr-1" />
                    Published
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Lock className="h-3 w-3 mr-1" />
                    Draft
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {lastSaved && (
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={!post?.id}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Draft
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>

              <Button
                onClick={handlePublish}
                disabled={isSaving || status === 'PUBLISHED' || !post?.id}
                size="sm"
                title={!post?.id ? "Save as draft first before publishing" : ""}
              >
                <Globe className="h-4 w-4 mr-2" />
                {!post?.id ? 'Publish (save first)' : status === 'PUBLISHED' ? 'Published' : 'Publish'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="transition-all duration-300 ease-in-out">
        <div className={`max-w-4xl mx-auto px-4 py-8 transition-all duration-300 ease-in-out ${
          isAISidebarOpen ? 'mr-[50%]' : ''
        }`}>
          <Card className="p-8">
          {/* Title Input */}
          <div className="mb-8">
            <Input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title..."
              className="text-3xl font-bold border-none px-0 py-2 focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ fontSize: '2rem', lineHeight: '2.5rem' }}
            />
          </div>

          <Separator className="mb-8" />

          {/* AI Sandbox Help */}
          <AISandboxHelp />

          {/* BlockNote Editor */}
          <div className="min-h-[600px]">
            <BlockNoteEditor
              initialContent={content}
              onChange={setContent}
              onSave={autoSave}
              editable={true}
              postId={post?.id}
            />
          </div>
          </Card>
        </div>
        
        {/* AI Component Sidebar */}
        {post?.id && (
          <div className="w-1/2">
            <AIComponentSidebar postId={post.id} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="h-20" /> {/* Spacer */}
    </div>
  )
}