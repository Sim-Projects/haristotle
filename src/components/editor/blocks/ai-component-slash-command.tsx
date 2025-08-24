'use client'

import { BlockNoteEditor } from '@blocknote/core'
import { Sparkles } from 'lucide-react'

// Function to create and insert an AI Component block
export function insertAIComponentBlock(editor: any) {
  // Generate a unique block ID
  const blockId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  // Create the AI component sandbox block
  const aiComponentBlock = {
    type: 'aiComponentSandbox' as const,
    props: {
      blockId: blockId,
    },
  }
  
  // Insert the block at the current cursor position
  const currentBlock = editor.getTextCursorPosition().block
  editor.insertBlocks([aiComponentBlock as any], currentBlock, 'after')
  
  return blockId
}

// Custom slash command configuration
export const aiComponentSlashCommand = {
  name: 'AI Component',
  execute: (editor: BlockNoteEditor) => {
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
  icon: Sparkles,
  hint: 'Generate custom React components with AI',
}