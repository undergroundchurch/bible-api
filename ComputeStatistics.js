const textSimilarity = require('text-similarity-node')

/**
 * Tokenize text into words, removing punctuation.
 * Handles Greek (α-ωΑ-Ω), Latin (a-zA-Z), and digits.
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  if (!text) return []
  return text
    .toLowerCase()
    .replace(/[^α-ωΑ-Ωa-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0)
}

/**
 * Build a word-to-verse mapping for tracking verse references.
 * @param {Array<{verse: number, text: string}>} verses
 * @returns {{word: string, verse: number, wordIdx: number}[]}
 */
function buildVerseWordMap(verses) {
  const result = []
  let wordIdx = 0
  verses.forEach(v => {
    const words = tokenize(v.text)
    words.forEach(w => {
      result.push({ word: w, verse: v.verse, wordIdx: wordIdx++ })
    })
  })
  return result
}

/**
 * Find verse reference for a word position.
 * @param {Array} verseWordMap
 * @param {number} wordIdx
 * @returns {number}
 */
function getVerseAtWordIdx(verseWordMap, wordIdx) {
  for (let i = verseWordMap.length - 1; i >= 0; i--) {
    if (verseWordMap[i].wordIdx <= wordIdx) {
      return verseWordMap[i].verse
    }
  }
  return verseWordMap[0]?.verse || 1
}

/**
 * Check if two words are similar using text-similarity-node's native
 * Levenshtein similarity (0–1 score).
 * For very short words (≤3 chars), requires at most 1 edit distance.
 * @param {string} word1
 * @param {string} word2
 * @param {number} threshold - minimum similarity ratio (default 0.8, i.e. 1 - 0.2)
 * @returns {{isSimilar: boolean, similarity: number}}
 */
function areSimilar(word1, word2, threshold = 0.8) {
  if (word1 === word2) return { isSimilar: true, similarity: 1 }

  const maxLen = Math.max(word1.length, word2.length)
  if (maxLen === 0) return { isSimilar: true, similarity: 1 }

  // For very short words, be stricter — at most 1 edit
  if (maxLen <= 3) {
    const dist = textSimilarity.distance.levenshtein(word1, word2, true)
    return {
      isSimilar: dist <= 1,
      similarity: maxLen === 0 ? 1 : 1 - (dist / maxLen)
    }
  }

  // Use native Levenshtein similarity (returns 0–1)
  const sim = textSimilarity.similarity.levenshtein(word1, word2, true)
  return {
    isSimilar: sim >= threshold,
    similarity: sim
  }
}

/**
 * Find all sequences of N consecutive identical words between two texts (exact mode).
 * @param {string[]} words1
 * @param {string[]} words2
 * @param {number} minLength
 * @param {Array} verseWordMap1
 * @param {Array} verseWordMap2
 * @returns {Array<{words: string[], length: number, start1: number, start2: number, verse1: number, verse2: number}>}
 */
function findMatchingSequences(words1, words2, minLength = 3, verseWordMap1 = [], verseWordMap2 = []) {
  const matches = []

  if (words1.length < minLength || words2.length < minLength) {
    return matches
  }

  for (let i = 0; i <= words1.length - minLength; i++) {
    for (let j = 0; j <= words2.length - minLength; j++) {
      let matchLen = 0
      while (
        i + matchLen < words1.length &&
        j + matchLen < words2.length &&
        words1[i + matchLen] === words2[j + matchLen]
      ) {
        matchLen++
      }

      if (matchLen >= minLength) {
        const isDuplicate = matches.some(m => m.start1 === i && m.start2 === j)
        if (!isDuplicate) {
          matches.push({
            words: words1.slice(i, i + matchLen),
            length: matchLen,
            start1: i,
            start2: j,
            verse1: getVerseAtWordIdx(verseWordMap1, i),
            verse2: getVerseAtWordIdx(verseWordMap2, j),
          })
        }
      }
    }
  }

  return matches
}

/**
 * Find all sequences of N consecutive similar words between two texts (relaxed mode).
 * Uses text-similarity-node for native C++ Levenshtein similarity per word pair.
 * @param {string[]} words1
 * @param {string[]} words2
 * @param {number} minLength
 * @param {Array} verseWordMap1
 * @param {Array} verseWordMap2
 * @param {number} similarityThreshold - minimum similarity ratio (0–1, default 0.8)
 * @returns {Array<{words: string[], words2: string[], length: number, start1: number, start2: number, verse1: number, verse2: number, similarity: number}>}
 */
