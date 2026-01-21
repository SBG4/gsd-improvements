/**
 * GSD Session Save Hook
 *
 * Automatically saves session state for continuity.
 * Triggered on: PreToolUse (for pause-work), periodic auto-save
 *
 * Cross-platform compatible (Windows/macOS/Linux)
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Cross-platform path handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use path.join for Windows compatibility
const SESSIONS_DIR = path.join('.planning', 'sessions');

// Normalize paths for consistent storage
function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}
const AUTO_SAVE_INTERVAL = 10 * 60 * 1000; // 10 minutes

let lastAutoSave = 0;

export default async function sessionSaveHook({ tool, input, session, context }) {
  try {
    // Check if we're in a GSD project
    try {
      await fs.access('.planning');
    } catch {
      return; // Not a GSD project
    }

    // Save on pause-work command
    if (tool === 'Skill' && input?.skill === 'gsd:pause-work') {
      await saveSession(session, context, 'manual');
      return;
    }

    // Auto-save periodically
    const now = Date.now();
    if (now - lastAutoSave > AUTO_SAVE_INTERVAL) {
      await saveSession(session, context, 'auto');
      lastAutoSave = now;
    }
  } catch (error) {
    console.error('[gsd-session-save] Error:', error.message);
  }
}

async function saveSession(session, context, trigger) {
  // Ensure sessions directory exists
  await fs.mkdir(SESSIONS_DIR, { recursive: true });

  // Generate session ID
  const sessionId = crypto.randomBytes(3).toString('hex');
  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-${sessionId}.yaml`;
  const filepath = path.join(SESSIONS_DIR, filename);

  // Gather session state
  const state = await gatherSessionState(context);

  // Create YAML content
  const yaml = generateSessionYAML(sessionId, state, trigger);

  // Write session file
  await fs.writeFile(filepath, yaml);

  // Update latest symlink
  const latestPath = path.join(SESSIONS_DIR, 'latest.yaml');
  try {
    await fs.unlink(latestPath);
  } catch {
    // Ignore if doesn't exist
  }
  await fs.symlink(filename, latestPath);

  // Create human-readable summary
  const summaryPath = filepath.replace('.yaml', '.md');
  const summary = generateSessionSummary(sessionId, state);
  await fs.writeFile(summaryPath, summary);

  console.log(`[gsd-session-save] Session saved: ${filename}`);
}

async function gatherSessionState(context) {
  const state = {
    timestamp: new Date().toISOString(),
    position: {},
    uncommittedChanges: [],
    decisionsThisSession: [],
    blockers: [],
    nextActions: []
  };

  // Read STATE.md for position
  try {
    const stateContent = await fs.readFile('.planning/STATE.md', 'utf-8');
    state.position = parseStatePosition(stateContent);
  } catch {
    // No STATE.md
  }

  // Check for uncommitted changes
  try {
    const { execSync } = await import('child_process');
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' });
    state.uncommittedChanges = parseGitStatus(gitStatus);
  } catch {
    // Not a git repo or git not available
  }

  // Read recent decisions from blackboard
  try {
    const decisions = await fs.readFile('.planning/blackboard/decisions.json', 'utf-8');
    state.decisionsThisSession = JSON.parse(decisions).slice(-5);
  } catch {
    // No decisions
  }

  return state;
}

function parseStatePosition(content) {
  const position = {};

  const phaseMatch = content.match(/Phase:\s*(\d+)\s*of\s*(\d+)/i);
  if (phaseMatch) {
    position.phase = phaseMatch[1];
    position.totalPhases = phaseMatch[2];
  }

  const planMatch = content.match(/Plan:\s*(\d+)\s*of\s*(\d+)/i);
  if (planMatch) {
    position.plan = planMatch[1];
    position.totalPlans = planMatch[2];
  }

  const statusMatch = content.match(/Status:\s*(.+)/i);
  if (statusMatch) {
    position.status = statusMatch[1].trim();
  }

  return position;
}

function parseGitStatus(status) {
  return status
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const statusCode = line.substring(0, 2).trim();
      const filepath = line.substring(3);
      return {
        // Normalize path for cross-platform consistency
        path: normalizePath(filepath),
        status: statusCode === 'M' ? 'modified' :
                statusCode === 'A' ? 'added' :
                statusCode === '??' ? 'new' : statusCode
      };
    });
}

function generateSessionYAML(sessionId, state, trigger) {
  return `---
session_id: "${sessionId}"
timestamp: "${state.timestamp}"
trigger: "${trigger}"

position:
  phase: "${state.position.phase || 'unknown'}"
  phase_total: "${state.position.totalPhases || 'unknown'}"
  plan: "${state.position.plan || 'unknown'}"
  plan_total: "${state.position.totalPlans || 'unknown'}"
  status: "${state.position.status || 'unknown'}"

uncommitted_changes:
${state.uncommittedChanges.map(c => `  - path: "${c.path}"
    status: "${c.status}"`).join('\n') || '  []'}

decisions_made:
${state.decisionsThisSession.map(d => `  - "${d.decision || d}"`).join('\n') || '  []'}

next_actions:
  - "Resume from current position"
  - "Complete current task"
---
`;
}

function generateSessionSummary(sessionId, state) {
  const changes = state.uncommittedChanges.length;
  const changesList = state.uncommittedChanges
    .map(c => `- \`${c.path}\` (${c.status})`)
    .join('\n');

  return `# Session Summary: ${sessionId}

**Saved:** ${new Date(state.timestamp).toLocaleString()}

## Position
- **Phase:** ${state.position.phase || '?'} of ${state.position.totalPhases || '?'}
- **Plan:** ${state.position.plan || '?'} of ${state.position.totalPlans || '?'}
- **Status:** ${state.position.status || 'Unknown'}

## Uncommitted Changes (${changes})
${changesList || 'None'}

## Resume
\`\`\`
/gsd:resume-work
\`\`\`
`;
}

// Export metadata
export const metadata = {
  name: 'gsd-session-save',
  description: 'Saves session state for work continuity',
  triggers: ['PreToolUse', 'Periodic'],
  tools: ['Skill']
};
