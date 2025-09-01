'use client'

import { create } from 'zustand'

interface AIComponentData {
  generatedCode: string
  prompt: string
  status: 'empty' | 'generating' | 'completed' | 'failed'
  errorMessage: string
}

interface AIComponentPopupState {
  isOpen: boolean
  currentBlockId: string | null
  currentComponentData: AIComponentData | null
  
  // Actions
  openPopup: (blockId: string, componentData?: AIComponentData | null) => void
  closePopup: () => void
  updateComponentData: (data: AIComponentData) => void
}

export const useAIComponentPopup = create<AIComponentPopupState>((set) => ({
  isOpen: false,
  currentBlockId: null,
  currentComponentData: null,
  
  openPopup: (blockId: string, componentData?: AIComponentData | null) => {
    console.log('🎯 Opening popup for block:', blockId, 'with data:', componentData)
    set({
      isOpen: true,
      currentBlockId: blockId,
      currentComponentData: componentData || null,
    })
  },
  
  closePopup: () => {
    console.log('🎯 Closing popup')
    set({
      isOpen: false,
      currentBlockId: null,
      currentComponentData: null,
    })
  },
  
  updateComponentData: (data: AIComponentData) => {
    set({ currentComponentData: data })
  },
}))