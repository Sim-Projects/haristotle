'use client'

import React from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { Sparkles } from 'lucide-react'

export function createAIComponentMenuItem(editor: any) {
  return {
    title: 'AI Component Sandbox',
    onItemClick: () => {
      // Insert AI Component block at current position
      const currentBlock = editor.getTextCursorPosition().block
      const newBlock = {
        type: 'aiComponentSandbox',
        props: {
          blockId: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      }
      
      editor.insertBlocks([newBlock], currentBlock, 'after')
      editor.setTextCursorPosition(newBlock, 'start')
    },
    aliases: ['ai', 'component', 'react', 'sandbox', 'generate'],
    group: 'AI',
    icon: <Sparkles className="w-4 h-4" />,
    subtext: 'Generate custom React components with AI'
  }
}