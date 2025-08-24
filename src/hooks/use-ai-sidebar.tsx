'use client'

import { create } from 'zustand'
import { useEffect, useCallback } from 'react'

interface AIComponentVersion {
  id: string
  prompt: string
  generatedCode: string
  versionNumber: number
  status: 'GENERATING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string | null
  createdAt: string
}

interface AIComponentData {
  id: string
  blockId: string
  currentVersionId?: string | null
  versions: AIComponentVersion[]
}

interface AISidebarState {
  isOpen: boolean
  isGenerating: boolean
  currentBlockId: string | null
  currentPrompt: string
  componentData: AIComponentData | null
  hasUnsavedChanges: boolean
  
  // Actions
  openSidebar: (blockId: string, componentData?: AIComponentData) => void
  closeSidebar: () => void
  setPrompt: (prompt: string) => void
  setGenerating: (generating: boolean) => void
  setComponentData: (data: AIComponentData) => void
  setUnsavedChanges: (hasChanges: boolean) => void
  reset: () => void
}

export const useAISidebar = create<AISidebarState>((set, get) => ({
  isOpen: false,
  isGenerating: false,
  currentBlockId: null,
  currentPrompt: '',
  componentData: null,
  hasUnsavedChanges: false,
  
  openSidebar: (blockId: string, componentData?: AIComponentData) => {
    set({
      isOpen: true,
      currentBlockId: blockId,
      componentData: componentData || null,
      hasUnsavedChanges: false,
      currentPrompt: ''
    })
  },
  
  closeSidebar: () => {
    set({
      isOpen: false,
      currentBlockId: null,
      currentPrompt: '',
      componentData: null,
      hasUnsavedChanges: false,
      isGenerating: false
    })
  },
  
  setPrompt: (prompt: string) => {
    set({ currentPrompt: prompt, hasUnsavedChanges: true })
  },
  
  setGenerating: (generating: boolean) => {
    set({ isGenerating: generating })
  },
  
  setComponentData: (data: AIComponentData) => {
    set({ componentData: data })
  },
  
  setUnsavedChanges: (hasChanges: boolean) => {
    set({ hasUnsavedChanges: hasChanges })
  },
  
  reset: () => {
    set({
      isOpen: false,
      isGenerating: false,
      currentBlockId: null,
      currentPrompt: '',
      componentData: null,
      hasUnsavedChanges: false
    })
  }
}))

// Hook for navigation protection
export function useNavigationProtection() {
  const { isOpen, hasUnsavedChanges } = useAISidebar()
  
  const shouldWarnBeforeUnload = isOpen && hasUnsavedChanges
  
  useEffect(() => {
    if (!shouldWarnBeforeUnload) return
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'You have unsaved changes in the AI component generator. Are you sure you want to leave?'
      return e.returnValue
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [shouldWarnBeforeUnload])
  
  const confirmNavigation = useCallback(() => {
    if (!shouldWarnBeforeUnload) return true
    
    return window.confirm('You have unsaved changes in the AI component generator. Are you sure you want to leave?')
  }, [shouldWarnBeforeUnload])
  
  return { shouldWarnBeforeUnload, confirmNavigation }
}

// Hook for editor locking
export function useEditorLock() {
  const { isOpen } = useAISidebar()
  
  return {
    isLocked: isOpen,
    lockReason: isOpen ? 'AI Component Generator is open' : null
  }
}