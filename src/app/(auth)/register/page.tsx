import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { RegisterForm } from '@/components/auth/register-form'
import { GoogleSignInButton } from '@/components/auth/google-signin-button'
import { Separator } from '@/components/ui/separator'

interface RegisterPageProps {
  searchParams: Promise<{
    callbackUrl?: string
  }>
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams
  const session = await getServerSession(authOptions)
  const callbackUrl = params.callbackUrl || '/'

  if (session) {
    redirect(callbackUrl)
  }

  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Create an account
      </h1>
      <p className="text-sm text-muted-foreground">
        Enter your details to create your account and start writing
      </p>
      
      <div className="grid gap-6 pt-4">
        <GoogleSignInButton 
          text="Sign up with Google"
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
        
        <RegisterForm callbackUrl={callbackUrl} />
      </div>
      
      <p className="px-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="underline underline-offset-4 hover:text-primary"
        >
          Sign in
        </Link>
      </p>
      
      <p className="px-8 text-center text-xs text-muted-foreground">
        By clicking continue, you agree to our{' '}
        <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}