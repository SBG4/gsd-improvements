/**
 * GSD Shared Utilities
 *
 * Common utilities for GSD hooks with cross-platform support.
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Normalize file paths for cross-platform consistency.
 * Always uses forward slashes for storage/comparison.
 */
export function normalizePath(filePath) {
  if (!filePath) return filePath;
  return filePath.split(path.sep).join('/');
}

/**
 * Convert normalized path back to OS-specific path.
 */
export function toOSPath(normalizedPath) {
  if (!normalizedPath) return normalizedPath;
  return normalizedPath.split('/').join(path.sep);
}

/**
 * Check if we're in a GSD project (has .planning directory).
 */
export async function isGSDProject() {
  try {
    await fs.access('.planning');
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely read JSON file with fallback.
 */
export async function readJSON(filePath, fallback = {}) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

/**
 * Safely write JSON file with pretty printing.
 */
export async function writeJSON(filePath, data) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * Check file/directory permissions.
 */
export async function checkPermissions(targetPath, mode = fs.constants.W_OK) {
  try {
    await fs.access(targetPath, mode);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: `Permission denied: ${targetPath}`,
      suggestion: process.platform === 'win32'
        ? `Check folder permissions in Windows Explorer`
        : `Run: chmod -R u+w ${targetPath}`
    };
  }
}

/**
 * Get current timestamp in ISO format.
 */
export function timestamp() {
  return new Date().toISOString();
}

/**
 * Emit event to blackboard events file.
 */
export async function emitEvent(event) {
  const eventsPath = path.join('.planning', 'blackboard', 'events.json');
  const data = await readJSON(eventsPath, { events: [], lastEventId: 0 });

  data.events.push({
    ...event,
    id: ++data.lastEventId,
    timestamp: event.timestamp || timestamp()
  });

  // Keep only last 1000 events
  if (data.events.length > 1000) {
    data.events = data.events.slice(-1000);
  }

  await writeJSON(eventsPath, data);
  return data.lastEventId;
}

/**
 * Log message with GSD prefix.
 */
export function log(hook, message, level = 'info') {
  const prefix = `[gsd-${hook}]`;
  switch (level) {
    case 'error':
      console.error(`${prefix} ERROR: ${message}`);
      break;
    case 'warn':
      console.warn(`${prefix} WARN: ${message}`);
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}

/**
 * Debounce function for rate-limiting operations.
 */
export function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Check if path is within .planning directory.
 */
export function isPlanningPath(filePath) {
  const normalized = normalizePath(filePath);
  return normalized.includes('.planning/') ||
         normalized.startsWith('.planning/') ||
         filePath.includes('.planning\\');
}

export default {
  normalizePath,
  toOSPath,
  isGSDProject,
  readJSON,
  writeJSON,
  checkPermissions,
  timestamp,
  emitEvent,
  log,
  debounce,
  isPlanningPath
};
