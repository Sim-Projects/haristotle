'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Settings, 
  Shield, 
  Bell, 
  Mail, 
  Lock, 
  Trash2, 
  Download,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [publicProfile, setPublicProfile] = useState(true)
  const [showEmail, setShowEmail] = useState(false)
  const [showActivity, setShowActivity] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSavePreferences = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Preferences saved successfully')
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      toast.info('Preparing your data export...')
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Data export will be sent to your email')
    } catch (error) {
      toast.error('Failed to export data')
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // This would call a delete account API
      toast.error('Account deletion is not implemented in this demo')
    } catch (error) {
      toast.error('Failed to delete account')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and privacy settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Basic information about your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={session?.user?.email || ''}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email address
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Account Status</Label>
                  <div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control who can see your information and activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="public-profile">Public Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible to other users
                  </p>
                </div>
                <Switch
                  id="public-profile"
                  checked={publicProfile}
                  onCheckedChange={setPublicProfile}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="show-email">Show Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your email address on your public profile
                  </p>
                </div>
                <Switch
                  id="show-email"
                  checked={showEmail}
                  onCheckedChange={setShowEmail}
                  disabled={!publicProfile}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="show-activity">Show Activity</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your reading and writing activity
                  </p>
                </div>
                <Switch
                  id="show-activity"
                  checked={showActivity}
                  onCheckedChange={setShowActivity}
                  disabled={!publicProfile}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about your posts and interactions
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="marketing-emails">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about new features and updates
                  </p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={marketingEmails}
                  onCheckedChange={setMarketingEmails}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSavePreferences} disabled={loading}>
              {loading ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <Lock className="mr-2 h-4 w-4" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Two-Factor Auth
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Eye className="mr-2 h-4 w-4" />
                Active Sessions
              </Button>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <Download className="mr-2 h-4 w-4" />
                Data & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={handleExportData}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Download Archive
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center text-sm text-destructive">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <EyeOff className="mr-2 h-4 w-4" />
                Deactivate Account
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}