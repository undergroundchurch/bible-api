const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const ComputeStatisticsWorker = require('./ComputeStatistics')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal section with gospel passages */
function makeSection(id, title, passages) {
  return { id, title, passages }
}

/** Build a passage for a single gospel */
function makePassage(gospel, verses) {
  return { gospel, verses }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const GREEK_SECTION = makeSection('section-1', 'The paralyzed man', [
  makePassage('matthew', [
    { verse: 1, text: 'ἐλθὼν εἰς τὴν οἰκίαν αὐτοῦ' },
    { verse: 2, text: 'καὶ εἶπεν αὐτοῖς' },
  ]),
  makePassage('mark', [
    { verse: 1, text: 'εἰς τὴν οἰκίαν' },
    { verse: 2, text: 'καὶ εἶπεν αὐτοῖς ὅτι' },
  ]),
  makePassage('luke', [
    { verse: 1, text: 'ἐλθὼν εἰς τὴν πόλιν' },
    { verse: 2, text: 'καὶ εἶπεν αὐτοῖς λέγων' },
  ]),
])

const IDENTICAL_SECTION = makeSection('section-id', 'Identical gospels', [
  makePassage('matthew', [
    { verse: 1, text: 'alpha beta gamma delta epsilon' },
  ]),
  makePassage('mark', [
    { verse: 1, text: 'alpha beta gamma delta epsilon' },
  ]),
])

const DISJOINT_SECTION = makeSection('section-dis', 'No overlap', [
  makePassage('matthew', [
    { verse: 1, text: 'alpha beta gamma' },
  ]),
  makePassage('mark', [
    { verse: 1, text: 'one two three' },
  ]),
])

const FOUR_GOSPEL_SECTION = makeSection('section-4', 'Four gospels', [
  makePassage('matthew', [
    { verse: 1, text: 'alpha beta gamma delta' },
  ]),
  makePassage('mark', [
    { verse: 1, text: 'alpha beta gamma delta' },
  ]),
  makePassage('luke', [
    { verse: 1, text: 'alpha beta gamma delta' },
  ]),
  makePassage('john', [
    { verse: 1, text: 'alpha beta gamma delta' },
  ]),
])

const RELAXED_SECTION = makeSection('section-relax', 'Relaxed mode test', [
  makePassage('matthew', [
    { verse: 1, text: 'hello world testing data' },
  ]),
  makePassage('mark', [
    { verse: 1, text: 'hallo world tasting data' },
  ]),
])

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ComputeStatisticsWorker.perform', () => {
  // ── Basic contract ──────────────────────────────────────────────────────

  it('returns an array', () => {
    const result = ComputeStatisticsWorker.perform({ verses: [] })
    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  it('handles missing / undefined verses gracefully', () => {
    const result = ComputeStatisticsWorker.perform({})
    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  it('returns one result object per section', () => {
    const result = ComputeStatisticsWorker.perform({
      verses: [GREEK_SECTION, IDENTICAL_SECTION],
    })
    assert.equal(result.length, 2)
  })

  // ── Output schema ──────────────────────────────────────────────────────

  it('each result has the documented top-level keys', () => {
    const [r] = ComputeStatisticsWorker.perform({ verses: [GREEK_SECTION] })
    assert.ok('sectionId' in r)
    assert.ok('sectionTitle' in r)
    assert.ok('totalWords' in r)
    assert.ok('summary' in r)
    assert.ok('pairs' in r)
    assert.ok('mode' in r)
  })

  it('preserves sectionId and sectionTitle from input', () => {
    const [r] = ComputeStatisticsWorker.perform({ verses: [GREEK_SECTION] })
    assert.equal(r.sectionId, 'section-1')
    assert.equal(r.sectionTitle, 'The paralyzed man')
  })

  it('mode defaults to "exact"', () => {
    const [r] = ComputeStatisticsWorker.perform({ verses: [GREEK_SECTION] })
    assert.equal(r.mode, 'exact')
  })

  it('totalWords counts per gospel', () => {
    const [r] = ComputeStatisticsWorker.perform({ verses: [IDENTICAL_SECTION] })
    assert.equal(r.totalWords.matthew, 5)
    assert.equal(r.totalWords.mark, 5)
  })

  // ── Pair keys ──────────────────────────────────────────────────────────

  it('generates correct pair keys for 2 gospels', () => {
    const [r] = ComputeStatisticsWorker.perform({ verses: [IDENTICAL_SECTION] })
    const pairKeys = Object.keys(r.pairs)
    assert.deepEqual(pairKeys, ['matthew-mark'])
  })

  it('generates correct pair keys for 3 gospels', () => {
    const [r] = ComputeStatisticsWorker.perform({ verses: [GREEK_SECTION] })
    const pairKeys = Object.keys(r.pairs).sort()
    assert.deepEqual(pairKeys, ['mark-luke', 'matthew-luke', 'matthew-mark'])
  })

  it('generates all 6 pair keys for 4 gospels', () => {
    const [r] = ComputeStatisticsWorker.perform({ verses: [FOUR_GOSPEL_SECTION] })
    const pairKeys = Object.keys(r.pairs).sort()
    assert.deepEqual(pairKeys, [
      'luke-john', 'mark-john', 'mark-luke',
      'matthew-john', 'matthew-luke', 'matthew-mark',
    ])
  })

  // ── Pair structure ─────────────────────────────────────────────────────

  it('each pair has count, totalWords, sequences, matchPercentage', () => {
    const [r] = ComputeStatisticsWorker.perform({ verses: [IDENTICAL_SECTION] })
    const pair = r.pairs['matthew-mark']
    assert.ok('count' in pair)
    assert.ok('totalWords' in pair)
    assert.ok('sequences' in pair)
    assert.ok('matchPercentage' in pair)
    assert.ok(Array.isArray(pair.sequences))
  })

  it('matchPercentage keys match the two gospels in the pair', () => {
    const [r] = ComputeStatisticsWorker.perform({ verses: [IDENTICAL_SECTION] })
    const pair = r.pairs['matthew-mark']
    assert.ok('matthew' in pair.matchPercentage)
    assert.ok('mark' in pair.matchPercentage)
  })

  // ── Sequence structure ─────────────────────────────────────────────────

  it('each sequence has words, length, start1, start2, verse1, verse2', () => {
    const [r] = ComputeStatisticsWorker.perform({ verses: [IDENTICAL_SECTION] })
    const seq = r.pairs['matthew-mark'].sequences[0]
    assert.ok(Array.isArray(seq.words))
    assert.ok(typeof seq.length === 'number')
    assert.ok(typeof seq.start1 === 'number')
    assert.ok(typeof seq.start2 === 'number')
    assert.ok(typeof seq.verse1 === 'number')
    assert.ok(typeof seq.verse2 === 'number')
  })

  // ── Exact matching logic ───────────────────────────────────────────────

  it('identical texts produce matches', () => {
    const [r] = ComputeStatisticsWorker.perform({ verses: [IDENTICAL_SECTION] })
    const pair = r.pairs['matthew-mark']
    assert.ok(pair.count > 0, 'Expected at least one matching sequence')
    assert.ok(pair.totalWords > 0)
  })

  it('longest match on identical texts spans the full length', () => {
    const [r] = ComputeStatisticsWorker.perform({ verses: [IDENTICAL_SECTION] })
    const pair = r.pairs['matthew-mark']
    const maxLen = Math.max(...pair.sequences.map(s => s.length))
    assert.equal(maxLen, 5, 'Full 5-word text should be matched')
  })

  it('completely disjoint texts produce zero matches', () => {
    const [r] = ComputeStatisticsWorker.perform({ verses: [DISJOINT_SECTION] })
    const pair = r.pairs['matthew-mark']
    assert.equal(pair.count, 0)
    assert.equal(pair.totalWords, 0)
    assert.equal(pair.sequences.length, 0)
  })

  it('respects minLength parameter', () => {
    const [r3] = ComputeStatisticsWorker.perform({
      verses: [IDENTICAL_SECTION],
      minLength: 3,
    })
    const [r5] = ComputeStatisticsWorker.perform({
      verses: [IDENTICAL_SECTION],
      minLength: 5,
    })

    // With minLength=5, only the full 5-word match survives
    assert.ok(r3.pairs['matthew-mark'].count >= r5.pairs['matthew-mark'].count,
      'Higher minLength should yield fewer or equal matches')
    assert.equal(r5.pairs['matthew-mark'].sequences[0].length, 5)
  })

  // ── Greek tokenization ─────────────────────────────────────────────────

  it('tokenizes Greek text correctly', () => {
    const [r] = ComputeStatisticsWorker.perform({ verses: [GREEK_SECTION] })
    // matthew and mark share "εἰς τὴν οἰκίαν" tokens → should appear in sequences
    const pair = r.pairs['matthew-mark']
    assert.ok(pair.count > 0, 'Should find matching Greek word sequences')
  })

  // ── Relaxed mode ───────────────────────────────────────────────────────

  it('relaxed mode finds similar-but-not-identical sequences', () => {
    const [r] = ComputeStatisticsWorker.perform({
      verses: [RELAXED_SECTION],
      mode: 'relaxed',
      similarityThreshold: 0.2,
    })
    assert.equal(r.mode, 'relaxed')
    const pair = r.pairs['matthew-mark']
    assert.ok(pair.count > 0, 'Relaxed mode should find fuzzy matches between hello/hallo, testing/tasting')
  })

  it('relaxed sequences include similarity score (0–100)', () => {
    const [r] = ComputeStatisticsWorker.perform({
      verses: [RELAXED_SECTION],
      mode: 'relaxed',
      similarityThreshold: 0.2,
    })
    const seq = r.pairs['matthew-mark'].sequences[0]
    assert.ok(typeof seq.similarity === 'number')
    assert.ok(seq.similarity > 0 && seq.similarity <= 100,
      `Expected similarity in (0,100], got ${seq.similarity}`)
  })

  it('relaxed sequences include words2 array for the second gospel', () => {
    const [r] = ComputeStatisticsWorker.perform({
      verses: [RELAXED_SECTION],
      mode: 'relaxed',
      similarityThreshold: 0.2,
    })
    const seq = r.pairs['matthew-mark'].sequences[0]
    assert.ok(Array.isArray(seq.words2), 'Relaxed sequences should have words2')
  })

  it('exact mode does NOT find hello/hallo as a match', () => {
    const [r] = ComputeStatisticsWorker.perform({
      verses: [RELAXED_SECTION],
      mode: 'exact',
    })
    // "hello" ≠ "hallo" in exact mode, so the only possible 3-word
    // sequences would need 3 consecutive exact matches.
    // "world" matches but is only 1 word — not enough for minLength=3.
    const pair = r.pairs['matthew-mark']
    const fullMatches = pair.sequences.filter(s =>
      s.words.includes('hello') || s.words.includes('hallo')
    )
    assert.equal(fullMatches.length, 0, 'Exact mode should not match hello/hallo')
  })

  // ── Summary (cross-gospel) ─────────────────────────────────────────────

  it('summary.uniqueSequences contains sequences common across all gospels', () => {
    const [r] = ComputeStatisticsWorker.perform({ verses: [FOUR_GOSPEL_SECTION] })
    assert.ok(r.summary.totalMatches > 0, 'Identical 4-gospel text should have common sequences')
    assert.ok(r.summary.uniqueSequences.length > 0)
  })

  it('summary stays empty when gospels share no sequences', () => {
    const section = makeSection('s', 'No common', [
      makePassage('matthew', [{ verse: 1, text: 'alpha beta gamma' }]),
      makePassage('mark', [{ verse: 1, text: 'one two three' }]),
      makePassage('luke', [{ verse: 1, text: 'foo bar baz' }]),
    ])
    const [r] = ComputeStatisticsWorker.perform({ verses: [section] })
    assert.equal(r.summary.totalMatches, 0)
    assert.equal(r.summary.uniqueSequences.length, 0)
  })

  // ── Edge cases ─────────────────────────────────────────────────────────

  it('handles a section with a single gospel (no pairs)', () => {
    const section = makeSection('s', 'Solo', [
      makePassage('matthew', [{ verse: 1, text: 'some words here now' }]),
    ])
    const [r] = ComputeStatisticsWorker.perform({ verses: [section] })
    assert.deepEqual(Object.keys(r.pairs), [])
    assert.equal(r.totalWords.matthew, 4)
  })

  it('handles passages with empty text', () => {
    const section = makeSection('s', 'Empty', [
      makePassage('matthew', [{ verse: 1, text: '' }]),
      makePassage('mark', [{ verse: 1, text: '' }]),
    ])
    const [r] = ComputeStatisticsWorker.perform({ verses: [section] })
    assert.equal(r.totalWords.matthew, 0)
    assert.equal(r.totalWords.mark, 0)
    assert.equal(r.pairs['matthew-mark'].count, 0)
  })

  it('handles passages with text shorter than minLength', () => {
    const section = makeSection('s', 'Short', [
      makePassage('matthew', [{ verse: 1, text: 'one two' }]),
      makePassage('mark', [{ verse: 1, text: 'one two' }]),
    ])
    const [r] = ComputeStatisticsWorker.perform({ verses: [section], minLength: 3 })
    assert.equal(r.pairs['matthew-mark'].count, 0,
      'Two-word texts cannot produce sequences of minLength=3')
  })

  it('correctly maps verse references across multiple verses', () => {
    const section = makeSection('s', 'Verse mapping', [
      makePassage('matthew', [
        { verse: 1, text: 'aaa bbb ccc' },
        { verse: 2, text: 'ddd eee fff' },
      ]),
      makePassage('mark', [
        { verse: 5, text: 'xxx yyy zzz' },
        { verse: 6, text: 'ddd eee fff' },
      ]),
    ])
    const [r] = ComputeStatisticsWorker.perform({ verses: [section] })
    const pair = r.pairs['matthew-mark']
    assert.ok(pair.count > 0)
    const seq = pair.sequences.find(s => s.words.includes('ddd'))
    assert.ok(seq, 'Should find the ddd/eee/fff sequence')
    assert.equal(seq.verse1, 2, 'Matthew verse should be 2')
    assert.equal(seq.verse2, 6, 'Mark verse should be 6')
  })
})
