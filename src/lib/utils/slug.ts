/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by checking against existing slugs
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = generateSlug(baseSlug)
  let counter = 1

  while (await checkExists(slug)) {
    slug = `${generateSlug(baseSlug)}-${counter}`
    counter++
  }

  return slug
}

/**
 * Extract reading time from content (rough estimation)
 */
export function calculateReadingTime(content: any): number {
  // Extract text from BlockNote content
  let textContent = ''
  
  if (Array.isArray(content)) {
    textContent = content
      .map((block: any) => {
        if (block.content && Array.isArray(block.content)) {
          return block.content
            .map((item: any) => item.text || '')
            .join(' ')
        }
        return block.text || ''
      })
      .join(' ')
  }

  // Rough calculation: average reading speed is 200-250 words per minute
  const wordsPerMinute = 200
  const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length
  const readingTime = Math.ceil(wordCount / wordsPerMinute)

  return readingTime || 1 // Minimum 1 minute
}

/**
 * Extract text excerpt from BlockNote content
 */
export function extractExcerpt(content: any, maxLength: number = 200): string {
  let textContent = ''
  
  if (Array.isArray(content)) {
    textContent = content
      .map((block: any) => {
        if (block.content && Array.isArray(block.content)) {
          return block.content
            .map((item: any) => item.text || '')
            .join(' ')
        }
        return block.text || ''
      })
      .join(' ')
  }

  if (textContent.length <= maxLength) {
    return textContent
  }

  return textContent.slice(0, maxLength).replace(/\s+\S*$/, '') + '...'
}