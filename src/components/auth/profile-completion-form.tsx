'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { profileCompletionSchema, type ProfileCompletionInput } from '@/lib/validations/auth'

interface ProfileCompletionFormProps {
  callbackUrl?: string
}

export function ProfileCompletionForm({ callbackUrl = '/' }: ProfileCompletionFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { data: session, update } = useSession()
  const router = useRouter()
  
  const form = useForm<ProfileCompletionInput>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      name: session?.user?.name || '',
      username: session?.user?.username || '',
    },
  })

  const onSubmit = async (data: ProfileCompletionInput) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.message || 'Something went wrong')
        return
      }

      // Update the session with new data
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
          username: data.username,
        },
      })

      toast.success('Profile updated successfully!')
      router.push(callbackUrl)
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Display Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          disabled={isLoading}
          {...form.register('name')}
        />
        <p className="text-xs text-muted-foreground">This name will be shown on your articles and comments</p>
        {form.formState.errors.name && (
          <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="johndoe"
          disabled={isLoading}
          {...form.register('username')}
        />
        <p className="text-xs text-muted-foreground">Your unique username for your profile URL</p>
        {form.formState.errors.username && (
          <p className="text-sm text-red-600">{form.formState.errors.username.message}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : null}
          Complete Profile
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push(callbackUrl)}
          disabled={isLoading}
        >
          Skip for now
        </Button>
      </div>
    </form>
  )
}