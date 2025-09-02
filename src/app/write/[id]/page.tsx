'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { PostEditor } from '@/components/editor/post-editor'
import { AuthRequired } from '@/components/auth/auth-required'
import { Header } from '@/components/layout/header'
import { AIComponentPopup } from '@/components/editor/ai-component-popup'
import { useAIComponentPopup } from '@/hooks/use-ai-component-popup'

interface WritePageProps {
  params: Promise<{ id: string }>
}

interface Post {
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

export default function EditPostPage({ params }: WritePageProps) {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()
  const router = useRouter()
  
  // AI Component Popup state
  const { isOpen, closePopup, currentBlockId, currentComponentData } = useAIComponentPopup()
  
  // Handle applying component updates
  const handleApplyComponent = (componentData: any, shouldClose: boolean = false) => {
    if (currentBlockId) {
      console.log('🔄 Applying component to block:', currentBlockId, componentData)
      // Dispatch event to update the specific block
      const updateEvent = new CustomEvent('ai-component-updated', {
        detail: {
          blockId: currentBlockId,
          componentData: componentData
        }
      })
      window.dispatchEvent(updateEvent)
      
      if (shouldClose) {
        closePopup()
      }
    }
  }

  useEffect(() => {
    async function fetchPost() {
      try {
        const { id } = await params
        const response = await fetch(`/api/posts/${id}/edit`)
        
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/404')
            return
          }
          throw new Error('Failed to fetch post')
        }

        const postData = await response.json()
        setPost(postData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (session !== undefined) {
      fetchPost()
    }
  }, [params, session, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading post...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => router.back()} className="underline">
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <AuthRequired 
        title="Sign in to edit this post"
        description="You need to sign in to edit posts on Haristotle."
        callbackUrl={`/write/${post?.id}`}
      >
        {post && (
          <PostEditor 
            post={post}
            isNew={false}
          />
        )}
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