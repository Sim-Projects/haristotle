'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'
import { GoogleSignInButton } from './google-signin-button'
import { Separator } from '@/components/ui/separator'
import { BookOpen } from 'lucide-react'

interface AuthPopupProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  callbackUrl?: string
}

export function AuthPopup({ 
  isOpen, 
  onOpenChange, 
  title = "Sign in to continue",
  description = "Sign in to your account or create a new one to continue with this action.",
  callbackUrl = '/dashboard'
}: AuthPopupProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6" />
              <span className="text-lg font-bold">Haristotle</span>
            </div>
          </div>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <GoogleSignInButton 
            text={mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}
            callbackUrl={callbackUrl} 
          />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          {mode === 'login' ? (
            <LoginForm callbackUrl={callbackUrl} />
          ) : (
            <RegisterForm callbackUrl={callbackUrl} />
          )}
        </div>
        
        <div className="text-center">
          {mode === 'login' ? (
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setMode('register')}
                className="underline underline-offset-4 hover:text-primary"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="underline underline-offset-4 hover:text-primary"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
        
        <p className="px-8 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </Link>
          .
        </p>
      </DialogContent>
    </Dialog>
  )
}