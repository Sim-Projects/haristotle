'use client'

import { PostEditor } from '@/components/editor/post-editor'
import { AuthRequired } from '@/components/auth/auth-required'
import { Header } from '@/components/layout/header'

export default function WritePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <AuthRequired 
        title="Sign in to start writing"
        description="Create an account or sign in to start writing and sharing your stories on Haristotle."
        callbackUrl="/write"
      >
        <PostEditor isNew={true} />
      </AuthRequired>
    </div>
  )
}