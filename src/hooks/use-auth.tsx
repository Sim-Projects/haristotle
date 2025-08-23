'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { AuthPopup } from '@/components/auth/auth-popup'

interface AuthContextType {
  isAuthenticated: boolean
  user: any
  requireAuth: (options?: AuthRequireOptions) => void
  showAuthPopup: boolean
  hideAuthPopup: () => void
}

interface AuthRequireOptions {
  title?: string
  description?: string
  callbackUrl?: string
  onSuccess?: () => void
}

interface AuthProviderProps {
  children: ReactNode
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession()
  const [showAuthPopup, setShowAuthPopup] = useState(false)
  const [authOptions, setAuthOptions] = useState<AuthRequireOptions>({})
  const callbackRef = useRef<(() => void) | undefined>(undefined)

  const hideAuthPopup = useCallback(() => {
    setShowAuthPopup(false)
    setAuthOptions({})
    callbackRef.current = undefined
  }, [])

  const requireAuth = useCallback((options: AuthRequireOptions = {}) => {
    if (session?.user) {
      // User is authenticated, call onSuccess if provided
      options.onSuccess?.()
      return
    }

    // User is not authenticated, show auth popup
    setAuthOptions(options)
    callbackRef.current = options.onSuccess
    setShowAuthPopup(true)
  }, [session?.user])

  // Close popup when user successfully signs in
  useEffect(() => {
    if (session?.user && showAuthPopup) {
      // Call onSuccess callback if provided
      const callback = callbackRef.current
      // Hide popup first
      hideAuthPopup()
      // Then call callback
      callback?.()
    }
  }, [session?.user, showAuthPopup, hideAuthPopup])

  const value: AuthContextType = {
    isAuthenticated: !!session?.user,
    user: session?.user,
    requireAuth,
    showAuthPopup,
    hideAuthPopup,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthPopup
        isOpen={showAuthPopup}
        onOpenChange={(open) => {
          if (!open) hideAuthPopup()
        }}
        title={authOptions.title}
        description={authOptions.description}
        callbackUrl={authOptions.callbackUrl}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper hook for requiring authentication
export function useRequireAuth() {
  const { requireAuth } = useAuth()
  return requireAuth
}