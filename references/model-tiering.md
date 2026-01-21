# Dynamic Model Tiering

## Overview

Dynamic model tiering assigns the optimal model (Opus/Sonnet/Haiku) to each task based on complexity, criticality, and historical performance data.

## Tier Definitions

| Tier | Model | Use For | Cost Index |
|------|-------|---------|------------|
| **T1** | Opus | Critical, complex, security-sensitive | 1.0x |
| **T2** | Sonnet | Standard development, balanced tasks | 0.3x |
| **T3** | Haiku | Fast, simple, boilerplate tasks | 0.1x |

## Task Classification

### Tier 1 (Opus) - Critical Tasks

**Indicators:**
- Security-related: auth, encryption, validation, CORS, CSRF
- Architecture decisions: schema design, API contracts, system design
- Complex algorithms: business logic with edge cases
- Code review: security audit, architecture review
- Novel problems: no existing pattern, requires reasoning

**Keywords:** `auth`, `security`, `encrypt`, `architecture`, `design`, `critical`, `complex`

### Tier 2 (Sonnet) - Standard Tasks

**Indicators:**
- CRUD operations: create, read, update, delete
- API endpoints: standard REST/GraphQL handlers
- Database queries: standard ORM operations
- Test generation: unit and integration tests
- Standard UI: forms, lists, tables

**Keywords:** `crud`, `api`, `endpoint`, `query`, `test`, `component`

### Tier 3 (Haiku) - Simple Tasks

**Indicators:**
- Configuration: env vars, build config
- Styling: CSS, Tailwind classes
- Documentation: comments, README updates
- Boilerplate: file scaffolding, imports
- Simple fixes: typos, formatting

**Keywords:** `config`, `style`, `doc`, `scaffold`, `format`, `rename`

## Automatic Classification

### In Plan Frontmatter

```yaml
---
phase: 02-auth
plan: 01
tasks:
  - name: "Create User model"
    model: sonnet      # Standard ORM work
  - name: "Implement password hashing"
    model: opus        # Security-critical
  - name: "Add migration file"
    model: haiku       # Boilerplate
  - name: "Create auth API routes"
    model: sonnet      # Standard API
  - name: "Security review"
    model: opus        # Critical review
---
```

### Classification Algorithm

```python
def classify_task(task_name: str, task_action: str) -> str:
    # Check for T1 indicators
    t1_keywords = ['auth', 'security', 'encrypt', 'hash', 'password',
                   'architecture', 'design', 'critical', 'review',
                   'complex', 'algorithm', 'migration']
    if any(kw in task_name.lower() or kw in task_action.lower() for kw in t1_keywords):
        return 'opus'

    # Check for T3 indicators
    t3_keywords = ['config', 'style', 'css', 'tailwind', 'doc', 'comment',
                   'scaffold', 'boilerplate', 'format', 'rename', 'import']
    if any(kw in task_name.lower() or kw in task_action.lower() for kw in t3_keywords):
        return 'haiku'

    # Default to T2
    return 'sonnet'
```

## Runtime Override

### Command Line

```bash
# Force specific model for all tasks
/gsd:execute-phase 02 --model opus

# Use budget mode (all T3)
/gsd:execute-phase 02 --budget
```

### Config Override

```json
// .planning/config.json
{
  "model_profile": "balanced",  // quality | balanced | budget
  "model_overrides": {
    "security-*": "opus",       // All security tasks use Opus
    "style-*": "haiku"          // All styling tasks use Haiku
  }
}
```

## Cost Tracking

### Per-Task Tracking

In SUMMARY.md:
```yaml
---
metrics:
  duration: "45min"
  model_usage:
    opus: 2 tasks (15min)
    sonnet: 3 tasks (25min)
    haiku: 1 task (5min)
  estimated_cost: "$0.45"
---
```

### Project-Wide Reporting

`/gsd:routing-stats` shows:
- Total cost by model
- Cost per phase
- Cost optimization suggestions

## Integration with Routing History

When `/gsd:learn` runs:
1. Record which model was used for each task type
2. Track success rate by model
3. Update routing-history.json with optimal mappings

Future executions use historical data:
```json
{
  "task_types": {
    "auth-implementation": {
      "best_model": "opus",
      "success_rate": 0.95,
      "fallback": "sonnet"
    },
    "crud-api": {
      "best_model": "sonnet",
      "success_rate": 0.98,
      "fallback": "haiku"
    }
  }
}
```

## Fallback Strategy

If preferred model unavailable or rate-limited:

1. T1 (Opus) → Fallback to T2 (Sonnet)
2. T2 (Sonnet) → Fallback to T3 (Haiku) for simple, T1 (Opus) for complex
3. T3 (Haiku) → Fallback to T2 (Sonnet)

## Benefits

1. **Cost Optimization**: Use expensive models only when needed
2. **Speed**: Fast models for simple tasks reduce latency
3. **Quality**: Critical tasks get maximum capability
4. **Adaptability**: Learn from project-specific patterns
