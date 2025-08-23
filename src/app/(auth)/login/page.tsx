import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { LoginForm } from '@/components/auth/login-form'
import { GoogleSignInButton } from '@/components/auth/google-signin-button'
import { Separator } from '@/components/ui/separator'

interface LoginPageProps {
  searchParams: Promise<{
    callbackUrl?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const session = await getServerSession(authOptions)
  const callbackUrl = params.callbackUrl || '/'

  if (session) {
    redirect(callbackUrl)
  }

  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome back
      </h1>
      <p className="text-sm text-muted-foreground">
        Enter your email and password to sign in to your account
      </p>
      
      <div className="grid gap-6 pt-4">
        <GoogleSignInButton callbackUrl={callbackUrl} />
        
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
        
        <LoginForm callbackUrl={callbackUrl} />
      </div>
      
      <p className="px-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="underline underline-offset-4 hover:text-primary"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}