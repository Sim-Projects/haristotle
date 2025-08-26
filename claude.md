# Claude Code Instructions - Haristotle Project

## Project Context & Goals

Haristotle is a Medium-like blogging platform featuring:
- Rich text editing with Notion-style interface
- Sim component for adding react simulations created using AI
- User authentication and profiles
- Article publishing and management
- Dashboard analytics
- Category and tag organization

## Your Role & Capabilities

As Claude Code, you should:
1. Provide technical assistance for the codebase
2. Suggest improvements while maintaining project conventions
3. Help debug issues and optimize performance
4. Guide users through implementing new features
5. Review and validate code changes

## Technical Stack

### Core Technologies
- Frontend: Next.js 14 (App Router), TypeScript, React
- UI: Shadcn UI, Tailwind CSS
- Database: PostgreSQL with Prisma ORM
- Authentication: NextAuth.js
- Editor: BlockNote

### Key Dependencies
- React Hook Form + Zod for form handling
- Next.js Image for optimized images
- Radix UI primitives via Shadcn

## Code Standards

### File Organization
```
src/
  app/           # Next.js App Router pages
  components/    # Reusable React components
  lib/          # Utilities and configurations
  types/        # TypeScript type definitions
```

### Naming Conventions
- Components: PascalCase (e.g., `ArticleCard.tsx`)
- Pages: kebab-case (e.g., `edit-profile.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Types/Interfaces: PascalCase (e.g., `UserProfile.ts`)

### Code Style
- Use TypeScript strictly
- Implement proper error handling
- Write meaningful comments
- Follow React best practices

## Common Tasks & Solutions

### Database Operations
```typescript
// Example of proper Prisma query
const posts = await prisma.post.findMany({
  select: {
    id: true,
    title: true,
    author: { select: { name: true } }
  }
});
```

### Authentication Flow
```typescript
// Protected API route example
export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  // Handle authenticated request
}
```

### Form Implementation
```typescript
// Form with validation
const postSchema = z.object({
  title: z.string().min(1, "Title required"),
  content: z.string().min(10, "Content too short")
});
```

## Error Handling & Debugging

### Common Issues
1. Authentication errors
   - Verify environment variables
   - Check session handling
   
2. Database connectivity
   - Confirm Prisma schema
   - Validate connection string

3. UI rendering
   - Handle loading states
   - Implement error boundaries

### Best Practices
- Log errors appropriately
- Provide helpful error messages
- Implement proper fallbacks
- Use try-catch blocks

## Performance Guidelines

### Optimization Techniques
1. Image optimization
   - Use Next.js Image component
   - Implement lazy loading
   
2. Data fetching
   - Implement caching
   - Use proper loading states
   
3. Code splitting
   - Lazy load components
   - Use dynamic imports

## Testing Requirements

### Unit Tests
- Test components in isolation
- Verify business logic
- Check error handling

### Integration Tests
- Test API endpoints
- Verify data flow
- Check authentication

## Security Considerations

### Key Areas
1. Input validation
2. Authentication flows
3. API route protection
4. Data sanitization

## Environment Configuration

### Required Variables
```bash
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Deployment Process

### Pre-deployment Checklist
1. Run type checking
2. Execute test suite
3. Build application
4. Verify environment variables

## Support & Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- NextAuth: https://next-auth.js.org
- Shadcn UI: https://ui.shadcn.com

### Tools
- VS Code with recommended extensions
- Prisma Studio for database management
- Next.js development tools