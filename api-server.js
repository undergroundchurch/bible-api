#!/usr/bin/env node
/**
 * Bible Verse API Server
 * Serves verse content from SQLite databases to the frontend
 */

const http = require('http');
const url = require('url');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

const PORT = process.env.BIBLE_API_PORT || 3001;

// Bible version database paths
const DB_PATHS = {
  ACF: path.join(__dirname, 'db/acf/ACF2007.bbl.mybible'),
  BYZ: path.join(__dirname, 'db/byz/BYZ2005.bbl.mybible'),
  EMTV: path.join(__dirname, 'db/emtv/EMTV.bbl.mybible'),
  WPNT: path.join(__dirname, 'db/wpnt/WPNT.bblx'),
  ITARIVE: path.join(__dirname, 'db/ita/ITARIVE.bbl.mybible'),
  FREMRTN: path.join(__dirname, 'db/fre/FREMRTN.bbl.mybible'),
  ISV: path.join(__dirname, 'db/isv/ISV.bbl.mybible')
};

// Book name to number mapping (standard Bible book numbers)
const BOOK_NUMBERS = {
  'Matt': 40, 'Matthew': 40, 'Mateus': 40, 'Mat': 40, 'Mt': 40, 'mt': 40,
  'Mark': 41, 'Marcos': 41, 'Mar': 41, 'Mk': 41, 'Mc': 41, 'mk': 41, 'mc': 41,
  'Luke': 42, 'Lucas': 42, 'Lk': 42, 'Lc': 42, 'lk': 42, 'lc': 42,
  'John': 43, 'João': 43, 'Joh': 43, 'Jn': 43, 'Jo': 43, 'jn': 43, 'jo': 43,
  // Add more books as needed
  'Acts': 44, 'Acts of the Apostles': 44, 'Atos': 44,
  'Rom': 45, 'Romans': 45, 'Romanos': 45,
  '1Cor': 46, '1 Corinthians': 46, '1 Cor': 46, '1Co': 46,
  '2Cor': 47, '2 Corinthians': 47, '2 Cor': 47, '2Co': 47,
  'Gal': 48, 'Galatians': 48, 'Galatas': 48,
  'Eph': 49, 'Ephesians': 49, 'Efesios': 49,
  'Phil': 50, 'Philippians': 50, 'Filipenses': 50, 'Php': 50,
  'Col': 51, 'Colossians': 51, 'Colossenses': 51,
  '1Thess': 52, '1 Thessalonians': 52, '1 Ts': 52, '1Th': 52,
  '2Thess': 53, '2 Thessalonians': 53, '2 Ts': 53, '2Th': 53,
  '1Tim': 54, '1 Timothy': 54, '1 Tm': 54, '1Ti': 54,
  '2Tim': 55, '2 Timothy': 55, '2 Tm': 55, '2Ti': 55,
  'Titus': 56, 'Tito': 56, 'Tit': 56,
  'Phlm': 57, 'Philemon': 57, 'Filemon': 57,
  'Heb': 58, 'Hebrews': 58, 'Hebreus': 58,
  'Jas': 59, 'James': 59, 'Jacob': 59, 'Tiago': 59,
  '1Pet': 60, '1 Peter': 60, '1 Pe': 60, '1Pe': 60, '1Pt': 60,
  '2Pet': 61, '2 Peter': 61, '2 Pe': 61, '2Pe': 61, '2Pt': 61,
  '1John': 62, '1 John': 62, '1 Jo': 62, '1Jn': 62, '1Jo': 62,
  '2John': 63, '2 John': 63, '2 Jo': 63, '2Jn': 63, '2Jo': 63,
  '3John': 64, '3 John': 64, '3 Jo': 64, '3Jn': 64, '3Jo': 64,
  'Jude': 65, 'Judas': 65,
  'Rev': 66, 'Revelation': 66, 'Apocalypse': 66, 'Apocalipse': 66, 'Ap': 66
};

