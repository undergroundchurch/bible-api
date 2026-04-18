// ES Module wrapper for the verses library
// Provides browser-compatible access to verse data

// Book constants from BibleConstants.js (converted to ES module)
export const BOOKS = {
  40: "matthew",
  41: "mark",
  42: "luke",
  43: "john"
};

export const LABELS = {
  "Matthew": 40,
  "Mateus": 40,
  "matthew": 40,
  "mateus": 40,
  "Mat": 40,
  "mat": 40,
  "Matt": 40,
  "matt": 40,
  "mt": 40,
  "Mark": 41,
  "Marcos": 41,
  "mark": 41,
  "marcos": 41,
  "Mar": 41,
  "Mk": 41,
  "mk": 41,
  "Mc": 41,
  "mc": 41,
  "Luke": 42,
  "Lucas": 42,
  "luke": 42,
  "lucas": 42,
  "Lc": 42,
  "Lk": 42,
  "lc": 42,
  "lk": 42,
  "John": 43,
  "João": 43,
  "john": 43,
  "joão": 43,
  "Jn": 43,
  "Jo": 43,
  "jn": 43,
  "jo": 43
};

// Gospel name mapping
export const GOSPEL_NAMES = {
  matthew: "Matthew",
  mark: "Mark",
  luke: "Luke",
  john: "John"
};

// Reference to book number mapping
export function getBookNumber(ref) {
  // Handle format like "Matthew 1:18-25" or "Matthew 1:18"
  const parts = ref.trim().split(/\s+/);
  const bookName = parts[0];
  return LABELS[bookName] || null;
}

// Parse a reference string like "Matthew 1:18-25" or "Matthew 1:18"
export function parseReference(ref) {
  const bookNum = getBookNumber(ref);
  if (!bookNum) return null;

  // Extract chapter and verses using regex
  const match = ref.match(/(\d+):(\d+)(?:-(\d+))?/);
  if (!match) return null;

  const chapter = parseInt(match[1], 10);
  const startVerse = parseInt(match[2], 10);
  const endVerse = match[3] ? parseInt(match[3], 10) : startVerse;

  return {
    book: bookNum,
    bookName: BOOKS[bookNum],
    chapter,
    startVerse,
    endVerse
  };
}

// Get OSIS format from reference (simplified version)
export function getOsis(ref) {
  const parsed = parseReference(ref);
  if (!parsed) return null;

  if (parsed.startVerse === parsed.endVerse) {
    return `Matt.${parsed.chapter}.${parsed.startVerse}`; // Simplified
  }
  return `Matt.${parsed.chapter}.${parsed.startVerse}-${parsed.chapter}.${parsed.endVerse}`;
}

// Command format from TestCommands.js: ".bv Mateus 2:2 ACF" or ".bv Matthew 1:18 KJV"
export function buildVerseCommand(bookName, chapter, verse, version = "KJV") {
  return `.bv ${bookName} ${chapter}:${verse} ${version}`;
}

// Simulated ProcessingInstruction for browser
// In a real implementation, this would call a backend API
export async function fetchVerses(reference, version = "KJV") {
  const parsed = parseReference(reference);
  if (!parsed) {
    throw new Error(`Invalid reference: ${reference}`);
  }

  // Build command string (matching TestCommands.js format)
  const command = buildVerseCommand(
    parsed.bookName,
    parsed.chapter,
    `${parsed.startVerse}${parsed.endVerse !== parsed.startVerse ? `-${parsed.endVerse}` : ''}`,
    version
  );

  // In browser mode, we would typically make an API call
  // For now, return structured data that matches the expected format
  return {
    command,
    parsed,
    reference
  };
}

// Fetch multiple verses for a range
export async function fetchVerseRange(reference, version = "KJV") {
  const parsed = parseReference(reference);
  if (!parsed) return [];

  const verses = [];
  for (let v = parsed.startVerse; v <= parsed.endVerse; v++) {
    verses.push({
      verse: v,
      text: "" // Would be populated from actual verse data
    });
  }
  return verses;
}

// Re-export common types/enums
export const BibleVersionEnum = {
  KJV: "KJV",
  ACF: "ACF",
  BYZ: "BYZ",
  WPNT: "WPNT",
  EMTV: "EMTV",
  ITARIVE: "ITARIVE",
  FREMRTN: "FREMRTN",
  ISV: "ISV"
};

// Default export for compatibility
export default {
  fetchVerses,
  fetchVerseRange,
  parseReference,
  getBookNumber,
  getOsis,
  buildVerseCommand,
  BOOKS,
  LABELS,
  GOSPEL_NAMES,
  BibleVersionEnum
};
