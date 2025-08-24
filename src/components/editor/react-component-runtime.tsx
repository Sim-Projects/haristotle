'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { LiveProvider, LiveError, LivePreview } from 'react-live'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Heart,
  Star,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Download,
  Upload,
  Search,
  Filter,
  Settings,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Globe,
  Hash,
  DollarSign
} from 'lucide-react'

interface ReactComponentRuntimeProps {
  code: string
  className?: string
  onError?: (error: string) => void
  onSuccess?: () => void
}

// Safe scope of components and utilities available to generated components
const SAFE_SCOPE = {
  // React hooks
  useState,
  useEffect,
  useCallback,
  useMemo,
  
  // UI Components
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Textarea,
  Alert,
  AlertDescription,
  Separator,
  Switch,
  Label,
  
  // Icons
  AlertCircle,
  CheckCircle,
  Clock,
  Heart,
  Star,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Download,
  Upload,
  Search,
  Filter,
  Settings,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Globe,
  Hash,
  DollarSign,
  
  // Utilities
  console: {
    log: (...args: any[]) => console.log('[Component]', ...args),
    warn: (...args: any[]) => console.warn('[Component]', ...args),
    error: (...args: any[]) => console.error('[Component]', ...args)
  }
}

export function ReactComponentRuntime({ 
  code, 
  className = '', 
  onError, 
  onSuccess 
}: ReactComponentRuntimeProps) {
  const [error, setError] = useState<string | null>(null)
  
  // Clean and validate the code
  const sanitizedCode = useMemo(() => {
    if (!code || typeof code !== 'string') return 'function ErrorComponent() { return <div>No code provided</div> }'
    
    // Basic validation - ensure it looks like a React component
    const cleanCode = code.trim()
    
    // If it's just JSX, wrap it in a function component
    if (cleanCode.startsWith('<') && cleanCode.endsWith('>')) {
      return `function GeneratedComponent() { return (${cleanCode}) }`
    }
    
    // If it's already a function or const component, return as is
    if (cleanCode.includes('function ') || cleanCode.includes('const ') || cleanCode.includes('export')) {
      return cleanCode
    }
    
    // Try to wrap whatever it is in a function component
    return `function GeneratedComponent() { return (${cleanCode}) }`
  }, [code])
  
  // Error handling is now managed by LiveProvider internally
  
  useEffect(() => {
    // Reset error when code changes
    setError(null)
  }, [sanitizedCode])
  
  return (
    <div className={`relative ${className}`}>
      <LiveProvider
        code={sanitizedCode}
        scope={SAFE_SCOPE}
        noInline={false}
        theme={undefined}
      >
        <div className="space-y-4">
          {/* Error Display */}
          <LiveError className="hidden" />
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Component Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Component Preview */}
          <div className="border rounded-lg p-4 bg-background min-h-[200px] flex items-center justify-center overflow-hidden">
            <div className="w-full max-w-full overflow-auto break-words">
              <div style={{ wordWrap: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}>
                <LivePreview />
              </div>
            </div>
          </div>
        </div>
      </LiveProvider>
    </div>
  )
}

// Higher-order component for additional error boundary protection
export function SafeReactComponentRuntime(props: ReactComponentRuntimeProps) {
  const [hasError, setHasError] = useState(false)
  
  useEffect(() => {
    setHasError(false)
  }, [props.code])
  
  if (hasError) {
    return (
      <Alert variant="destructive" className={props.className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          The component failed to render safely. Please check your code and try again.
        </AlertDescription>
      </Alert>
    )
  }
  
  return (
    <ErrorBoundary onError={() => setHasError(true)}>
      <ReactComponentRuntime {...props} />
    </ErrorBoundary>
  )
}

// Simple Error Boundary component
interface ErrorBoundaryProps {
  children: React.ReactNode
  onError: () => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, { hasError: boolean }> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(_error: Error) {
    return { hasError: true }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component Error:', error, errorInfo)
    this.props.onError()
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Something went wrong with this component.
          </AlertDescription>
        </Alert>
      )
    }
    
    return this.props.children
  }
}