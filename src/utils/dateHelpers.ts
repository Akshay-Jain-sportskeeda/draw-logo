/**
 * Utility functions for date formatting and manipulation
 */

/**
 * Converts a timestamp to a date string in YYYY-MM-DD format (UTC)
 * @param timestamp - The timestamp in milliseconds
 * @returns Date string in YYYY-MM-DD format
 */
export function getDateFromTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets today's date in YYYY-MM-DD format (UTC)
 * @returns Today's date string in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  return getDateFromTimestamp(Date.now());
}

/**
 * Generates a date-based storage path for creative remix submissions
 * @param userId - The user's unique ID
 * @param timestamp - The timestamp in milliseconds
 * @returns Storage path in format: creative-remix/YYYY-MM-DD/userId-timestamp-randomString.png
 */
export function generateDateBasedStoragePath(userId: string, timestamp: number): string {
  const dateString = getDateFromTimestamp(timestamp);
  const randomString = Math.random().toString(36).substring(2, 15);
  return `creative-remix/${dateString}/${userId}-${timestamp}-${randomString}.png`;
}
