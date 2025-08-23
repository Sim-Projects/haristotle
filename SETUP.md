# Haristotle Setup Guide

Welcome to Haristotle! This guide will help you set up the blog platform locally and deploy it to production.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or external)
- Git

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd haristotle
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```bash
# Database - Replace with your PostgreSQL connection string
DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Image Upload (optional)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 3. Database Setup

Generate Prisma client and push the schema:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your blog platform!

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Database Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with initial data

## 🗄️ Database Configuration

### External PostgreSQL Providers

You can use any PostgreSQL provider. Here are some popular options:

#### Railway
1. Create a PostgreSQL database on [Railway](https://railway.app)
2. Copy the connection string to your `.env` file

#### Supabase
1. Create a project on [Supabase](https://supabase.com)
2. Get the connection string from Settings > Database
3. Add it to your `.env` file

#### Neon
1. Create a database on [Neon](https://neon.tech)
2. Copy the connection string to your `.env` file

### Local PostgreSQL

If you prefer to run PostgreSQL locally:

```bash
# Install PostgreSQL
brew install postgresql  # macOS
# or
sudo apt install postgresql  # Ubuntu

# Start PostgreSQL
brew services start postgresql  # macOS
# or
sudo service postgresql start  # Ubuntu

# Create database
createdb haristotle
```

Then use: `DATABASE_URL="postgresql://localhost:5432/haristotle"`

## 🔐 Authentication Setup

### Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

### NextAuth Secret

Generate a random secret:

```bash
openssl rand -base64 32
```

Add it to `.env` as `NEXTAUTH_SECRET`.

## 🎨 Customization

### Changing the Brand

1. Update the logo in `src/components/layout/header.tsx`
2. Modify the site name in `src/app/layout.tsx`
3. Update colors in `src/app/globals.css`

### Adding Custom Blocks to Editor

The BlockNote editor supports custom blocks. See the [BlockNote documentation](https://www.blocknotejs.org/docs/custom-blocks/introduction) for details.

### Styling

The project uses:
- Tailwind CSS for styling
- Shadcn UI for components
- CSS variables for theming

## 📝 Content Management

### Creating Your First Post

1. Sign up for an account
2. Click "Write" in the header
3. Use the Notion-like editor with slash commands
4. Save as draft or publish immediately

### Managing Categories and Tags

Categories and tags are automatically created when you assign them to posts. You can also seed them in `prisma/seed.ts`.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Railway
- Digital Ocean App Platform
- AWS Amplify
- Netlify

## 🛠️ Development

### Project Structure

```
haristotle/
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   │   ├── ui/             # Shadcn UI components
│   │   ├── editor/         # BlockNote editor components
│   │   └── layout/         # Layout components
│   ├── lib/                # Utility functions
│   └── types/              # TypeScript definitions
├── prisma/                 # Database schema and migrations
└── public/                 # Static assets
```

### Key Features Implemented

✅ **Core Features:**
- Notion-like editor with slash commands
- User authentication (email/password + Google OAuth)
- Article creation, editing, and publishing
- Category and tag system
- Responsive design
- SEO optimization

✅ **Advanced Features:**
- Auto-save drafts
- Reading time estimation
- Article views tracking
- Related articles
- Author profiles
- Social sharing buttons

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [BlockNote Documentation](https://www.blocknotejs.org/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com)
- [NextAuth.js Documentation](https://next-auth.js.org)

## 🐛 Troubleshooting

### Common Issues

1. **Database connection errors**: Verify your `DATABASE_URL` is correct
2. **Build errors**: Run `npm run type-check` to identify TypeScript issues
3. **Prisma errors**: Try `npm run db:generate` to regenerate the client
4. **Authentication issues**: Check `NEXTAUTH_SECRET` and OAuth credentials

### Getting Help

- Check the [project documentation](project.md)
- Review the [development guidelines](claude.md)
- Create an issue on GitHub
- Join our community discussions

## 🔄 Updates

To update dependencies:

```bash
npm update
npm run db:generate  # Regenerate Prisma client if needed
```

## 📄 License

This project is open source. Please check the LICENSE file for details.

---

Happy blogging with Haristotle! 🎉