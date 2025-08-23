import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ProfileCompletionForm } from '@/components/auth/profile-completion-form'

interface CompleteProfilePageProps {
  searchParams: Promise<{
    callbackUrl?: string
  }>
}

export default async function CompleteProfilePage({ searchParams }: CompleteProfilePageProps) {
  const params = await searchParams
  const session = await getServerSession(authOptions)
  const callbackUrl = params.callbackUrl || '/'

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Complete your profile
      </h1>
      <p className="text-sm text-muted-foreground">
        Set your display name and username to get started on Haristotle
      </p>
      
      <div className="grid gap-6 pt-4">
        <ProfileCompletionForm callbackUrl={callbackUrl} />
      </div>
      
      <p className="px-8 text-center text-xs text-muted-foreground">
        You can always update these details later in your profile settings.
      </p>
    </div>
  )
}