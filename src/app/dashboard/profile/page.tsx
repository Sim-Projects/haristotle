'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Camera, MapPin, Link as LinkIcon, Twitter, Linkedin, Github, Calendar } from 'lucide-react'
import { z } from 'zod'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  location: z.string().max(30, 'Location must be less than 30 characters').optional(),
  twitter: z.string().max(15, 'Twitter handle must be less than 15 characters').optional(),
  linkedin: z.string().max(30, 'LinkedIn username must be less than 30 characters').optional(),
  github: z.string().max(39, 'GitHub username must be less than 39 characters').optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface UserProfile extends ProfileFormData {
  id: string
  email: string
  image?: string
  isVerified: boolean
  createdAt: string
  _count: {
    posts: number
    followers: number
    following: number
  }
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      username: '',
      bio: '',
      website: '',
      location: '',
      twitter: '',
      linkedin: '',
      github: '',
    },
  })

  useEffect(() => {
    async function fetchProfile() {
      if (!session?.user?.id) return

      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const profileData = await response.json()
          setProfile(profileData)
          
          // Update form with fetched data
          form.reset({
            name: profileData.name || '',
            username: profileData.username || '',
            bio: profileData.bio || '',
            website: profileData.website || '',
            location: profileData.location || '',
            twitter: profileData.twitter || '',
            linkedin: profileData.linkedin || '',
            github: profileData.github || '',
          })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [session?.user?.id, form])

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        
        // Update session if name changed
        if (data.name !== session?.user?.name && session) {
          await update({
            ...session,
            user: {
              ...session.user,
              name: data.name,
            },
          })
        }
        
        toast.success('Profile updated successfully')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your public profile</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="animate-pulse bg-gray-200 h-96 rounded"></div>
          <div className="lg:col-span-2 animate-pulse bg-gray-200 h-96 rounded"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your public profile</p>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Profile Not Found</h3>
              <p className="text-muted-foreground">Unable to load your profile information.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your public profile and personal information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Preview</CardTitle>
            <CardDescription>How others will see your profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.image || ''} alt={profile.name || ''} />
                  <AvatarFallback className="text-lg">
                    {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  disabled
                >
                  <Camera className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="text-center space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{profile.name}</h3>
                  {profile.isVerified && (
                    <Badge variant="secondary" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-sm text-center">{profile.bio}</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold">{profile._count.posts}</div>
                <div className="text-xs text-muted-foreground">Posts</div>
              </div>
              <div>
                <div className="text-xl font-bold">{profile._count.followers}</div>
                <div className="text-xs text-muted-foreground">Followers</div>
              </div>
              <div>
                <div className="text-xl font-bold">{profile._count.following}</div>
                <div className="text-xs text-muted-foreground">Following</div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-2 text-sm">
              {profile.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <Link 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {profile.website.replace(/^https?:\/\//, '')}
                  </Link>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {formatDistanceToNow(new Date(profile.createdAt))} ago</span>
              </div>
            </div>

            {/* Social Links */}
            {(profile.twitter || profile.linkedin || profile.github) && (
              <div className="flex gap-2">
                {profile.twitter && (
                  <Link
                    href={`https://twitter.com/${profile.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                  </Link>
                )}
                {profile.linkedin && (
                  <Link
                    href={`https://linkedin.com/in/${profile.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                  </Link>
                )}
                {profile.github && (
                  <Link
                    href={`https://github.com/${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Github className="h-4 w-4" />
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>
                Update your profile information and social links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      {...form.register('name')}
                      placeholder="Your display name"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                      <Input
                        id="username"
                        {...form.register('username')}
                        placeholder="username"
                        className="pl-8"
                      />
                    </div>
                    {form.formState.errors.username && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    {...form.register('bio')}
                    placeholder="Write a short bio..."
                    rows={3}
                  />
                  <div className="text-right text-xs text-muted-foreground">
                    {form.watch('bio')?.length || 0}/160
                  </div>
                  {form.formState.errors.bio && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.bio.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      {...form.register('website')}
                      placeholder="https://yourwebsite.com"
                    />
                    {form.formState.errors.website && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.website.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      {...form.register('location')}
                      placeholder="City, Country"
                    />
                    {form.formState.errors.location && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.location.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                      <Input
                        id="twitter"
                        {...form.register('twitter')}
                        placeholder="username"
                        className="pl-8"
                      />
                    </div>
                    {form.formState.errors.twitter && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.twitter.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      {...form.register('linkedin')}
                      placeholder="username"
                    />
                    {form.formState.errors.linkedin && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.linkedin.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub</Label>
                    <Input
                      id="github"
                      {...form.register('github')}
                      placeholder="username"
                    />
                    {form.formState.errors.github && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.github.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}