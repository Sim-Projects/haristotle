'use client'

import { ReactNode, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'

interface AuthRequiredProps {
  children: ReactNode
  fallback?: ReactNode
  title?: string
  description?: string
  callbackUrl?: string
  onAuthRequired?: () => void
}

export function AuthRequired({ 
  children, 
  fallback,
  title = "Sign in required",
  description = "You need to sign in to perform this action.",
  callbackUrl,
  onAuthRequired
}: AuthRequiredProps) {
  const { isAuthenticated, requireAuth } = useAuth()

  useEffect(() => {
    if (!isAuthenticated && !fallback) {
      requireAuth({
        title,
        description,
        callbackUrl,
        onSuccess: onAuthRequired,
      })
    }
  }, [isAuthenticated, fallback, requireAuth, title, description, callbackUrl, onAuthRequired])

  if (isAuthenticated) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return null
}

// Higher-order component version
export function withAuthRequired<P extends object>(
  Component: React.ComponentType<P>,
  authOptions?: {
    title?: string
    description?: string
    callbackUrl?: string
  }
) {
  return function AuthRequiredComponent(props: P) {
    return (
      <AuthRequired
        title={authOptions?.title}
        description={authOptions?.description}
        callbackUrl={authOptions?.callbackUrl}
      >
        <Component {...props} />
      </AuthRequired>
    )
  }
}