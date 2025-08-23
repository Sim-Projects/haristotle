'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Eye, Heart, Edit } from 'lucide-react'

interface DashboardStatsProps {
  stats: {
    total: number
    published: number
    drafts: number
    views: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: 'Total Posts',
      value: stats.total,
      icon: FileText,
      description: 'All your posts',
      color: 'text-blue-600',
    },
    {
      title: 'Published',
      value: stats.published,
      icon: Eye,
      description: 'Live posts',
      color: 'text-green-600',
    },
    {
      title: 'Drafts',
      value: stats.drafts,
      icon: Edit,
      description: 'Work in progress',
      color: 'text-yellow-600',
    },
    {
      title: 'Total Views',
      value: stats.views,
      icon: Heart,
      description: 'Across all posts',
      color: 'text-red-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}