# CONTEXT.md Decision Enforcement Protocol

## The Problem This Solves

User decisions made during `/gsd:discuss-phase` get **ignored** during planning or execution because:

1. Planner uses "reasonable defaults" instead of reading CONTEXT.md
2. Executor doesn't verify implementation matches locked decisions
3. Verifier checks artifacts exist but not whether they honor user choices

**Result:** User asks for infinite scroll, gets pagination. User's vision is lost.

---

## Decision Flow Architecture

```
/gsd:discuss-phase
        │
        ▼
  ┌─────────────────────────────────────────────────────────┐
  │                    CONTEXT.md                           │
  │  ┌─────────────────────────────────────────────────┐   │
  │  │ Decision Tables (LOCKED CHOICES)                │   │
  │  │ | Decision        | Choice           | Rationale│   │
  │  │ | List display    | Infinite scroll  | Mobile UX│   │
  │  │ | Cache strategy  | Stale-while-rev  | Perf     │   │
  │  └─────────────────────────────────────────────────┘   │
  │                                                         │
  │  Implementation Notes (REQUIRED APPROACH)               │
  │  - Use Intersection Observer for infinite scroll        │
  │  - 20 items per batch                                   │
  │                                                         │
  │  Out of Scope (DO NOT IMPLEMENT)                        │
  │  - Full offline mutations (Phase 5.4)                   │
  └─────────────────────────────────────────────────────────┘
        │
        ▼
/gsd:plan-phase ──► MUST READ CONTEXT.md ──► Plans honor decisions
        │
        ▼
/gsd:execute-phase ──► Plans checked against CONTEXT.md
        │
        ▼
/gsd:verify-work ──► Verify implementation matches decisions
```

---

## Enforcement Points

### 1. gsd-planner Agent

**Before generating any PLAN.md:**

```markdown
<context_check>
1. Read: .planning/phases/{phase}/*-CONTEXT.md
2. Extract all decision tables
3. For each decision:
   - Note the CHOICE (not the rationale)
   - This is a LOCKED decision, not a suggestion
4. Ensure every plan task honors these decisions
</context_check>
```

**In PLAN.md frontmatter, add:**

```yaml
---
context_honored:
  - decision: "List display"
    choice: "Infinite scroll"
    implemented_in: "task_2"
  - decision: "Cache strategy"
    choice: "Stale-while-revalidate"
    implemented_in: "task_1"
---
```

### 2. gsd-executor Agent

**Before executing any task:**

```markdown
<pre_execution_check>
1. Read CONTEXT.md for this phase
2. Read PLAN.md context_honored section
3. Verify task implementation matches stated choice
4. If implementing "List display" → MUST use infinite scroll
</pre_execution_check>
```

### 3. gsd-verifier Agent

**Verification must include:**

```markdown
<context_verification>
## CONTEXT.md Decision Compliance

| Decision | User Choice | Implemented As | Status |
|----------|-------------|----------------|--------|
| List display | Infinite scroll | Infinite scroll | ✅ HONORED |
| Cache strategy | Stale-while-revalidate | Stale-while-revalidate | ✅ HONORED |

**Decision Compliance:** 2/2 decisions honored (100%)
</context_verification>
```

---

## Integration with Existing GSD Workflow

### discuss-phase.md Enhancement

Add output validation:

```markdown
## CONTEXT.md Output Validation

CONTEXT.md MUST contain:
1. At least one decision table
2. Each decision table has: Decision | Choice | Rationale
3. Implementation notes section (if technical details discussed)
4. Out of scope section (if boundaries discussed)

If user skipped discussion → Note: "No CONTEXT.md - using defaults"
```

### plan-phase.md Enhancement

Add pre-planning step:

```markdown
## Pre-Planning: Load User Decisions

BEFORE spawning planner agent:

1. Check for CONTEXT.md:
   ```bash
   ls .planning/phases/{phase}/*-CONTEXT.md 2>/dev/null
   ```

2. If exists → Include in planner prompt:
   ```markdown
   <locked_decisions>
   {contents of CONTEXT.md decision tables}

   CRITICAL: These are the user's LOCKED decisions.
   Every plan must honor these choices.
   Do NOT use "reasonable defaults" that contradict these.
   </locked_decisions>
   ```

3. If not exists → Offer to run /gsd:discuss-phase first
```

### execute-phase.md Enhancement

Add decision check:

```markdown
## Pre-Execution: Validate Against Context

BEFORE spawning executor:

1. Load CONTEXT.md decisions
2. Load PLAN.md context_honored section
3. Include validation reminder in executor prompt:
   ```markdown
   <decision_validation>
   User decisions from CONTEXT.md:
   {list of decisions}

   Before completing each task, verify:
   - Does implementation match the user's choice?
   - Are implementation notes being followed?
   - Is anything out-of-scope being built?
   </decision_validation>
   ```
```

### verify-work.md Enhancement

Add decision compliance check:

```markdown
## Verification: Decision Compliance

In VERIFICATION.md, add section:

### CONTEXT.md Decision Compliance

For each decision in CONTEXT.md:
1. Identify where it should be implemented
2. Verify implementation matches user's choice
3. Flag any "reasonable default" substitutions

**Pass criteria:** 100% decision compliance OR user-approved deviation
```

---

## Error Recovery

### When Decision Violated

If verifier finds decision not honored:

```markdown
⚠️ CONTEXT.md Decision Violation

| Decision | User Choice | Actual Implementation |
|----------|-------------|----------------------|
| List display | Infinite scroll | Pagination |

**Options:**
1. `/gsd:plan-phase {N} --fix` - Create fix plan honoring decision
2. Ask user: "CONTEXT.md says infinite scroll, but pagination was built. Change decision or fix code?"
```

### When CONTEXT.md Missing

If phase has no CONTEXT.md:

```markdown
ℹ️ No CONTEXT.md for Phase {N}

This phase was not discussed with the user. Options:
1. `/gsd:discuss-phase {N}` - Gather decisions before planning
2. Proceed with defaults - Document assumptions in PLAN.md
```

---

## Blackboard Integration

If using blackboard architecture, decisions sync:

```json
// .planning/blackboard/decisions.json
{
  "phases": {
    "5.2": {
      "context_file": ".planning/phases/05.2-pwa-foundation/05.2-CONTEXT.md",
      "decisions": [
        {
          "area": "Install Experience",
          "decision": "Install prompt timing",
          "choice": "After 2+ visits",
          "locked": true
        },
        {
          "area": "Offline Behavior",
          "decision": "Offline actions",
          "choice": "Queue for later",
          "locked": true
        }
      ],
      "implementation_notes": [...],
      "out_of_scope": [...]
    }
  }
}
```

---

## Summary

| Checkpoint | Action | Failure Mode Prevented |
|------------|--------|----------------------|
| Pre-planning | Read CONTEXT.md | Planner ignores decisions |
| Plan generation | Add context_honored | No traceability |
| Pre-execution | Validate tasks | Executor uses defaults |
| Post-execution | Verify compliance | Silent decision drift |
| Human review | Show compliance % | Hidden scope changes |

**The mantra:** User's choice, not "reasonable defaults."
