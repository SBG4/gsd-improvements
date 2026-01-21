# Community-Requested Fixes

## Overview

This document addresses common issues reported by GSD users and provides solutions.

## Fix 1: Windows Path Handling

### Problem
Hooks fail on Windows due to forward slash assumptions in path handling.

### Solution
All hooks now use platform-agnostic path handling:

```javascript
import path from 'path';

// WRONG: Assumes Unix paths
const filePath = baseDir + '/' + filename;

// CORRECT: Platform-agnostic
const filePath = path.join(baseDir, filename);

// For glob patterns (always use forward slashes)
const globPattern = path.posix.join('**', '*.md');
```

### Affected Files
- All hooks in `.claude/hooks/`
- Session protocol file handling
- Blackboard sync operations

## Fix 2: Query Command Infrastructure

### Problem
The `/gsd:query` command fails with "graph.db not found" because the semantic indexing infrastructure isn't initialized.

### Solution
Create initialization command and fallback behavior:

```bash
# Initialize query infrastructure
/gsd:init-query

# Creates:
# - .planning/index/graph.db (SQLite for relationships)
# - .planning/index/embeddings/ (vector store)
# - .planning/index/schema.json (index configuration)
```

### Fallback Behavior
When graph.db doesn't exist, fall back to file-based search:

```markdown
<step name="query_fallback">
If graph.db not found:
1. Use grep-based search across .planning/
2. Parse PLAN.md files for relationships
3. Return results without semantic ranking
4. Suggest: "Run /gsd:init-query for better results"
</step>
```

## Fix 3: Data Persistence Between Sessions

### Problem
State is lost when Claude Code context resets or session ends unexpectedly.

### Solution
Implement automatic state persistence:

1. **Auto-save on tool calls** (via hooks)
2. **Periodic snapshots** every 10 minutes
3. **Recovery protocol** on session start

```yaml
# .planning/sessions/latest.yaml
session_id: "abc123"
timestamp: "2024-01-15T10:30:00Z"
position:
  phase: "02"
  plan: "03"
  task: 2
uncommitted_changes:
  - path: "src/api/users.ts"
    status: "modified"
```

## Fix 4: Empty Verification Reports

### Problem
Verification sometimes produces empty reports when tests aren't found.

### Solution
Add explicit checks and fallback verification:

```markdown
<step name="verification_with_fallback">
1. Check if test files exist for current plan
2. If no tests found:
   - Run static analysis (ESLint, type checking)
   - Check for compilation errors
   - Verify file structure matches spec
   - Report: "No tests found, using static verification"
3. If tests exist:
   - Run test suite
   - Parse and report results
</step>
```

## Fix 5: Hook Permission Errors

### Problem
Hooks fail silently due to file permission issues on some systems.

### Solution
Add permission checks and helpful error messages:

```javascript
// In hook initialization
async function checkPermissions(dir) {
  try {
    await fs.access(dir, fs.constants.W_OK);
    return true;
  } catch (error) {
    console.error(`[gsd] Permission denied: ${dir}`);
    console.error(`[gsd] Run: chmod -R u+w ${dir}`);
    return false;
  }
}
```

## Fix 6: Large Project Performance

### Problem
GSD slows down significantly on projects with 1000+ files.

### Solution
Implement incremental indexing and caching:

```json
// .planning/cache/file-index.json
{
  "lastFullScan": "2024-01-15T10:00:00Z",
  "fileHashes": {
    "src/api/users.ts": "abc123...",
    "src/models/user.ts": "def456..."
  },
  "incrementalScanThreshold": 100
}
```

Only re-index changed files based on hash comparison.

## Fix 7: Conflicting Agent Instructions

### Problem
Multiple agents sometimes give conflicting instructions for the same task.

### Solution
Implement claim-based coordination via blackboard:

```json
// .planning/blackboard/claims.json
{
  "files": {
    "src/api/users.ts": {
      "claimed_by": "gsd-executor",
      "plan": "01-02",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

Before modifying a file, agents must:
1. Check if file is claimed
2. If claimed by another agent, wait or coordinate
3. Claim file before modification
4. Release claim after commit

## Implementation Status

| Fix | Status | Version |
|-----|--------|---------|
| Windows path handling | Implemented | 2.0.0 |
| Query infrastructure | Implemented | 2.0.0 |
| Data persistence | Implemented | 2.0.0 |
| Empty verification | Implemented | 2.0.0 |
| Permission errors | Implemented | 2.0.0 |
| Large project perf | Planned | 2.1.0 |
| Conflicting agents | Implemented | 2.0.0 |

## Reporting Issues

Found a bug? Report it:
1. GitHub Issues: https://github.com/glittercowboy/get-shit-done-cc/issues
2. Include GSD version, OS, and reproduction steps
