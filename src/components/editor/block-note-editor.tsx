'use client'

import { useEffect, useMemo, useState } from 'react'
import { BlockNoteEditor as BlockNoteEditorType, PartialBlock } from '@blocknote/core'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

interface BlockNoteEditorProps {
  initialContent?: string | null
  onChange?: (content: string) => void
  onSave?: (content: string) => void
  editable?: boolean
}

export function BlockNoteEditor({
  initialContent,
  onChange,
  onSave,
  editable = true,
}: BlockNoteEditorProps) {
  const [content, setContent] = useState<string>('')

  // Parse initial content
  const parsedInitialContent = useMemo(() => {
    if (!initialContent) return undefined
    
    try {
      return JSON.parse(initialContent) as PartialBlock[]
    } catch (error) {
      console.error('Error parsing initial content:', error)
      return undefined
    }
  }, [initialContent])

  // Create BlockNote editor instance
  const editor: BlockNoteEditorType | null = useCreateBlockNote({
    initialContent: parsedInitialContent,
  })

  // Handle content changes
  useEffect(() => {
    if (!editor) return

    const handleUpdate = () => {
      const blocks = editor.document
      const jsonContent = JSON.stringify(blocks)
      setContent(jsonContent)
      onChange?.(jsonContent)
    }

    editor.onChange(handleUpdate)
    
    return () => {
      // Cleanup if needed
    }
  }, [editor, onChange])

  // Auto-save functionality
  useEffect(() => {
    if (!onSave || !content) return

    const saveTimeout = setTimeout(() => {
      onSave(content)
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(saveTimeout)
  }, [content, onSave])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        if (onSave && content) {
          onSave(content)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [content, onSave])

  if (!editor) {
    return (
      <div className="min-h-[500px] w-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[500px] w-full">
      <BlockNoteView
        editor={editor}
        editable={editable}
        className="focus-within:outline-none"
        theme="light"
      />
    </div>
  )
}