'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Globe, 
  Archive, 
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Post {
  id: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'PRIVATE'
  createdAt: string
  updatedAt: string
  viewCount: number
  likesCount: number
  publishedAt?: string
  draftContent?: {
    title: string
    content: any
    updatedAt: string
  }
  publishedContent?: {
    title: string
    content: any
    publishedAt: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface PostsTableProps {
  posts: Post[]
  onUpdate: () => void
  pagination?: Pagination
  onPageChange?: (page: number) => void
}

const statusColors = {
  DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  PRIVATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
}

export function PostsTable({ posts, onUpdate, pagination, onPageChange }: PostsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [deletePost, setDeletePost] = useState<Post | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredPosts = posts.filter(post => {
    const title = post.draftContent?.title || post.publishedContent?.title || 'Untitled'
    return title.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleDelete = async (postId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Post deleted successfully')
        onUpdate()
      } else {
        toast.error('Failed to delete post')
      }
    } catch (error) {
      toast.error('Error deleting post')
    } finally {
      setIsDeleting(false)
      setDeletePost(null)
    }
  }

  const handleStatusChange = async (postId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success(`Post ${newStatus.toLowerCase()} successfully`)
        onUpdate()
      } else {
        toast.error('Failed to update post')
      }
    } catch (error) {
      toast.error('Error updating post')
    }
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">
          <Edit className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium">No posts yet</h3>
          <p className="text-sm">Start writing your first post to see it here.</p>
        </div>
        <Button asChild>
          <Link href="/write">Create Your First Post</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search posts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title & Status</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Likes</TableHead>
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.map((post) => {
              const hasPublished = !!post.publishedContent
              const hasDraft = !!post.draftContent
              const displayTitle = post.draftContent?.title || post.publishedContent?.title || 'Untitled'
              
              return (
                <React.Fragment key={post.id}>
                  {/* Published Version Row */}
                  {hasPublished && (
                    <TableRow className="border-b-0">
                      <TableCell rowSpan={hasPublished && hasDraft ? 2 : 1}>
                        <span className="text-xs font-mono text-muted-foreground">
                          ...{post.id.slice(-8)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <a 
                            href={`/${post.slug}`}
                            className="font-medium hover:underline"
                          >
                            {post.publishedContent?.title || post.draftContent?.title || 'Untitled'}
                          </a>
                          <Badge 
                            variant="secondary" 
                            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs"
                          >
                            Published
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Published {formatDistanceToNow(new Date(post.publishedContent?.publishedAt || post.publishedAt || new Date()), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell rowSpan={hasPublished && hasDraft ? 2 : 1}>
                        {post.viewCount}
                      </TableCell>
                      <TableCell rowSpan={hasPublished && hasDraft ? 2 : 1}>
                        {post.likesCount}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/${post.slug}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Published
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/write/${post.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {/* Draft Version Row */}
                  {hasDraft && (
                    <TableRow className={hasPublished ? "border-t-0 bg-gray-50/50" : ""}>
                      {!hasPublished && (
                        <TableCell>
                          <span className="text-xs font-mono text-muted-foreground">
                            ...{post.id.slice(-8)}
                          </span>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <a 
                            href={`/write/${post.id}`}
                            className="font-medium hover:underline"
                          >
                            {post.draftContent?.title || 'Untitled'}
                          </a>
                          <Badge 
                            variant="secondary" 
                            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 text-xs"
                          >
                            Draft
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center space-x-4">
                          <span>Modified {formatDistanceToNow(new Date(post.draftContent?.updatedAt || post.updatedAt), { addSuffix: true })}</span>
                          <Button
                            variant="link" 
                            size="sm"
                            className="h-auto p-0 text-red-600 hover:text-red-700"
                            onClick={async () => {
                              if (confirm('Discard draft changes?')) {
                                try {
                                  await fetch(`/api/posts/${post.id}/discard-draft`, { method: 'DELETE' })
                                  toast.success('Draft discarded')
                                  onUpdate()
                                } catch {
                                  toast.error('Failed to discard draft')
                                }
                              }
                            }}
                          >
                            Discard Draft
                          </Button>
                        </div>
                      </TableCell>
                      {!hasPublished && (
                        <>
                          <TableCell>{post.viewCount}</TableCell>
                          <TableCell>{post.likesCount}</TableCell>
                        </>
                      )}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/write/${post.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Draft
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/preview/${post.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Preview Draft
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  await fetch(`/api/posts/${post.id}/publish`, { method: 'POST' })
                                  toast.success('Post published!')
                                  onUpdate()
                                } catch {
                                  toast.error('Failed to publish')
                                }
                              }}
                            >
                              <Globe className="mr-2 h-4 w-4" />
                              Publish
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Empty state - no content */}
                  {!hasPublished && !hasDraft && (
                    <TableRow>
                      <TableCell>
                        <span className="text-xs font-mono text-muted-foreground">
                          ...{post.id.slice(-8)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-muted-foreground">Untitled</span>
                          <Badge variant="secondary" className="text-xs">
                            Empty
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{post.viewCount}</TableCell>
                      <TableCell>{post.likesCount}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/write/${post.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {filteredPosts.length === 0 && searchTerm && (
        <div className="text-center py-8 text-muted-foreground">
          No posts found matching "{searchTerm}"
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} posts
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                let pageNum
                if (pagination.pages <= 5) {
                  pageNum = i + 1
                } else if (pagination.page <= 3) {
                  pageNum = i + 1
                } else if (pagination.page >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i
                } else {
                  pageNum = pagination.page - 2 + i
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => onPageChange && onPageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletePost?.draftContent?.title || deletePost?.publishedContent?.title || 'Untitled'}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePost && handleDelete(deletePost.id)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}