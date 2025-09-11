/**
 * Utility for generating unique IDs across the application
 */

let idCounter = 0;
const sessionId = Math.random().toString(36).substr(2, 9);

/**
 * Generate a guaranteed unique ID
 * Format: timestamp-sessionId-counter
 */
export function generateUniqueId(): string {
  idCounter += 1;
  return `${Date.now()}-${sessionId}-${idCounter}`;
}

/**
 * Generate a unique key for React components
 * This ensures no duplicate keys even with rapid successive calls
 */
export function generateUniqueKey(prefix?: string): string {
  const id = generateUniqueId();
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * Generate a timestamp-based ID with guaranteed uniqueness
 * Useful for data that needs to be sortable by creation time
 */
export function generateTimestampId(): string {
  return generateUniqueId();
}