// Inverse mapping for response
const BOOK_NAMES = {
  40: 'Matthew', 41: 'Mark', 42: 'Luke', 43: 'John',
  44: 'Acts', 45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians',
  48: 'Galatians', 49: 'Ephesians', 50: 'Philippians', 51: 'Colossians',
  52: '1 Thessalonians', 53: '2 Thessalonians', 54: '1 Timothy',
  55: '2 Timothy', 56: 'Titus', 57: 'Philemon', 58: 'Hebrews',
  59: 'James', 60: '1 Peter', 61: '2 Peter', 62: '1 John',
  63: '2 John', 64: '3 John', 65: 'Jude', 66: 'Revelation'
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// Parse reference string like "Matthew 1:1" or "Matt 1:1-5"
function parseReference(ref) {
  if (!ref || typeof ref !== 'string') return null;
  
  const trimmed = ref.trim();
  const match = trimmed.match(/^([\w\s]+)\s+(\d+):(\d+)(?:-(\d+))?$/i);
  
  if (!match) return null;
  
  const bookName = match[1].trim();
  const chapter = parseInt(match[2], 10);
  const startVerse = parseInt(match[3], 10);
  const endVerse = match[4] ? parseInt(match[4], 10) : startVerse;
  
  const bookNum = BOOK_NUMBERS[bookName];
  if (!bookNum) return null;
  
  return {
    book: bookNum,
    bookName: BOOK_NAMES[bookNum],
    chapter,
    startVerse,
    endVerse
  };
}

// Get verse from database
function getVerses(version, book, chapter, startVerse, endVerse) {
  const dbPath = DB_PATHS[version] || DB_PATHS['ACF'];
  
  if (!fs.existsSync(dbPath)) {
    console.error(`Database not found: ${dbPath}`);
    return [];
  }
  
  const db = new Database(dbPath, { readonly: true });
  const verses = [];
  
  try {
    const stmt = db.prepare(
      'SELECT Book, Chapter, Verse, Scripture FROM bible WHERE Book = ? AND Chapter = ? AND Verse >= ? AND Verse <= ? ORDER BY Verse'
    );
    
    const rows = stmt.all(book, chapter, startVerse, endVerse);
    
    for (const row of rows) {
      verses.push({
        book: row.Book,
        bookName: BOOK_NAMES[row.Book] || 'Unknown',
        chapter: row.Chapter,
        verse: row.Verse,
        text: row.Scripture
      });
    }
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    db.close();
  }
  
  return verses;
}

// Search verses by text
function searchVerses(version, book, query) {
  const dbPath = DB_PATHS[version] || DB_PATHS['ACF'];
  
  if (!fs.existsSync(dbPath)) {
    console.error(`Database not found: ${dbPath}`);
    return [];
  }
  
  const db = new Database(dbPath, { readonly: true });
  const verses = [];
  
  try {
    // Sanitize query to prevent SQL injection
    const sanitizedQuery = query.replace(/[%_]/g, '');
    
    const stmt = db.prepare(
      'SELECT Book, Chapter, Verse, Scripture FROM bible WHERE Book = ? AND Scripture LIKE ? LIMIT 20'
    );
    
    const rows = stmt.all(book, `%${sanitizedQuery}%`);
    
    for (const row of rows) {
      verses.push({
        book: row.Book,
        bookName: BOOK_NAMES[row.Book] || 'Unknown',
        chapter: row.Chapter,
        verse: row.Verse,
        text: row.Scripture
      });
    }
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    db.close();
  }
  
  return verses;
}

// Get available versions
function getVersions() {
  const versions = {};
  for (const [key, path] of Object.entries(DB_PATHS)) {
    versions[key] = fs.existsSync(path);
  }
  return versions;
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const query = parsed.query;
  
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // API Routes
  if (pathname === '/api/verses' && req.method === 'GET') {
    const { reference, version = 'ACF' } = query;
    
    if (!reference) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing reference parameter' }));
      return;
    }
    
    const parsed = parseReference(reference);
    if (!parsed) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid reference format. Use "Book Chapter:Verse" or "Book Chapter:Verse-Verse"' }));
      return;
    }
    
    const verses = getVerses(version.toUpperCase(), parsed.book, parsed.chapter, parsed.startVerse, parsed.endVerse);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      reference,
      version: version.toUpperCase(),
      parsed,
      verses
    }));
    return;
  }
  
  if (pathname === '/api/search' && req.method === 'GET') {
    const { q, book, version = 'ACF' } = query;
    
    if (!q) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing q (query) parameter' }));
      return;
    }
    
    // If book is specified, search only that book
    const bookNum = book ? (BOOK_NUMBERS[book] || parseInt(book, 10)) : null;
    
    const results = [];
    if (bookNum) {
      results.push(...searchVerses(version.toUpperCase(), bookNum, q));
    } else {
      // Search all four gospels by default
      for (const gospel of [40, 41, 42, 43]) {
        results.push(...searchVerses(version.toUpperCase(), gospel, q));
      }
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      query: q,
      version: version.toUpperCase(),
      book: book || 'all gospels',
      results
    }));
    return;
  }
  
  if (pathname === '/api/versions' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ versions: getVersions() }));
    return;
  }
  
  if (pathname === '/api/books' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ books: BOOK_NAMES }));
    return;
  }
  
  // Health check
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', port: PORT }));
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Bible API Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`  GET http://localhost:${PORT}/api/verses?reference=Matthew+1:1&version=ACF`);
  console.log(`  GET http://localhost:${PORT}/api/search?q=love&version=ACF`);
  console.log(`  GET http://localhost:${PORT}/api/versions`);
  console.log(`  GET http://localhost:${PORT}/api/books`);
  console.log('\nAvailable versions:', Object.keys(DB_PATHS).join(', '));
});

module.exports = { server, parseReference, getVerses };
