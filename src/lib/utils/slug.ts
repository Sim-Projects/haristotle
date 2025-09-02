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