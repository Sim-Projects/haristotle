'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DynamicBlockNoteEditor as BlockNoteEditor } from './dynamic-block-note-editor'
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
  const titleRef = useRef<HTMLInputElement>(null)

  // Auto-focus title for new posts
  useEffect(() => {
    if (isNew && titleRef.current) {
      titleRef.current.focus()
    }
  }, [isNew])

  // Auto-save function
  const autoSave = useCallback(async (contentToSave: string) => {
    if (!session?.user?.id) return
    if (!title.trim() && !contentToSave.trim()) return

    setIsSaving(true)

    try {
      const endpoint = isNew || !post?.id ? '/api/posts' : `/api/posts/${post.id}`
      const method = isNew || !post?.id ? 'POST' : 'PUT'

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
      
      // If this was a new post, update the URL
      if (isNew && savedPost.id) {
        router.replace(`/write/${savedPost.id}`, { scroll: false })
      }

      setLastSaved(new Date())
      toast.success('Draft saved automatically')
    } catch (error) {
      console.error('Auto-save error:', error)
      toast.error('Failed to auto-save draft')
    } finally {
      setIsSaving(false)
    }
  }, [title, session, isNew, post?.id, router])

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

    await autoSave(content)
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
                Preview
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>

              <Button
                onClick={handlePublish}
                disabled={isSaving || status === 'PUBLISHED'}
                size="sm"
              >
                <Globe className="h-4 w-4 mr-2" />
                {status === 'PUBLISHED' ? 'Published' : 'Publish'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content */}
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

          {/* BlockNote Editor */}
          <div className="min-h-[600px]">
            <BlockNoteEditor
              initialContent={content}
              onChange={setContent}
              onSave={autoSave}
              editable={true}
            />
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="h-20" /> {/* Spacer */}
    </div>
  )
}