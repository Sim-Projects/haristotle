import { Suspense, use } from 'react'
import { PostContent } from './post-content'
import { Header } from '@/components/layout/header'

interface ArticlePageProps {
  params: { id: string }
}

export default function ArticlePage({ params }: ArticlePageProps) {
  // No need to await params anymore as it's not a Promise in App Router
  const { id } = params

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading article...</p>
          </div>
        </div>
      }>
        <PostContent postId={id} />
      </Suspense>
    </div>
  )
}