function findRelaxedMatchingSequences(words1, words2, minLength = 3, verseWordMap1 = [], verseWordMap2 = [], similarityThreshold = 0.8) {
  const matches = []

  if (words1.length < minLength || words2.length < minLength) {
    return matches
  }

  for (let i = 0; i <= words1.length - minLength; i++) {
    for (let j = 0; j <= words2.length - minLength; j++) {
      let matchLen = 0
      let totalSimilarity = 0

      while (
        i + matchLen < words1.length &&
        j + matchLen < words2.length
      ) {
        const w1 = words1[i + matchLen]
        const w2 = words2[j + matchLen]
        const { isSimilar, similarity } = areSimilar(w1, w2, similarityThreshold)

        if (isSimilar) {
          totalSimilarity += similarity
          matchLen++
        } else {
          break
        }
      }

      if (matchLen >= minLength) {
        const avgSimilarity = totalSimilarity / matchLen
        const isDuplicate = matches.some(m => m.start1 === i && m.start2 === j)
        if (!isDuplicate) {
          matches.push({
            words: words1.slice(i, i + matchLen),
            words2: words2.slice(j, j + matchLen),
            length: matchLen,
            start1: i,
            start2: j,
            verse1: getVerseAtWordIdx(verseWordMap1, i),
            verse2: getVerseAtWordIdx(verseWordMap2, j),
            similarity: Math.round(avgSimilarity * 100),
          })
        }
      }
    }
  }

  return matches
}

/**
 * Compute word-sequence statistics across gospel comparison pairs.
 *
 * @param {Object} gospelsWithVerses - { matthew: {text, verses}, mark: {text, verses}, ... }
 * @param {number} minLength - minimum sequence length (default 3)
 * @param {string} mode - 'exact' or 'relaxed'
 * @param {number} similarityThreshold - for relaxed mode, max edit distance ratio (0–1, default 0.2)
 * @returns {Object} statistics matching the output schema documented above
 */
function computeStatistics(gospelsWithVerses, minLength = 3, mode = 'exact', similarityThreshold = 0.2) {
  // Convert the threshold: the caller sends the *distance* ratio (e.g. 0.2 = 20% edits allowed).
  // areSimilar expects a *similarity* threshold (e.g. 0.8).
  const simThreshold = 1 - similarityThreshold

  const gospelList = ['matthew', 'mark', 'luke', 'john'].filter(g => gospelsWithVerses[g])
  const tokenized = {}
  const verseWordMaps = {}

  gospelList.forEach(g => {
    const gData = gospelsWithVerses[g]
    const text = typeof gData === 'string' ? gData : (gData?.text || '')
    const verses = typeof gData === 'object' && Array.isArray(gData?.verses) ? gData.verses : []
    tokenized[g] = tokenize(text)
    verseWordMaps[g] = buildVerseWordMap(verses)
  })

  const statistics = {
    totalWords: {},
    summary: {
      totalMatches: 0,
      totalMatchingWords: 0,
      uniqueSequences: [],
    },
    pairs: {},
    mode: mode,
  }

  gospelList.forEach(g => {
    statistics.totalWords[g] = tokenized[g].length
  })

  // Compare every gospel pair
  for (let i = 0; i < gospelList.length; i++) {
    for (let j = i + 1; j < gospelList.length; j++) {
      const g1 = gospelList[i]
      const g2 = gospelList[j]
      const pairKey = `${g1}-${g2}`

      const matches = mode === 'relaxed'
        ? findRelaxedMatchingSequences(
            tokenized[g1],
            tokenized[g2],
            minLength,
            verseWordMaps[g1],
            verseWordMaps[g2],
            simThreshold
          )
        : findMatchingSequences(
            tokenized[g1],
            tokenized[g2],
            minLength,
            verseWordMaps[g1],
            verseWordMaps[g2]
          )

      const totalMatchingWords = matches.reduce((sum, m) => sum + m.length, 0)

      statistics.pairs[pairKey] = {
        count: matches.length,
        totalWords: totalMatchingWords,
        sequences: matches,
        matchPercentage: {
          [g1]: tokenized[g1].length > 0
            ? ((totalMatchingWords / tokenized[g1].length) * 100).toFixed(1)
            : 0,
          [g2]: tokenized[g2].length > 0
            ? ((totalMatchingWords / tokenized[g2].length) * 100).toFixed(1)
            : 0,
        },
      }
    }
  }

  // Compute cross-gospel summary (sequences common to ALL gospels)
  if (gospelList.length >= 2) {
    let commonSequences = statistics.pairs[`${gospelList[0]}-${gospelList[1]}`]?.sequences || []

    for (let i = 2; i < gospelList.length; i++) {
      const g = gospelList[i]
      const pairKey = `${gospelList[0]}-${g}`
      const nextSequences = statistics.pairs[pairKey]?.sequences || []

      const wordsJoin = (seq) => seq.words.join(' ')

      commonSequences = commonSequences.filter(seq1 =>
        nextSequences.some(seq2 =>
          wordsJoin(seq1) === wordsJoin(seq2)
        )
      ).map(seq1 => {
        const matchingSeq = nextSequences.find(seq2 => wordsJoin(seq1) === wordsJoin(seq2))
        return {
          ...seq1,
          [`verse_${g}`]: matchingSeq ? matchingSeq[`verse${i + 1}`] : null,
        }
      })
    }

    const enhancedCommon = commonSequences.map(seq => {
      const result = { ...seq }
      gospelList.forEach((g, idx) => {
        const verseProp = idx === 0 ? 'verse1' : idx === 1 ? 'verse2' : idx === 2 ? 'verse3' : 'verse4'
        result[`verse_${g}`] = seq[verseProp] || null
      })
      return result
    })

    if (enhancedCommon.length > 0) {
      statistics.summary.uniqueSequences = enhancedCommon
      statistics.summary.totalMatches = enhancedCommon.length
      statistics.summary.totalMatchingWords = enhancedCommon.reduce((sum, m) => sum + m.length, 0)
    }
  }

  return statistics
}

