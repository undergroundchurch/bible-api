import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateWithOpenRouter } from './ai.js'

describe('AI Library Tests', () => {
  // Note: These tests will only run if OPENROUTER_API_KEY is set in your environment
  const hasApiKey = !!process.env.OPENROUTER_API_KEY

  it('should generate text for a simple Bible-related prompt', async (t) => {
    if (!hasApiKey) {
      t.skip('Skipping: OPENROUTER_API_KEY not set')
      return
    }

    const prompt = 'What are the four gospels in the New Testament?'
    const result = await generateWithOpenRouter(prompt)

    assert.ok(result.text, 'Should return text')
    const lowerText = result.text.toLowerCase()
    assert.ok(lowerText.includes('matthew'), 'Should mention Matthew')
    assert.ok(lowerText.includes('mark'), 'Should mention Mark')
    assert.ok(lowerText.includes('luke'), 'Should mention Luke')
    assert.ok(lowerText.includes('john'), 'Should mention John')
  })

  it('should handle theological analysis prompts', async (t) => {
    if (!hasApiKey) {
      t.skip('Skipping: OPENROUTER_API_KEY not set')
      return
    }

    const prompt =
      'Briefly explain the "Synoptic Problem" in relation to Matthew, Mark, and Luke.'
    const result = await generateWithOpenRouter(prompt)

    assert.ok(result.text, 'Should return text')
    assert.ok(result.text.length > 50, 'Response should be substantial')
  })

  it('should handle Greek word studies', async (t) => {
    if (!hasApiKey) {
      t.skip('Skipping: OPENROUTER_API_KEY not set')
      return
    }

    const prompt =
      'Analyze the usage of the Greek word "δικαιοσύνη" (dikaiosyne) in the Gospel of Matthew.'
    const result = await generateWithOpenRouter(prompt)

    assert.ok(result.text, 'Should return text')
    assert.ok(
      result.text.toLowerCase().includes('righteousness'),
      'Should mention righteousness'
    )
  })

  it('should accept custom options like model and temperature', async (t) => {
    if (!hasApiKey) {
      t.skip('Skipping: OPENROUTER_API_KEY not set')
      return
    }

    const prompt = 'Write a one-sentence summary of the Gospel of John.'
    const result = await generateWithOpenRouter(prompt, {
      model: 'google/gemini-2.0-flash-exp',
      temperature: 0.7,
      maxTokens: 100,
    })

    assert.ok(result.text, 'Should return text')
  })
})
