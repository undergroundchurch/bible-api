import { createOpenAI } from '@ai-sdk/openai'

// OpenRouter uses OpenAI-compatible API
export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': import.meta.env.VITE_SITE_URL || 'http://localhost:5173',
    'X-Title': import.meta.env.VITE_SITE_NAME || 'Fourfold Gospel App',
  },
})

// Helper to generate text with OpenRouter
export async function generateWithOpenRouter(prompt, options = {}) {
  const { generateText } = await import('ai')

  return generateText({
    model: openrouter(options.model || 'anthropic/claude-sonnet-4'),
    prompt,
    ...options,
  })
}