/**
[\n    {\n        "sectionId": "section-1",\n        "sectionTitle": "The paralized man",\n        "totalWords": {\n            "matthew": 178,\n            "mark": 247,\n            "luke": 238,\n            "john": 0\n        },\n        "summary": {\n            "totalMatches": 0,\n            "totalMatchingWords": 0,\n            "uniqueSequences": []\n        },\n        "pairs": {\n            "matthew-mark": {\n                "count": 95,\n                "totalWords": 516,\n                "sequences": [\n                    {\n                        "words": [\n                            "ε",\n                            "ς",\n                            "τ",\n                            "ν"\n                        ],\n                        "length": 4,\n                        "start1": 11,\n                        "start2": 215,\n                        "verse1": 1,\n                        "verse2": 11\n                    },\n                ]\n            },\n            "matthew-luke": {\n                "count": 97,\n                "totalWords": 513,\n                "sequences": [\n                    {\n                        "words": [\n                            "λθεν",\n                            "ε",\n                            "ς",\n                            "τ",\n                            "ν"\n                        ],\n                        "length": 5,\n                        "start1": 10,\n                        "start2": 223,\n                        "verse1": 1,\n                        "verse2": 25\n                    },\n                ],\n                "matchPercentage": {\n                    "matthew": "288.2",\n                    "luke": "215.5"\n                }\n            },\n            "matthew-john": {\n                "count": 0,\n                "totalWords": 0,\n                "sequences": [],\n                "matchPercentage": {\n                    "matthew": "0.0",\n                    "john": 0\n                }\n            },\n            "mark-luke": {\n                "count": 86,\n                "totalWords": 433,\n                "sequences": [\n                    {\n                        "words": [\n                            "ς",\n                            "τ",\n                            "ν"\n                        ],\n                        "length": 3,\n                        "start1": 25,\n                        "start2": 201,\n                        "verse1": 2,\n                        "verse2": 24\n                    },\n                ],\n                "matchPercentage": {\n                    "mark": "175.3",\n                    "luke": "181.9"\n                }\n            },\n            "mark-john": {\n                "count": 0,\n                "totalWords": 0,\n                "sequences": [],\n                "matchPercentage": {\n                    "mark": "0.0",\n                    "john": 0\n                }\n            },\n            "luke-john": {\n                "count": 0,\n                "totalWords": 0,\n                "sequences": [],\n                "matchPercentage": {\n                    "luke": "0.0",\n                    "john": 0\n                }\n            }\n        },\n        "mode": "exact"\n    }\n]\n */
class ComputeStatisticsWorker {
  /**
   * Process a compute-statistics job.
   *
   * @param {Object} params
   * @param {Array<{id: string, title: string, passages: Array<{gospel: string, verses: Array<{verse: number, text: string}>}>}>} params.verses - sections with passages
   * @param {number} [params.minLength=3] - minimum word-sequence length to report
   * @param {string} [params.mode='exact'] - 'exact' or 'relaxed'
   * @param {number} [params.similarityThreshold=0.2] - max edit-distance ratio for relaxed mode
   * @returns {Array} array of per-section statistics objects
   */
  static perform({ verses, minLength = 3, mode = 'exact', similarityThreshold = 0.2 }) {
    const sections = Array.isArray(verses) ? verses : []

    const results = sections.map((section) => {
      const gospelsWithVerses = {}
      section.passages?.forEach(passage => {
        if (passage.verses && Array.isArray(passage.verses)) {
          gospelsWithVerses[passage.gospel] = {
            text: passage.verses.map(v => v.text).join(' '),
            verses: passage.verses,
          }
        }
      })

      const stats = computeStatistics(gospelsWithVerses, minLength, mode, similarityThreshold)
      return {
        sectionId: section.id,
        sectionTitle: section.title,
        ...stats,
      }
    })

    return results
  }
}

module.exports = ComputeStatisticsWorker
