import { z } from 'zod'

export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  content: z.any(), // BlockNote content as JSON
  excerpt: z.string().max(500, 'Excerpt must be at most 500 characters').optional(),
  featuredImage: z.string().url().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'PRIVATE']).default('DRAFT'),
  categoryIds: z.array(z.string().cuid()).default([]),
  tagIds: z.array(z.string().cuid()).default([]),
})

export const updatePostSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters').optional(),
  content: z.any().optional(), // BlockNote content as JSON
  excerpt: z.string().max(500, 'Excerpt must be at most 500 characters').optional(),
  featuredImage: z.string().url().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'PRIVATE']).optional(),
  categoryIds: z.array(z.string().cuid()).optional(),
  tagIds: z.array(z.string().cuid()).optional(),
})

export const publishPostSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Title is required'),
  content: z.any(), // BlockNote content as JSON
  excerpt: z.string().optional(),
  featuredImage: z.string().url().optional(),
  categoryIds: z.array(z.string().cuid()).default([]),
  tagIds: z.array(z.string().cuid()).default([]),
})

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment must be at most 1000 characters'),
  postId: z.string().cuid(),
  parentId: z.string().cuid().optional(),
})

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Category name must be at most 50 characters'),
  description: z.string().max(200, 'Description must be at most 200 characters').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
})

export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(30, 'Tag name must be at most 30 characters'),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type PublishPostInput = z.infer<typeof publishPostSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type CreateTagInput = z.infer<typeof createTagSchema>