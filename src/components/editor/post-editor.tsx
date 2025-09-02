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
import { AISandboxHelp } from './ai-sandbox-help'
import { Save, Eye, Globe, Lock, Clock, User, Trash2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PostEditorProps {
  post?: {
    id: string
    slug: string
    status: string
    draftContent?: {
      title: string
      content: any
      excerpt?: string
      featuredImage?: string
    }
    publishedContent?: {
      title: string
      content: any
      excerpt?: string
      featuredImage?: string
    }
  }
  isNew?: boolean
}

export function PostEditor({ post, isNew = false }: PostEditorProps) {
  const { data: session } = useSession()
  const router = useRouter()
  // Get the editing content (draft takes priority, then published, then empty)
  const editingContent = post?.draftContent || post?.publishedContent
  const [title, setTitle] = useState(editingContent?.title || '')
  const [content, setContent] = useState(editingContent?.content || '')
  const [status, setStatus] = useState(post?.status || 'DRAFT')
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [canPublish, setCanPublish] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  

  // Auto-focus title for new posts
  useEffect(() => {
    if (isNew && titleRef.current) {
      titleRef.current.focus()
    }
  }, [isNew])

  // Track unsaved changes and publish button state
  useEffect(() => {
    const initialTitle = editingContent?.title || ''
    const initialContent = editingContent?.content || ''
    const hasChanges = title !== initialTitle || content !== initialContent
    setHasUnsavedChanges(hasChanges)

    // Enable publish button if there are changes compared to published content
    const publishedTitle = post?.publishedContent?.title || ''
    const publishedContent = post?.publishedContent?.content || ''
    const hasDraftOrChanges = post?.draftContent || (title !== publishedTitle || content !== publishedContent)
    setCanPublish(!!hasDraftOrChanges && title.trim() && content.trim())
  }, [title, content, editingContent?.title, editingContent?.content, post?.publishedContent, post?.draftContent])

  // Auto-save function
  const autoSave = useCallback(async (contentToSave: string, showToast: boolean = false) => {
    if (!session?.user?.id || !post?.id) return
    if (!title.trim() && !contentToSave.trim()) return

    setIsSaving(true)

    try {
      const response = await fetch(`/api/posts/${post.id}/save-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title || 'Untitled',
          content: contentToSave,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

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
    if (!session?.user?.id || !post?.id) {
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

    setIsPublishing(true)

    try {
      // First save current changes to draft
      await autoSave(content, false)
      
      // Then publish
      const response = await fetch(`/api/posts/${post.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to publish post')
      }

      const publishedPost = await response.json()
      setStatus('PUBLISHED')
      setCanPublish(false)
      toast.success('Post published successfully!')
      
      // Navigate to the published post
      router.push(`/${post.slug}`)
    } catch (error) {
      console.error('Publish error:', error)
      toast.error('Failed to publish post')
    } finally {
      setIsPublishing(false)
    }
  }, [title, content, post?.id, post?.slug, session, router, autoSave])

  // Preview function
  const handlePreview = useCallback(() => {
    if (post?.id) {
      window.open(`/preview/${post.id}`, '_blank')
    } else {
      toast.error('Save the post first to preview')
    }
  }, [post?.id])

  // Discard draft function
  const handleDiscardDraft = useCallback(async () => {
    if (!post?.id || !post?.draftContent) return

    if (!confirm('Are you sure you want to discard all draft changes? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${post.id}/discard-draft`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to discard draft')
      }

      const result = await response.json()
      
      if (result.deleted) {
        // Whole post was deleted
        toast.success('Draft discarded and post deleted')
        router.push('/dashboard')
      } else {
        // Draft discarded, revert to published content
        const publishedContent = post.publishedContent
        if (publishedContent) {
          setTitle(publishedContent.title)
          setContent(publishedContent.content)
          setHasUnsavedChanges(false)
          toast.success('Draft discarded, reverted to published version')
        }
      }
    } catch (error) {
      console.error('Discard draft error:', error)
      toast.error('Failed to discard draft')
    }
  }, [post?.id, post?.draftContent, post?.publishedContent, router])

  // Reset draft to published function
  const handleResetDraft = useCallback(async () => {
    if (!post?.id || !post?.publishedContent) return

    if (!confirm('Are you sure you want to reset the draft to match the published content? All current changes will be lost.')) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${post.id}/reset-draft`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to reset draft')
      }

      const result = await response.json()
      
      // Update UI to show reset content
      setTitle(result.draftContent.title)
      setContent(result.draftContent.content)
      setHasUnsavedChanges(false)
      toast.success('Draft reset to published content')
    } catch (error) {
      console.error('Reset draft error:', error)
      toast.error('Failed to reset draft')
    }
  }, [post?.id, post?.publishedContent])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b">
        {/* Unsaved changes indicator */}
        {hasUnsavedChanges && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-800">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  You have unsaved changes in your post
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

              {/* Reset Draft Button - only show if there's published content */}
              {post?.publishedContent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetDraft}
                  disabled={isSaving}
                  title="Reset draft to match published content"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}

              {/* Discard Draft Button - only show if there's draft content */}
              {post?.draftContent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDiscardDraft}
                  disabled={isSaving}
                  title="Discard all draft changes"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Discard Draft
                </Button>
              )}

              <Button
                onClick={handlePublish}
                disabled={isPublishing || !canPublish}
                size="sm"
                title={!canPublish ? "No changes to publish" : "Publish current draft"}
              >
                <Globe className="h-4 w-4 mr-2" />
                {isPublishing ? 'Publishing...' : 
                 status === 'PUBLISHED' && post?.draftContent ? 'Publish Changes' :
                 status === 'PUBLISHED' ? 'Published' : 'Publish'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="transition-all duration-300 ease-in-out">
        <div className="max-w-4xl mx-auto px-4 py-8">
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
        
      </div>

      {/* Footer */}
      <div className="h-20" /> {/* Spacer */}
    </div>
  )
}