# Claude.md - Development Guidelines for Haristotle

## Project Context

Haristotle is a Medium-like blog platform with a Notion-style editor. This document contains essential information for Claude Code to assist with development effectively.

## Tech Stack Overview

### Core Technologies
- **Next.js 14** with App Router and TypeScript
- **Shadcn UI** with Tailwind CSS for styling
- **BlockNote** for the rich text editor
- **Prisma ORM** with PostgreSQL database
- **NextAuth.js** for authentication

### Key Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0",
    "@blocknote/core": "latest",
    "@blocknote/react": "latest",
    "prisma": "latest",
    "@prisma/client": "latest",
    "next-auth": "latest",
    "tailwindcss": "latest",
    "@radix-ui/react-*": "latest",
    "zod": "latest",
    "react-hook-form": "latest"
  }
}
```

## Development Commands

### Setup Commands
```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# Setup Shadcn UI
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input textarea card dialog

# Development server
npm run dev
```

### Database Commands
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Create migration
npx prisma migrate dev --name migration_name

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset
```

### Build Commands
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Code Style & Conventions

### File Naming
- **Components**: PascalCase (`ArticleCard.tsx`)
- **Pages**: lowercase with hyphens (`write-article.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types**: PascalCase (`User.ts`, `Post.ts`)

### Import Order
```typescript
// 1. React and Next.js imports
import React from 'react'
import { NextPage } from 'next'
import Link from 'next/link'

// 2. Third-party library imports
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// 3. Internal imports (absolute)
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/db'

// 4. Relative imports
import './styles.css'
```

### Component Structure
```typescript
// Component interface
interface ComponentProps {
  title: string
  children?: React.ReactNode
}

// Component implementation
export function Component({ title, children }: ComponentProps) {
  // Hooks first
  const [state, setState] = useState()
  const { data, error } = useQuery()

  // Event handlers
  const handleClick = () => {
    // Implementation
  }

  // Early returns
  if (error) return <div>Error</div>

  // Main render
  return (
    <div className="space-y-4">
      <h1>{title}</h1>
      {children}
    </div>
  )
}
```

## Prisma Best Practices

### Schema Conventions
```prisma
model User {
  // Use cuid() for IDs
  id        String   @id @default(cuid())
  
  // Use snake_case for database table names
  @@map("users")
  
  // Index frequently queried fields
  email     String   @unique
  username  String?  @unique
  
  // Use DateTime for timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  posts     Post[]
}
```

### Query Patterns
```typescript
// Always use select or include to optimize queries
const posts = await prisma.post.findMany({
  select: {
    id: true,
    title: true,
    author: {
      select: {
        name: true,
        username: true,
      },
    },
  },
})

// Use transactions for related operations
const createPostWithTags = await prisma.$transaction(async (tx) => {
  const post = await tx.post.create({ data: postData })
  await tx.tagOnPost.createMany({
    data: tags.map(tagId => ({ postId: post.id, tagId })),
  })
  return post
})
```

## Next.js App Router Patterns

### Page Structure
```typescript
// app/blog/[slug]/page.tsx
interface PageProps {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function PostPage({ params }: PageProps) {
  const post = await getPost(params.slug)
  
  if (!post) {
    notFound()
  }

  return <PostContent post={post} />
}

// Generate metadata
export async function generateMetadata({ params }: PageProps) {
  const post = await getPost(params.slug)
  
  return {
    title: post?.title,
    description: post?.excerpt,
  }
}
```

### API Route Patterns
```typescript
// app/api/posts/route.ts
export async function GET(request: Request) {
  try {
    const posts = await prisma.post.findMany()
    return NextResponse.json(posts)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = postSchema.parse(body)
    
    const post = await prisma.post.create({
      data: validatedData,
    })
    
    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

## BlockNote Editor Integration

### Basic Setup
```typescript
import { BlockNoteEditor, PartialBlock } from "@blocknote/core"
import { BlockNoteView, useBlockNote } from "@blocknote/react"
import "@blocknote/core/style.css"

export function Editor({ initialContent, onChange }) {
  const editor: BlockNoteEditor = useBlockNote({
    initialContent: initialContent ? JSON.parse(initialContent) : undefined,
    onEditorContentChange: (editor) => {
      onChange(JSON.stringify(editor.topLevelBlocks))
    },
  })

  return <BlockNoteView editor={editor} />
}
```

### Custom Blocks
```typescript
// Create custom block types
const customBlocks = {
  callout: {
    type: "callout",
    propSchema: {
      type: {
        default: "info",
        values: ["info", "warning", "error", "success"],
      },
    },
    content: "inline",
  },
}

const editor = useBlockNote({
  blockSpecs: customBlocks,
})
```

## Authentication Patterns

### NextAuth.js Configuration
```typescript
// lib/auth.ts
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
})
```

### Protected Routes
```typescript
// middleware.ts
import { auth } from "@/lib/auth"

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith("/dashboard")) {
    return Response.redirect(new URL("/login", req.url))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

## Form Handling with React Hook Form + Zod

### Schema Definition
```typescript
// lib/validations/post.ts
import { z } from "zod"

export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  tags: z.array(z.string().cuid()).default([]),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
```

### Form Implementation
```typescript
export function CreatePostForm() {
  const form = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      status: "DRAFT",
      tags: [],
    },
  })

  const onSubmit = async (data: CreatePostInput) => {
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error("Failed to create post")
      
      const post = await response.json()
      router.push(`/dashboard/posts/${post.id}`)
    } catch (error) {
      toast.error("Failed to create post")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
```

## Shadcn UI Component Usage

### Common Patterns
```typescript
// Button variants
<Button variant="default" size="md">Default</Button>
<Button variant="outline" size="sm">Outline</Button>
<Button variant="ghost" size="lg">Ghost</Button>

// Cards for content display
<Card>
  <CardHeader>
    <CardTitle>Article Title</CardTitle>
    <CardDescription>Article description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Article content</p>
  </CardContent>
  <CardFooter>
    <Button>Read More</Button>
  </CardFooter>
</Card>

// Dialogs for modals
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <div>Content</div>
    <DialogFooter>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Performance Optimization

### Image Optimization
```typescript
import Image from "next/image"

// Always use Next.js Image component
<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={400}
  height={300}
  className="rounded-lg"
  priority={false} // Set to true for above-the-fold images
/>
```

### Loading States
```typescript
import { Skeleton } from "@/components/ui/skeleton"

function ArticleCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  )
}
```

## Environment Variables

### Required Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/haristotle"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

## Common Issues & Solutions

### Issue: Hydration Errors
**Solution**: Use `useEffect` for client-only code or `suppressHydrationWarning`

### Issue: Prisma Client Not Found
**Solution**: Run `npx prisma generate` after schema changes

### Issue: Authentication Not Working
**Solution**: Check environment variables and ensure NextAuth secret is set

### Issue: Editor Content Not Saving
**Solution**: Ensure BlockNote onChange callback is properly connected

## Testing Guidelines

### Unit Tests
```typescript
// components/__tests__/ArticleCard.test.tsx
import { render, screen } from '@testing-library/react'
import { ArticleCard } from '../ArticleCard'

describe('ArticleCard', () => {
  it('renders article title', () => {
    const mockPost = {
      id: '1',
      title: 'Test Article',
      excerpt: 'Test excerpt',
    }

    render(<ArticleCard post={mockPost} />)
    
    expect(screen.getByText('Test Article')).toBeInTheDocument()
  })
})
```

### API Tests
```typescript
// __tests__/api/posts.test.ts
import { GET } from '@/app/api/posts/route'

describe('/api/posts', () => {
  it('returns list of posts', async () => {
    const request = new Request('http://localhost:3000/api/posts')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
  })
})
```

## Deployment Checklist

### Pre-deployment
- [ ] Run type checking: `npm run type-check`
- [ ] Run linting: `npm run lint`
- [ ] Run tests: `npm test`
- [ ] Build locally: `npm run build`
- [ ] Check environment variables
- [ ] Database migrations applied
- [ ] Image optimization configured

### Production Environment
- [ ] Database connection string updated
- [ ] OAuth redirect URLs configured
- [ ] CDN configured for images
- [ ] Analytics tracking added
- [ ] Error monitoring setup
- [ ] Performance monitoring enabled

This document should be referenced whenever working on the Haristotle project to maintain consistency and best practices.