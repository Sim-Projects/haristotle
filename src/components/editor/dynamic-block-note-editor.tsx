'use client'

import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'

interface BlockNoteEditorProps {
  initialContent?: any
  onChange?: (content: any) => void
  onSave?: (content: any, showToast?: boolean) => void
  editable?: boolean
  viewMode?: 'published' | 'draft' | string
  postId?: string
}

const BlockNoteEditorComponent = dynamic(
  () => import('./block-note-editor').then((mod) => ({ default: mod.BlockNoteEditor })),
  { ssr: false }
)

const LoadingComponent = ({ editable, viewMode }: { editable?: boolean, viewMode?: string }) => (
  <div className="min-h-[500px] w-full flex items-center justify-center">
    <div className="text-muted-foreground">
      {editable === false || viewMode === "published" ? "Loading article..." : "Loading editor..."}
    </div>
  </div>
)

export const DynamicBlockNoteEditor = (props: BlockNoteEditorProps) => (
  <Suspense fallback={<LoadingComponent editable={props.editable} viewMode={props.viewMode} />}>
    <BlockNoteEditorComponent {...props} />
  </Suspense>
)