# GSD Pattern Bank

## Overview

The pattern bank captures successful execution patterns for reuse across projects. It implements trajectory-based learning where successful plan→summary mappings are archived for future reference.

## Directory Structure

```
patterns/
├── successful-plans/      # Plans that verified successfully
│   ├── auth-jwt.md       # JWT authentication pattern
│   ├── crud-api.md       # Basic CRUD API pattern
│   └── ...
├── failure-patterns/      # Plans that required revision
│   ├── common-stubs.md   # Stub patterns that failed verification
│   └── ...
├── conventions-learned/   # Project-specific conventions
│   ├── naming.json       # Naming convention patterns
│   └── structure.json    # Directory structure patterns
├── routing-history.json   # Agent → task type performance
└── README.md             # This file
```

## Capturing Patterns

### After Successful Verification

When `/gsd:execute-phase` completes with `passed` status:

1. Extract plan→summary mapping
2. Identify reusable patterns:
   - Task structures that worked well
   - Dependency graphs that executed cleanly
   - Wave assignments that maximized parallelism
3. Archive to `successful-plans/`

### After Revision Cycles

When plans require checker revision:

1. Capture the original issue
2. Record the fix applied
3. Archive to `failure-patterns/` for future avoidance

## Pattern Schema

### Successful Plan Pattern

```yaml
---
name: jwt-authentication
domain: auth
tech: [jose, prisma, nextjs]
success_rate: 95%
times_used: 12
---

## Context
When implementing JWT authentication in Next.js with Prisma.

## Pattern

### Tasks
1. Create User model with password field
2. Create auth API routes (login, register, logout)
3. Create JWT utilities with refresh rotation

### Key Decisions
- Use `jose` not `jsonwebtoken` (Edge runtime compatibility)
- Store refresh token in httpOnly cookie
- Access token: 15min, Refresh token: 7 days

### Common Pitfalls
- Forgetting to hash password before storage
- Not handling token refresh race conditions
- Missing CORS configuration

### Wave Structure
Wave 1: User model (independent)
Wave 2: Auth routes (needs model)
Wave 3: Verification checkpoint
```

### Routing History Schema

```json
{
  "task_types": {
    "auth-implementation": {
      "best_model": "opus",
      "average_duration": "45min",
      "success_rate": 0.92,
      "common_deviations": ["missing-validation", "edge-runtime-issues"]
    },
    "crud-api": {
      "best_model": "sonnet",
      "average_duration": "20min",
      "success_rate": 0.98,
      "common_deviations": []
    },
    "ui-styling": {
      "best_model": "haiku",
      "average_duration": "15min",
      "success_rate": 0.95,
      "common_deviations": ["accessibility-gaps"]
    }
  }
}
```

## Using Patterns

### During Planning (`/gsd:plan-phase`)

```markdown
<step name="check_pattern_bank">
Before creating new plans:
1. Check patterns/successful-plans/ for similar work
2. If match found, adapt pattern to current context
3. Check failure-patterns/ to avoid known issues
</step>
```

### During Model Selection

```markdown
<step name="route_to_best_model">
For each task:
1. Classify task type (auth, crud, ui, etc.)
2. Check routing-history.json for best model
3. Use historical best performer or default to config profile
</step>
```

## Commands

- `/gsd:learn` - Capture patterns from current project
- `/gsd:apply-patterns` - Apply learned patterns to new project
- `/gsd:routing-stats` - Show agent performance history
