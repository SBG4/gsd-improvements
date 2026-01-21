---
name: gsd:routing-stats
description: Show agent performance history and model routing statistics
argument-hint: "[--reset | --export]"
allowed-tools:
  - Read
  - Bash
---

<objective>
Display agent routing performance statistics to help optimize model selection.

Shows:
- Task type → model performance mapping
- Success rates by model tier
- Average execution times
- Common deviations by task type
</objective>

<context>
@./.claude/get-shit-done/patterns/routing-history.json
</context>

<process>

## 1. Parse Arguments

| Flag | Action |
|------|--------|
| `--reset` | Clear routing history |
| `--export` | Export as CSV for analysis |
| (none) | Display statistics |

## 2. Load Routing History

```bash
ROUTING_FILE=".claude/get-shit-done/patterns/routing-history.json"
if [[ -f "$ROUTING_FILE" ]]; then
  ROUTING_DATA=$(cat "$ROUTING_FILE")
else
  echo "No routing history found. Run /gsd:learn to capture statistics."
  exit 0
fi
```

## 3. Display Statistics

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► AGENT ROUTING STATISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Data from:** {sample_count} executions
**Last updated:** {timestamp}

───────────────────────────────────────────────────────

## Performance by Task Type

| Task Type | Best Model | Success | Avg Time | Samples |
|-----------|------------|---------|----------|---------|
| auth-impl | opus | 95% | 45min | 24 |
| crud-api | sonnet | 98% | 18min | 156 |
| ui-styling | haiku | 94% | 12min | 89 |
| db-schema | sonnet | 97% | 22min | 67 |
| test-gen | sonnet | 91% | 25min | 45 |
| refactor | opus | 88% | 35min | 32 |

───────────────────────────────────────────────────────

## Model Tier Summary

| Model | Tasks | Success Rate | Avg Time | Cost Index |
|-------|-------|--------------|----------|------------|
| opus | 56 | 93% | 38min | 1.0x |
| sonnet | 268 | 95% | 21min | 0.3x |
| haiku | 89 | 92% | 14min | 0.1x |

───────────────────────────────────────────────────────

## Common Deviations by Type

**auth-impl:**
- missing-validation (23%)
- edge-runtime-issues (15%)
- token-refresh-race (8%)

**crud-api:**
- missing-error-handling (12%)
- pagination-issues (8%)

**ui-styling:**
- accessibility-gaps (18%)
- responsive-issues (11%)

───────────────────────────────────────────────────────

## Recommendations

Based on your data:

1. **Use Opus for:**
   - Authentication (complex, security-critical)
   - Major refactoring (needs deep understanding)

2. **Use Sonnet for:**
   - CRUD operations (good balance)
   - Database schema (reliable)
   - Test generation (consistent)

3. **Use Haiku for:**
   - UI styling (fast, good enough)
   - Simple config changes
   - Documentation updates

───────────────────────────────────────────────────────

**Tip:** Update your `.planning/config.json` model_profile
based on these statistics, or use dynamic routing.
```

## 4. Handle Reset

If `--reset`:

```bash
rm -f "$ROUTING_FILE"
echo "Routing history cleared."
```

## 5. Handle Export

If `--export`:

```bash
# Convert JSON to CSV
echo "task_type,best_model,success_rate,avg_duration,sample_size" > routing-stats.csv
# ... parse and append rows
echo "Exported to routing-stats.csv"
```

</process>

<success_criteria>
- [ ] Routing history loaded
- [ ] Statistics formatted clearly
- [ ] Recommendations generated
- [ ] Reset/export handled if requested
</success_criteria>
