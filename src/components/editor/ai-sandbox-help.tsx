'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, Info, X } from 'lucide-react'

export function AISandboxHelp() {
  const [isVisible, setIsVisible] = useState(() => {
    // Check if user has seen this before
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('ai-sandbox-help-dismissed')
    }
    return true
  })

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('ai-sandbox-help-dismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-800">
          <Sparkles className="h-4 w-4" />
          <span>
            <strong>New:</strong> Type{' '}
            <Badge variant="secondary" className="mx-1 px-2 py-0.5 text-xs">
              /sim
            </Badge>
            in the editor to create AI-powered React components!
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  )
}