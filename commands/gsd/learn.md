---
name: gsd:learn
description: Capture patterns from current project for reuse
argument-hint: "[--all | --phase <N> | --routing]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

<objective>
Capture successful patterns from the current project for reuse in future projects.

This command extracts:
- Successful plan→summary mappings
- Task structures that worked well
- Decisions and their outcomes
- Agent routing performance
- Project-specific conventions
</objective>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@./.claude/get-shit-done/patterns/README.md
</context>

<process>

## 1. Parse Arguments

| Flag | Action |
|------|--------|
| `--all` | Capture all patterns from entire project |
| `--phase <N>` | Capture patterns from specific phase |
| `--routing` | Only update routing history |
| (none) | Capture from completed phases only |

## 2. Identify Successful Patterns

```bash
# Find all verified phases
for phase_dir in .planning/phases/*/; do
  # Check for VERIFICATION.md with passed status
  if grep -q "status: passed" "${phase_dir}"*-VERIFICATION.md 2>/dev/null; then
    echo "Verified: $phase_dir"
  fi
done
```

## 3. Extract Plan→Summary Mappings

For each verified phase:

1. Read PLAN.md files
2. Read corresponding SUMMARY.md files
3. Extract:
   - Task structure
   - Wave assignments
   - Dependencies
   - Tech stack used
   - Decisions made

## 4. Identify Reusable Patterns

Classify patterns by domain:

| Domain | Detection |
|--------|-----------|
| auth | JWT, login, register, session, token |
| crud | create, read, update, delete, list |
| api | endpoint, route, REST, GraphQL |
| ui | component, page, layout, form |
| db | schema, model, migration, query |
| test | test, spec, mock, fixture |

## 5. Write Pattern Files

For each identified pattern:

```bash
PATTERN_FILE=".claude/get-shit-done/patterns/successful-plans/${DOMAIN}-${NAME}.md"
```

Pattern template:
```markdown
---
name: {pattern-name}
domain: {domain}
tech: [{technologies}]
success_rate: 100%
times_used: 1
source_project: {project-name}
captured_at: {timestamp}
---

## Context
{When to use this pattern}

## Pattern

### Tasks
{Task structure from successful plan}

### Key Decisions
{Decisions made during execution}

### Common Pitfalls
{Issues encountered and how they were resolved}

### Wave Structure
{Dependency/wave assignment}
```

## 6. Update Routing History

Track agent performance:

```bash
cat > .claude/get-shit-done/patterns/routing-history.json << 'EOF'
{
  "task_types": {
    "{task-type}": {
      "best_model": "{model}",
      "average_duration": "{duration}",
      "success_rate": {rate},
      "sample_size": {count},
      "common_deviations": [{deviations}]
    }
  },
  "updated_at": "{timestamp}"
}
EOF
```

## 7. Extract Conventions

From codebase intelligence:

```bash
# Read existing conventions
cat .planning/intel/conventions.json 2>/dev/null

# Save to patterns
cp .planning/intel/conventions.json \
   .claude/get-shit-done/patterns/conventions-learned/$(basename $(pwd)).json
```

## 8. Report Results

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► PATTERNS CAPTURED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Project:** {project-name}
**Phases Analyzed:** {count}
**Patterns Captured:** {count}

### New Patterns

| Pattern | Domain | Tech |
|---------|--------|------|
| jwt-auth | auth | jose, prisma |
| crud-api | api | next.js |

### Routing Updates

| Task Type | Best Model | Success Rate |
|-----------|------------|--------------|
| auth | opus | 95% |
| crud | sonnet | 98% |

### Conventions Saved

- Naming: camelCase variables, PascalCase components
- Structure: /src/app for pages, /src/lib for utilities

───────────────────────────────────────────────────────

Patterns saved to `.claude/get-shit-done/patterns/`

Use `/gsd:apply-patterns` in new projects.
```

</process>

<success_criteria>
- [ ] Verified phases identified
- [ ] Plan→Summary mappings extracted
- [ ] Patterns classified by domain
- [ ] Pattern files written
- [ ] Routing history updated
- [ ] Conventions captured
- [ ] Results reported to user
</success_criteria>
