---
name: gsd:sessions
description: List and manage saved session snapshots
argument-hint: "[list | show <id> | delete <id> | clean]"
allowed-tools:
  - Read
  - Bash
  - Glob
---

<objective>
Manage session snapshots for work continuity.

Commands:
- `list` - List all saved sessions
- `show <id>` - Show details of a specific session
- `delete <id>` - Delete a session snapshot
- `clean` - Remove sessions older than 7 days
- (none) - Show most recent session
</objective>

<context>
@./.claude/get-shit-done/sessions/protocol.md
</context>

<process>

## 1. Parse Arguments

| Subcommand | Action |
|------------|--------|
| (none) | Show latest session |
| `list` | List all sessions |
| `show <id>` | Show specific session |
| `delete <id>` | Delete session |
| `clean` | Remove old sessions |

## 2. List Sessions

```bash
echo "| Date | ID | Phase | Status | Duration |"
echo "|------|-----|-------|--------|----------|"

for session in .planning/sessions/*.yaml; do
  [[ "$session" == *"latest.yaml" ]] && continue

  id=$(grep "^session_id:" "$session" | cut -d: -f2 | xargs)
  date=$(grep "^timestamp:" "$session" | cut -d: -f2- | xargs | cut -dT -f1)
  phase=$(grep "phase:" "$session" | head -1 | cut -d: -f2 | xargs)
  status=$(grep "status:" "$session" | head -1 | cut -d: -f2 | xargs)
  duration=$(grep "duration_minutes:" "$session" | cut -d: -f2 | xargs)

  echo "| $date | $id | $phase | $status | ${duration}min |"
done
```

Output:
```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SAVED SESSIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Date | ID | Phase | Status | Duration |
|------|-----|-------|--------|----------|
| 2024-01-15 | abc123 | 02-auth | in_progress | 45min |
| 2024-01-14 | def456 | 01-foundation | completed | 120min |
| 2024-01-13 | ghi789 | 01-foundation | blocked | 30min |

───────────────────────────────────────────────────────

**Latest:** abc123 (2024-01-15, 02-auth)

Commands:
- `/gsd:sessions show abc123` - View details
- `/gsd:resume-work` - Resume from latest
- `/gsd:sessions clean` - Remove old sessions
```

## 3. Show Latest Session (default)

```bash
LATEST=".planning/sessions/latest.yaml"
if [[ ! -f "$LATEST" ]]; then
  echo "No sessions found."
  exit 0
fi

# Follow symlink
SESSION=$(readlink "$LATEST" || cat "$LATEST")
```

Output:
```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► LATEST SESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Session ID:** abc123
**Timestamp:** 2024-01-15 10:30 (2 hours ago)
**Duration:** 45 minutes

───────────────────────────────────────────────────────

## Position

- **Milestone:** v1.0
- **Phase:** 02-auth (Authentication)
- **Plan:** 02-03 (JWT Implementation)
- **Task:** 2 of 3 (refresh token rotation)
- **Status:** In Progress

───────────────────────────────────────────────────────

## Uncommitted Changes

| File | Status | Lines |
|------|--------|-------|
| src/lib/auth.ts | modified | +45 |
| src/lib/jwt.ts | new | +78 |

───────────────────────────────────────────────────────

## Next Actions

1. Complete task 2: refresh token rotation
2. Run verification: test auth flow
3. Continue to task 3 if passed

───────────────────────────────────────────────────────

## Blockers

⚠️ **Decision needed:** Should refresh tokens be stored in database or memory?
- Options: database, redis, in-memory
- Awaiting: user decision

───────────────────────────────────────────────────────

**Resume:** `/gsd:resume-work`
```

## 4. Show Specific Session

```bash
SESSION_ID=$1
SESSION_FILE=$(ls .planning/sessions/*-${SESSION_ID}.yaml 2>/dev/null | head -1)

if [[ -z "$SESSION_FILE" ]]; then
  echo "Session $SESSION_ID not found"
  exit 1
fi

# Display session details (same format as latest)
```

## 5. Delete Session

```bash
SESSION_ID=$1
SESSION_FILE=$(ls .planning/sessions/*-${SESSION_ID}.yaml 2>/dev/null | head -1)

if [[ -z "$SESSION_FILE" ]]; then
  echo "Session $SESSION_ID not found"
  exit 1
fi

# Check if it's the latest
LATEST=$(readlink .planning/sessions/latest.yaml 2>/dev/null)
if [[ "$(basename $SESSION_FILE)" == "$LATEST" ]]; then
  rm .planning/sessions/latest.yaml
fi

rm "$SESSION_FILE"
rm "${SESSION_FILE%.yaml}.md" 2>/dev/null

echo "Deleted session $SESSION_ID"
```

## 6. Clean Old Sessions

```bash
CUTOFF=$(date -d "7 days ago" +%s 2>/dev/null || date -v-7d +%s)

for session in .planning/sessions/*.yaml; do
  [[ "$session" == *"latest.yaml" ]] && continue

  timestamp=$(grep "^timestamp:" "$session" | cut -d: -f2- | xargs)
  session_epoch=$(date -d "$timestamp" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$timestamp" +%s)

  if [[ $session_epoch -lt $CUTOFF ]]; then
    # Move to archive
    mkdir -p .planning/sessions/archive
    mv "$session" .planning/sessions/archive/
    mv "${session%.yaml}.md" .planning/sessions/archive/ 2>/dev/null
    echo "Archived: $(basename $session)"
  fi
done

echo "Cleanup complete."
```

</process>

<success_criteria>
- [ ] Sessions listed with key info
- [ ] Latest session displayed by default
- [ ] Specific session viewable
- [ ] Delete removes session and updates latest
- [ ] Clean archives old sessions
</success_criteria>
