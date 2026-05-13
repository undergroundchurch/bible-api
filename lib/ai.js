import { createOpenAI } from '@ai-sdk/openai'

// OpenRouter uses OpenAI-compatible API
const apiKey =
  process.env.OPENROUTER_API_KEY ||
  (typeof import.meta.env !== 'undefined'
    ? import.meta.env.OPENROUTER_API_KEY
    : undefined)
const siteUrl =
  process.env.SITE_URL ||
  (typeof import.meta.env !== 'undefined'
    ? import.meta.env.SITE_URL
    : 'http://localhost:5173')
const siteName =
  process.env.SITE_NAME ||
  (typeof import.meta.env !== 'undefined'
    ? import.meta.env.SITE_NAME
    : 'Fourfold Gospel App')

export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey,
  headers: {
    'HTTP-Referer': siteUrl,
    'X-Title': siteName,
  },
})

// Helper to generate text with OpenRouter
export async function generateWithOpenRouter(prompt, options = {}) {
  const { generateText } = await import('ai')

  return generateText({
    model: openrouter(options.model || 'google/gemini-2.0-flash-exp'),
    prompt,
    ...options,
  })
}
