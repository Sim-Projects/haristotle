'use client'

import dynamic from 'next/dynamic'

export const DynamicBlockNoteEditor = dynamic(
  () => import('./block-note-editor').then((mod) => ({ default: mod.BlockNoteEditor })),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-[500px] w-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    )
  }
)