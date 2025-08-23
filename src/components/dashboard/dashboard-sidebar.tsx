'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  FileText, 
  PenTool, 
  Settings, 
  User,
  Home,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

const sidebarItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'All Posts',
    href: '/dashboard?filter=all',
    icon: FileText,
  },
  {
    title: 'Drafts',
    href: '/dashboard?filter=drafts',
    icon: PenTool,
  },
  {
    title: 'Published',
    href: '/dashboard?filter=published',
    icon: FileText,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Profile',
    href: '/dashboard/profile',
    icon: User,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function DashboardSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter')

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' && !filter
    }
    if (href.includes('filter=')) {
      const hrefFilter = href.split('filter=')[1]
      return pathname === '/dashboard' && filter === hrefFilter
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-16 left-4 z-40 lg:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <Menu className="h-4 w-4" />
        )}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-14 left-0 z-30 h-[calc(100vh-3.5rem)] w-64 transform bg-background border-r transition-transform duration-200 ease-in-out lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6">
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const isItemActive = isActive(item.href)
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isItemActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.title}
                  {item.title === 'Drafts' && (
                    <Badge variant="secondary" className="ml-auto">
                      New
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="mt-8 pt-8 border-t">
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/write">
                  <PenTool className="mr-2 h-4 w-4" />
                  New Post
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  View Site
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}