'use client'

import { ReactNode } from 'react'
import { Header } from '@/components/layout/header'
import { AuthRequired } from '@/components/auth/auth-required'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen">
      <Header />
      <AuthRequired 
        title="Sign in to access your dashboard"
        description="Sign in to manage your posts, view analytics, and access your writer dashboard."
        callbackUrl="/dashboard"
      >
        <div className="flex">
          <DashboardSidebar />
          <main className="flex-1 lg:ml-64">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </AuthRequired>
    </div>
  )
}