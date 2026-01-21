/**
 * GSD Blackboard Sync Hook
 *
 * Automatically syncs state to blackboard after relevant tool calls.
 * Triggered on: PostToolUse (Write, Edit, Bash with git commit)
 *
 * Cross-platform compatible (Windows/macOS/Linux)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Cross-platform path handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use path.join for all path operations (Windows compatibility)
const BLACKBOARD_DIR = path.join('.planning', 'blackboard');

// Normalize paths for consistent storage (always use forward slashes in JSON)
function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

export default async function blackboardSyncHook({ tool, input, result, session }) {
  // Only run for successful tool calls
  if (!result?.success) return;

  try {
    // Ensure blackboard directory exists
    await ensureBlackboardDir();

    switch (tool) {
      case 'Write':
      case 'Edit':
        await handleFileChange(input, result);
        break;

      case 'Bash':
        if (isGitCommit(input.command)) {
          await handleGitCommit(input, result);
        }
        break;
    }
  } catch (error) {
    // Non-blocking - log but don't fail the operation
    console.error('[gsd-blackboard-sync] Error:', error.message);
  }
}

async function ensureBlackboardDir() {
  try {
    await fs.mkdir(BLACKBOARD_DIR, { recursive: true });

    // Initialize files if they don't exist
    const files = ['shared-context.json', 'claims.json', 'artifacts.json', 'events.json'];

    for (const file of files) {
      const filePath = path.join(BLACKBOARD_DIR, file);
      try {
        await fs.access(filePath);
      } catch {
        const initial = file === 'events.json'
          ? { events: [], lastEventId: 0 }
          : {};
        await fs.writeFile(filePath, JSON.stringify(initial, null, 2));
      }
    }
  } catch (error) {
    // Ignore if not in a GSD project
  }
}

async function handleFileChange(input, result) {
  const filePath = input.file_path;
  if (!filePath) return;

  // Normalize path for cross-platform compatibility
  const normalizedPath = normalizePath(filePath);

  // Skip planning files (check both forward and back slashes)
  if (normalizedPath.includes('.planning/') || filePath.includes('.planning\\')) return;

  // Update artifacts registry
  const artifactsPath = path.join(BLACKBOARD_DIR, 'artifacts.json');
  const artifacts = await readJSON(artifactsPath);

  // Store with normalized path (forward slashes) for consistency
  artifacts[normalizedPath] = {
    ...artifacts[normalizedPath],
    last_modified: new Date().toISOString(),
    exists: true
  };

  await writeJSON(artifactsPath, artifacts);

  // Emit event
  await emitEvent({
    type: 'artifact:modified',
    path: normalizedPath,
    timestamp: new Date().toISOString()
  });
}

async function handleGitCommit(input, result) {
  // Extract commit hash from output
  const commitMatch = result.output?.match(/\[[\w-]+\s+([a-f0-9]+)\]/);
  const commitHash = commitMatch ? commitMatch[1] : null;

  if (!commitHash) return;

  // Update shared context
  const contextPath = path.join(BLACKBOARD_DIR, 'shared-context.json');
  const context = await readJSON(contextPath);

  context.last_commit = {
    hash: commitHash,
    timestamp: new Date().toISOString()
  };

  await writeJSON(contextPath, context);

  // Emit event
  await emitEvent({
    type: 'commit:created',
    hash: commitHash,
    timestamp: new Date().toISOString()
  });
}

function isGitCommit(command) {
  return command?.includes('git commit');
}

async function emitEvent(event) {
  const eventsPath = path.join(BLACKBOARD_DIR, 'events.json');
  const data = await readJSON(eventsPath);

  data.events.push({
    ...event,
    id: ++data.lastEventId
  });

  // Keep only last 1000 events
  if (data.events.length > 1000) {
    data.events = data.events.slice(-1000);
  }

  await writeJSON(eventsPath, data);
}

async function readJSON(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function writeJSON(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Export metadata for hook registration
export const metadata = {
  name: 'gsd-blackboard-sync',
  description: 'Syncs file changes and commits to GSD blackboard',
  triggers: ['PostToolUse'],
  tools: ['Write', 'Edit', 'Bash']
};
