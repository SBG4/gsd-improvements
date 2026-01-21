---
name: gsd:apply-patterns
description: Apply learned patterns to current project planning
argument-hint: "[--domain <domain>] [--list]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
---

<objective>
Apply previously learned patterns to accelerate planning in the current project.

This command:
- Lists available patterns matching current context
- Suggests relevant patterns during planning
- Adapts pattern templates to current tech stack
</objective>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@./.claude/get-shit-done/patterns/README.md
</context>

<process>

## 1. Parse Arguments

| Flag | Action |
|------|--------|
| `--list` | List all available patterns |
| `--domain <domain>` | Filter patterns by domain (auth, crud, api, ui, db, test) |
| (none) | Auto-detect relevant patterns for current phase |

## 2. List Available Patterns

```bash
# List all patterns
for pattern in .claude/get-shit-done/patterns/successful-plans/*.md; do
  # Extract frontmatter
  name=$(grep "^name:" "$pattern" | cut -d: -f2 | xargs)
  domain=$(grep "^domain:" "$pattern" | cut -d: -f2 | xargs)
  tech=$(grep "^tech:" "$pattern" | cut -d: -f2-)
  success=$(grep "^success_rate:" "$pattern" | cut -d: -f2 | xargs)

  echo "| $name | $domain | $tech | $success |"
done
```

If `--list`:
```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► AVAILABLE PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Pattern | Domain | Tech | Success Rate |
|---------|--------|------|--------------|
| jwt-auth | auth | jose, prisma, nextjs | 95% |
| crud-api | api | prisma, nextjs | 98% |
| react-form | ui | react-hook-form, zod | 92% |

───────────────────────────────────────────────────────

Use `/gsd:apply-patterns --domain auth` to filter.
```

## 3. Auto-Detect Relevant Patterns

If no arguments, detect from current context:

```bash
# Read current phase goal
PHASE_GOAL=$(grep -A5 "### Phase" .planning/ROADMAP.md | grep "Goal:" | head -1)

# Read project tech stack
TECH_STACK=$(grep -A10 "## Tech Stack" .planning/PROJECT.md 2>/dev/null)

# Match patterns
for pattern in .claude/get-shit-done/patterns/successful-plans/*.md; do
  # Score relevance based on:
  # - Domain match (auth in goal + auth pattern)
  # - Tech match (nextjs in stack + nextjs pattern)
  # - Success rate
done
```

## 4. Present Matching Patterns

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► MATCHING PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Current Phase:** Authentication
**Detected Tech:** Next.js, Prisma, TypeScript

### Recommended Patterns

**1. jwt-auth** (95% match)
- Domain: auth
- Tech: jose, prisma, nextjs
- Success Rate: 95%
- Used: 12 times

**Key Decisions from Pattern:**
- Use jose (not jsonwebtoken) for Edge runtime
- Refresh token rotation with 7-day expiry
- Store in httpOnly cookie

**2. prisma-user-model** (80% match)
- Domain: db
- Tech: prisma
- Success Rate: 98%
- Used: 8 times

───────────────────────────────────────────────────────

Apply pattern? [1/2/skip]
```

## 5. Adapt Pattern to Current Context

When user selects a pattern:

1. Read pattern template
2. Adapt to current tech stack:
   - Replace tech-specific details if stack differs
   - Keep structure and decisions
   - Update file paths to match project structure

3. Generate adapted plan outline:

```markdown
## Adapted Pattern: jwt-auth

### Original Tech
- jose, prisma, nextjs

### Your Tech
- jose, prisma, nextjs (exact match)

### Suggested Task Structure

1. **Create User Model**
   - Files: prisma/schema.prisma
   - Add User model with password field

2. **Create Auth Utilities**
   - Files: src/lib/auth.ts
   - JWT functions with jose

3. **Create Auth Routes**
   - Files: src/app/api/auth/*/route.ts
   - Login, register, logout, refresh

### Key Decisions (from pattern)
- ✓ Use jose for Edge runtime compatibility
- ✓ Access token: 15min, Refresh: 7 days
- ✓ httpOnly cookie storage

### Pitfalls to Avoid (from pattern)
- Don't forget password hashing before storage
- Handle token refresh race conditions
- Configure CORS properly

───────────────────────────────────────────────────────

Use this as basis for /gsd:plan-phase? [yes/no/customize]
```

## 6. Integration with Planning

If user confirms, pattern context is added to next `/gsd:plan-phase`:

```yaml
# Injected into planner context
pattern_context:
  pattern: jwt-auth
  decisions:
    - "Use jose for JWT"
    - "15min access, 7 day refresh"
  pitfalls:
    - "Hash passwords"
    - "Handle refresh race"
  task_structure:
    - "User model"
    - "Auth utilities"
    - "Auth routes"
```

</process>

<success_criteria>
- [ ] Patterns listed or filtered correctly
- [ ] Auto-detection matches relevant patterns
- [ ] Pattern adapted to current tech stack
- [ ] User can select and apply pattern
- [ ] Pattern context available for planning
</success_criteria>
