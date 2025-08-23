import { prisma } from '@/lib/db'

export function generateUsernameFromName(name: string): string {
  // Remove special characters and spaces, convert to lowercase
  const baseUsername = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15) // Limit to 15 chars to allow for suffix
    
  return baseUsername || 'user'
}

export function generateUsernameFromEmail(email: string): string {
  // Extract username part from email
  const emailUsername = email.split('@')[0]
  return generateUsernameFromName(emailUsername)
}

export async function generateUniqueUsername(baseName: string, email?: string): Promise<string> {
  // Try to generate from name first, then email if no name
  let baseUsername = baseName 
    ? generateUsernameFromName(baseName)
    : email 
      ? generateUsernameFromEmail(email) 
      : 'user'

  // Check if base username is available
  const existingUser = await prisma.user.findUnique({
    where: { username: baseUsername },
  })

  if (!existingUser) {
    return baseUsername
  }

  // If taken, try with numbers
  let counter = 1
  let username = `${baseUsername}${counter}`

  while (await prisma.user.findUnique({ where: { username } })) {
    counter++
    username = `${baseUsername}${counter}`
    
    // Prevent infinite loop
    if (counter > 9999) {
      username = `${baseUsername}${Date.now()}`
      break
    }
  }

  return username
}