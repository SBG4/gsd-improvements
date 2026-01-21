# Blackboard Protocol

## Overview

The blackboard is a shared state mechanism that enables real-time coordination between GSD agents without file-based state passing. It reduces token usage by 13-57% compared to sequential file reads.

## Architecture

```
.planning/blackboard/
├── shared-context.json    # Real-time shared state
├── claims.json            # File ownership claims
├── artifacts.json         # Cross-phase artifact registry
├── decisions.json         # Accumulated decisions
└── events.json            # Event log for coordination
```

## Reading from Blackboard

Before any agent operation, load blackboard state:

```bash
# Load shared context
SHARED_CONTEXT=$(cat .planning/blackboard/shared-context.json 2>/dev/null || echo '{}')

# Load claims to check file ownership
CLAIMS=$(cat .planning/blackboard/claims.json 2>/dev/null || echo '{}')

# Load artifact registry
ARTIFACTS=$(cat .planning/blackboard/artifacts.json 2>/dev/null || echo '{}')
```

## Writing to Blackboard

### Claiming Files

Before modifying any file, claim ownership:

```json
{
  "claims": {
    "src/api/users.ts": {
      "agent": "gsd-executor",
      "plan": "01-02",
      "task": 1,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Conflict Detection**: If file already claimed by another agent:
- Check if claim is stale (>30 minutes old)
- If stale, override with new claim
- If active, wait or coordinate with orchestrator

### Registering Artifacts

When creating/modifying artifacts, register them:

```json
{
  "artifacts": {
    "src/models/user.ts": {
      "type": "model",
      "exports": ["User", "UserCreate", "UserUpdate"],
      "created_by": "01-01",
      "provides": "User type definitions",
      "version": 1
    },
    "src/api/users.ts": {
      "type": "api-endpoint",
      "exports": ["GET", "POST", "PUT", "DELETE"],
      "created_by": "01-02",
      "depends_on": ["src/models/user.ts"],
      "version": 1
    }
  }
}
```

### Publishing Decisions

When making decisions during execution:

```json
{
  "decisions": [
    {
      "id": "dec-001",
      "phase": "01-foundation",
      "plan": "01-02",
      "decision": "Use jose library for JWT instead of jsonwebtoken",
      "rationale": "CommonJS issues with Edge runtime",
      "timestamp": "2024-01-15T10:30:00Z",
      "affects": ["all-auth-related-code"]
    }
  ]
}
```

## Event System

Agents emit events to coordinate:

```json
{
  "events": [
    {
      "type": "task:started",
      "agent": "gsd-executor",
      "plan": "01-02",
      "task": 1,
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "type": "artifact:created",
      "path": "src/api/users.ts",
      "provides": ["GET", "POST"],
      "timestamp": "2024-01-15T10:35:00Z"
    },
    {
      "type": "task:completed",
      "agent": "gsd-executor",
      "plan": "01-02",
      "task": 1,
      "commit": "abc1234",
      "timestamp": "2024-01-15T10:40:00Z"
    }
  ]
}
```

## Shared Context Schema

```json
{
  "current_phase": "01-foundation",
  "current_wave": 1,
  "active_agents": [
    {"id": "exec-01", "plan": "01-01", "task": 2},
    {"id": "exec-02", "plan": "01-02", "task": 1}
  ],
  "completed_plans": ["01-01"],
  "blocked_plans": [],
  "tech_stack": {
    "added": ["jose", "prisma"],
    "patterns": ["repository-pattern", "api-routes"]
  },
  "key_files": {
    "models": ["src/models/user.ts"],
    "api": ["src/api/users.ts"],
    "components": []
  }
}
```

## Integration with Agents

### Executor Integration

```markdown
<step name="load_blackboard" priority="first">
Before execution, load blackboard:
1. Read shared-context.json for current state
2. Read claims.json to check file availability
3. Read artifacts.json for dependency resolution
4. Claim files this plan will modify
</step>

<step name="update_blackboard" priority="after_each_task">
After each task:
1. Register new artifacts
2. Update shared context with progress
3. Emit task:completed event
4. Release claims for completed files
</step>
```

### Planner Integration

```markdown
<step name="read_artifacts_for_planning">
When planning:
1. Read artifacts.json to understand what exists
2. Build dependency graph from artifact relationships
3. Assign waves based on artifact availability
</step>
```

## Garbage Collection

Periodically clean stale blackboard data:

```bash
# Remove events older than 24 hours
# Remove claims older than 1 hour with no activity
# Archive completed phase artifacts
```

## Benefits

1. **Reduced Token Usage**: Agents read small JSON instead of full files
2. **Real-Time Coordination**: No polling or file watching needed
3. **Conflict Prevention**: Claims system prevents parallel file conflicts
4. **Dependency Tracking**: Artifacts know what they depend on
5. **Event-Driven**: Enables future GUI/dashboard integration
