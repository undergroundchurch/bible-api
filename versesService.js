// ES Module wrapper for the verses library
// Provides browser-compatible access to verse data via API

const API_BASE_URL = import.meta.env.VITE_BIBLE_API_URL || '';

// Book constants from BibleConstants.js (converted to ES module)
export const BOOKS = {
  40: "Matthew",
  41: "Mark", 
  42: "Luke",
  43: "John",
  44: "Acts",
  45: "Romans",
  46: "1 Corinthians",
  47: "2 Corinthians",
  48: "Galatians",
  49: "Ephesians",
  50: "Philippians",
  51: "Colossians",
  52: "1 Thessalonians",
  53: "2 Thessalonians",
  54: "1 Timothy",
  55: "2 Timothy",
  56: "Titus",
  57: "Philemon",
  58: "Hebrews",
  59: "James",
  60: "1 Peter",
  61: "2 Peter",
  62: "1 John",
  63: "2 John",
  64: "3 John",
  65: "Jude",
  66: "Revelation"
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
  "jo": 43,
  "Acts": 44,
  "Atos": 44,
  "Acts of the Apostles": 44,
  "Romans": 45,
  "Romanos": 45,
  "1 Corinthians": 46,
  "1 Cor": 46,
  "2 Corinthians": 47,
  "2 Cor": 47,
  "Galatians": 48,
  "Galatas": 48,
  "Ephesians": 49,
  "Efesios": 49,
  "Philippians": 50,
  "Filipenses": 50,
  "Colossians": 51,
  "Colossenses": 51,
  "1 Thessalonians": 52,
  "1 Ts": 52,
  "2 Thessalonians": 53,
  "2 Ts": 53,
  "1 Timothy": 54,
  "1 Tm": 54,
  "2 Timothy": 55,
  "2 Tm": 55,
  "Titus": 56,
  "Tito": 56,
  "Philemon": 57,
  "Filemon": 57,
  "Hebrews": 58,
  "Hebreus": 58,
  "James": 59,
  "Jacob": 59,
  "Tiago": 59,
  "1 Peter": 60,
  "1 Pe": 60,
  "2 Peter": 61,
  "2 Pe": 61,
  "1 John": 62,
  "1 Jo": 62,
  "2 John": 63,
  "2 Jo": 63,
  "3 John": 64,
  "3 Jo": 64,
  "Jude": 65,
  "Judas": 65,
  "Revelation": 66,
  "Apocalypse": 66,
  "Apocalipse": 66
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
  if (!ref || typeof ref !== 'string') return null;
  
  const trimmed = ref.trim();
  const match = trimmed.match(/^([\w\s]+)\s+(\d+):(\d+)(?:-(\d+))?$/i);
  
  if (!match) return null;
  
  const bookName = match[1].trim();
  const chapter = parseInt(match[2], 10);
  const startVerse = parseInt(match[3], 10);
  const endVerse = match[4] ? parseInt(match[4], 10) : startVerse;
  
  const bookNum = LABELS[bookName];
  if (!bookNum) return null;
  
  return {
    book: bookNum,
    bookName: BOOKS[bookNum],
    chapter,
    startVerse,
    endVerse
  };
}

// Fetch verses from API
export async function fetchVerses(reference, version = "ACF") {
  const parsed = parseReference(reference);
  if (!parsed) {
    throw new Error(`Invalid reference: ${reference}`);
  }
  
  const url = `${API_BASE_URL}/api/verses?reference=${encodeURIComponent(reference)}&version=${version}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('Failed to fetch verses:', err);
    // Return empty verses if API is unavailable
    return {
      reference,
      version,
      parsed,
      verses: generateEmptyVerses(parsed)
    };
  }
}

// Generate empty verses for fallback
function generateEmptyVerses(parsed) {
  const verses = [];
  for (let v = parsed.startVerse; v <= parsed.endVerse; v++) {
    verses.push({
      book: parsed.book,
      bookName: parsed.bookName,
      chapter: parsed.chapter,
      verse: v,
      text: ''
    });
  }
  return verses;
}

// Search verses by text
export async function searchVersesByText(query, options = {}) {
  const { book, version = 'ACF' } = options;
  
  let url = `${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}&version=${version}`;
  if (book) {
    url += `&book=${encodeURIComponent(book)}`;
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('Failed to search verses:', err);
    return { query, version, book: book || 'all', results: [] };
  }
}

// Fetch multiple verses for a range
export async function fetchVerseRange(reference, version = "ACF") {
  const data = await fetchVerses(reference, version);
  return data.verses || [];
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
export function buildVerseCommand(bookName, chapter, verse, version = "ACF") {
  return `.bv ${bookName} ${chapter}:${verse} ${version}`;
}

// Get available versions from API
export async function getAvailableVersions() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/versions`);
    if (!response.ok) throw new Error('Failed to fetch versions');
    const data = await response.json();
    return data.versions || {};
  } catch (err) {
    console.error('Failed to fetch versions:', err);
    // Return default versions (all assumed available)
    return {
      ACF: true,
      BYZ: true,
      EMTV: true,
      WPNT: true,
      ITARIVE: true,
      FREMRTN: true,
      ISV: true,
      KJV: false // Not in the database folders
    };
  }
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
  searchVersesByText,
  parseReference,
  getBookNumber,
  getOsis,
  buildVerseCommand,
  getAvailableVersions,
  BOOKS,
  LABELS,
  GOSPEL_NAMES,
  BibleVersionEnum
};
