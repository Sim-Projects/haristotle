import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './db'
import { compare } from 'bcryptjs'
import { generateUniqueUsername } from './utils/username'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password || '')

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          username: user.username,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email },
          })

          const profileImage = (profile as any)?.picture || null
          const profileName = (profile as any)?.name || null

          // If user doesn't exist, create them with proper name and username
          if (!existingUser) {
            const username = await generateUniqueUsername(profileName || '', profile.email)
            
            await prisma.user.upsert({
              where: { email: profile.email },
              update: {
                name: profileName,
                image: profileImage,
              },
              create: {
                email: profile.email,
                name: profileName,
                username,
                image: profileImage,
                emailVerified: new Date(),
              },
            })
          } else if (!existingUser.name) {
            // Update existing OAuth user if they don't have a name
            const username = existingUser.username || await generateUniqueUsername(profileName || '', profile.email)
            
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: profileName,
                username,
                image: profileImage,
              },
            })
          }
        } catch (error) {
          console.error('Error in signIn callback:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        // For Google OAuth, fetch user from database
        const dbUser = await prisma.user.findUnique({
          where: { email: profile.email },
          select: { id: true, username: true, email: true, name: true, image: true }
        })
        
        if (dbUser) {
          token.id = dbUser.id
          token.username = dbUser.username
          token.email = dbUser.email
          token.name = dbUser.name
          token.picture = dbUser.image
        }
      } else if (user) {
        // For credentials login, user object should have the database ID
        token.id = user.id
        token.username = (user as any).username
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
      }
      return session
    },
  },
}