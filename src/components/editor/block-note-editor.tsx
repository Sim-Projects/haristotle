'use client'

import { useEffect, useMemo, useState } from 'react'
import { PartialBlock, BlockNoteSchema, defaultBlockSpecs, filterSuggestionItems } from '@blocknote/core'
import { useCreateBlockNote, DefaultReactSuggestionItem, getDefaultReactSlashMenuItems, SuggestionMenuController } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { useEditorLock } from '@/hooks/use-ai-sidebar'
import { AIComponentSandboxBlock } from './blocks/ai-component-sandbox-block'
import { insertAIComponentBlock } from './blocks/ai-component-slash-command'
import { Sparkles } from 'lucide-react'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

interface BlockNoteEditorProps {
  initialContent?: string | null
  onChange?: (content: string) => void
  onSave?: (content: string) => void
  editable?: boolean
  postId?: string
}

export function BlockNoteEditor({
  initialContent,
  onChange,
  onSave,
  editable = true,
  postId,
}: BlockNoteEditorProps) {
  const [content, setContent] = useState<string>('')
  const { isLocked } = useEditorLock()

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

  // Create custom schema with AI component block
  const schema = BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs,
      aiComponentSandbox: AIComponentSandboxBlock,
    },
  })

  // Create BlockNote editor instance with custom schema
  const editor = useCreateBlockNote({
    schema,
    initialContent: parsedInitialContent,
  })

  // Custom AI Component slash menu item
  const getAIComponentSlashMenuItem = (editor: any): DefaultReactSuggestionItem => ({
    title: "AI Component",
    onItemClick: () => {
      const blockId = insertAIComponentBlock(editor)
      
      // Trigger sidebar opening after a short delay
      setTimeout(() => {
        const event = new CustomEvent('open-ai-sidebar', {
          detail: { blockId }
        })
        window.dispatchEvent(event)
      }, 100)
    },
    aliases: ['sim', 'ai', 'component', 'generate'],
    group: 'AI',
    icon: <Sparkles size={18} />,
    subtext: 'Generate custom React components with AI',
  })

  // Combine default and custom slash menu items
  const getCustomSlashMenuItems = (editor: any): DefaultReactSuggestionItem[] => [
    ...getDefaultReactSlashMenuItems(editor),
    getAIComponentSlashMenuItem(editor),
  ]

  // Pass postId to editor for AI components to access
  useEffect(() => {
    if (editor && postId) {
      (editor as any).postId = postId
    }
  }, [editor, postId])
  

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

  // // Auto-save functionality
  // useEffect(() => {
  //   if (!onSave || !content) return

  //   const saveTimeout = setTimeout(() => {
  //     onSave(content)
  //   }, 2000) // Auto-save after 2 seconds of inactivity

  //   return () => clearTimeout(saveTimeout)
  // }, [content, onSave])

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
      {isLocked && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-800">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">AI Component Generator is active</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Editor is temporarily locked while working with AI components
          </p>
        </div>
      )}
      
      <BlockNoteView
        editor={editor}
        editable={editable && !isLocked}
        className="focus-within:outline-none"
        theme="light"
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(getCustomSlashMenuItems(editor), query)
          }
        />
      </BlockNoteView>
    </div>
  )
}