// ES Module entry point for @verses library
// Re-exports browser-compatible parts of the verses library

// Re-export the verses service (browser-compatible wrappers)
export * from './versesService.js';

// Export default
export { default } from './versesService.js';

// Note: The original index.js uses Node.js modules (require, better-sqlite3, path)
// and cannot be run directly in browsers. 
// Use versesService.js for browser-compatible functionality.
// 
// For Node.js environments, the original index.js exports:
// - ProcessingInstruction - processes .bv, .bc, .bd commands
//
// Example commands (from TestCommands.js):
//   .bv Matthew 2:2 KJV
//   .bv Mateus 2:2 ACF  
//   .bc Mateus 2:2 RWP  (commentary)
