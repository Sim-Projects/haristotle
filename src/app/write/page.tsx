'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { PostEditor } from '@/components/editor/post-editor'
import { AuthRequired } from '@/components/auth/auth-required'
import { Header } from '@/components/layout/header'
import { AIComponentPopup } from '@/components/editor/ai-component-popup'
import { useAIComponentPopup } from '@/hooks/use-ai-component-popup'
import { toast } from 'sonner'

interface Post {
  id: string
  title: string
  content: string
  status: string
  slug: string
  authorId: string
}

export default function WritePage() {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  
  // AI Component Popup state
  const { isOpen, closePopup, currentBlockId, currentComponentData } = useAIComponentPopup()
  
  // Handle applying component updates
  const handleApplyComponent = (componentData: any) => {
    if (currentBlockId) {
      // Dispatch event to update the specific block
      const updateEvent = new CustomEvent('ai-component-updated', {
        detail: {
          blockId: currentBlockId,
          componentData: componentData
        }
      })
      window.dispatchEvent(updateEvent)
      closePopup()
    }
  }

  useEffect(() => {
    async function createNewPost() {
      if (!session?.user?.id || post) return
      
      setLoading(true)
      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Untitled',
            content: '',
            status: 'DRAFT',
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create post')
        }

        const newPost = await response.json()
        setPost({
          ...newPost,
          content: newPost.content || ''
        })
        
        // Redirect to the edit page with the new post ID
        router.replace(`/write/${newPost.id}`)
      } catch (error) {
        console.error('Error creating post:', error)
        toast.error('Failed to create new post')
      } finally {
        setLoading(false)
      }
    }

    if (session !== undefined) {
      createNewPost()
    }
  }, [session, post, router])

  if (loading || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Creating new post...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <AuthRequired 
        title="Sign in to start writing"
        description="Create an account or sign in to start writing and sharing your stories on Haristotle."
        callbackUrl="/write"
      >
        <PostEditor post={post} isNew={true} />
      </AuthRequired>
      
      {/* AI Component Popup - Global */}
      <AIComponentPopup
        isOpen={isOpen}
        onClose={closePopup}
        currentBlockId={currentBlockId}
        currentComponentData={currentComponentData}
        onApply={handleApplyComponent}
      />
    </div>
  )
}