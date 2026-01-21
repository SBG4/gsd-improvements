# Session Continuity Protocol

## Overview

Session continuity ensures no work is lost when Claude Code sessions end unexpectedly or when users take breaks. It implements automatic state capture and seamless recovery.

## Directory Structure

```
.planning/sessions/
├── latest.yaml           # Symlink to most recent session
├── 2024-01-15-abc123.yaml    # Session snapshots
├── 2024-01-15-abc123.md      # Human-readable summary
└── archive/              # Older sessions (>7 days)
```

## Session Snapshot Schema

```yaml
# .planning/sessions/{date}-{id}.yaml
---
session_id: "abc123"
timestamp: "2024-01-15T10:30:00Z"
duration_minutes: 45

# Current position in workflow
position:
  milestone: "v1.0"
  phase: "02-auth"
  phase_name: "Authentication"
  plan: "02-03"
  plan_name: "JWT Implementation"
  task: 2
  task_name: "Create refresh token rotation"
  status: "in_progress"  # in_progress, blocked, completed

# Context that was loaded
context_loaded:
  - ".planning/STATE.md"
  - ".planning/phases/02-auth/02-03-PLAN.md"
  - "src/lib/auth.ts"
  - "src/app/api/auth/login/route.ts"

# Files modified but not committed
uncommitted_changes:
  - path: "src/lib/auth.ts"
    status: "modified"
    lines_changed: 45
  - path: "src/lib/jwt.ts"
    status: "new"
    lines_changed: 78

# Decisions made this session
decisions_made:
  - id: "dec-session-001"
    decision: "Use jose library for JWT"
    rationale: "Edge runtime compatibility"
    affects: ["all-auth-code"]

# Questions/blockers encountered
blockers:
  - type: "decision"
    description: "Should refresh tokens be stored in database or memory?"
    options: ["database", "redis", "in-memory"]
    awaiting: "user-decision"

# What to do next
next_actions:
  - "Complete task 2: refresh token rotation"
  - "Run verification: test auth flow end-to-end"
  - "If verification passes, continue to task 3"

# Performance metrics
metrics:
  tasks_completed: 1
  tasks_remaining: 2
  estimated_completion: "15-30 minutes"
---
```

## Human-Readable Summary

```markdown
# Session Summary: 2024-01-15

## Position
- **Phase:** 02-auth (Authentication)
- **Plan:** 02-03 (JWT Implementation)
- **Task:** 2 of 3 (refresh token rotation)
- **Status:** In Progress

## What Was Done
1. Task 1: Created JWT utility functions
   - Commit: `abc1234` feat(02-03): implement JWT utilities
   - Files: `src/lib/jwt.ts`

## What's Next
1. Complete refresh token rotation logic
2. Run tests to verify auth flow
3. Move to task 3: protected route middleware

## Uncommitted Changes
- `src/lib/auth.ts` (modified, +45 lines)
- `src/lib/jwt.ts` (new, +78 lines)

## Notes
- Using jose library (not jsonwebtoken) for Edge runtime
- Access token: 15min, Refresh token: 7 days

## Resume Command
```bash
/gsd:resume-work
```
```

## Automatic Capture Triggers

### On Session End
When `/gsd:pause-work` is called or session ends:

```bash
# Create session snapshot
SESSION_ID=$(date +%s | md5sum | head -c 6)
SESSION_FILE=".planning/sessions/$(date +%Y-%m-%d)-${SESSION_ID}.yaml"

# Capture state
cat > "$SESSION_FILE" << EOF
session_id: "${SESSION_ID}"
timestamp: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
# ... full schema
EOF

# Update latest symlink
ln -sf "$(basename $SESSION_FILE)" .planning/sessions/latest.yaml

# Create human-readable summary
# ... generate markdown
```

### On Checkpoint
When executor hits checkpoint:
- Capture current task state
- Record checkpoint type and details
- Store user prompt if decision checkpoint

### Periodic Auto-Save
Every 10 minutes during active work:
- Capture lightweight state snapshot
- Don't create new file if no changes
- Update existing session file

## Recovery Process

### `/gsd:resume-work` Command

1. **Load Latest Session**
```bash
SESSION=$(cat .planning/sessions/latest.yaml)
```

2. **Verify State**
- Check uncommitted files still exist
- Verify commits in session match git log
- Confirm plan files unchanged

3. **Restore Context**
- Load same context files as previous session
- Reconstruct mental model from session state
- Present summary to user

4. **Offer Continuation Options**
```markdown
## Session Recovered

**Last Activity:** 2024-01-15 10:30 (2 hours ago)

### Position
Phase 02-auth, Plan 02-03, Task 2 (in progress)

### Uncommitted Changes
- src/lib/auth.ts (+45 lines)
- src/lib/jwt.ts (+78 lines, new)

### Options
1. **Continue** - Resume from task 2
2. **Review** - Show what was done before continuing
3. **Rollback** - Discard uncommitted changes, restart task 2
4. **Different** - Start different work, save this progress

Select: [1/2/3/4]
```

## Integration with Hooks

### gsd-session-save.js
```javascript
// Triggered on: PreToolUse (for pause-work), PostToolUse (for commits)
export default async function({ tool, input, session }) {
  if (tool === 'pause-work' || shouldAutoSave(session)) {
    await captureSessionState(session);
  }
}
```

### gsd-session-restore.js
```javascript
// Triggered on: SessionStart
export default async function({ session }) {
  const latest = await loadLatestSession();
  if (latest && !isStale(latest)) {
    return {
      prompt: generateResumePrompt(latest),
      suggestResume: true
    };
  }
}
```

## Archive Policy

- Sessions older than 7 days: Move to `archive/`
- Sessions older than 30 days: Delete
- Keep at most 50 sessions in main directory
- Always keep sessions with `blockers` or uncommitted changes

## Benefits

1. **No Lost Work**: Uncommitted changes tracked and recoverable
2. **Seamless Continuation**: Resume exactly where you left off
3. **Decision Audit Trail**: All decisions captured with rationale
4. **Time Tracking**: Automatic duration and velocity metrics
5. **Multiple Devices**: Session files sync via git (if committed)
