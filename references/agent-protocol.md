# Agent Communication Protocol

## Overview

The Agent Communication Protocol enables real-time coordination between GSD agents through an event-driven messaging system. It replaces file-based polling with structured events.

## Event Types

### Lifecycle Events

```javascript
// Task started
{
  type: 'task:started',
  agent: 'gsd-executor',
  plan: '01-02',
  task: 1,
  taskName: 'Create User model',
  timestamp: '2024-01-15T10:30:00Z'
}

// Task completed
{
  type: 'task:completed',
  agent: 'gsd-executor',
  plan: '01-02',
  task: 1,
  taskName: 'Create User model',
  commit: 'abc1234',
  duration: '15min',
  timestamp: '2024-01-15T10:45:00Z'
}

// Task failed
{
  type: 'task:failed',
  agent: 'gsd-executor',
  plan: '01-02',
  task: 1,
  error: 'Test verification failed',
  timestamp: '2024-01-15T10:45:00Z'
}
```

### Artifact Events

```javascript
// Artifact created
{
  type: 'artifact:created',
  path: 'src/models/user.ts',
  provides: ['User', 'UserCreate', 'UserUpdate'],
  createdBy: '01-01',
  timestamp: '2024-01-15T10:35:00Z'
}

// Artifact modified
{
  type: 'artifact:modified',
  path: 'src/models/user.ts',
  modifiedBy: '01-02',
  changes: ['added role field'],
  timestamp: '2024-01-15T11:00:00Z'
}
```

### Coordination Events

```javascript
// File claimed
{
  type: 'file:claimed',
  path: 'src/api/users.ts',
  agent: 'gsd-executor',
  plan: '01-02',
  timestamp: '2024-01-15T10:30:00Z'
}

// File released
{
  type: 'file:released',
  path: 'src/api/users.ts',
  agent: 'gsd-executor',
  timestamp: '2024-01-15T10:45:00Z'
}

// Dependency satisfied
{
  type: 'dependency:satisfied',
  artifact: 'src/models/user.ts',
  requiredBy: ['01-02', '01-03'],
  timestamp: '2024-01-15T10:35:00Z'
}
```

### Decision Events

```javascript
// Decision made
{
  type: 'decision:made',
  id: 'dec-001',
  decision: 'Use jose library for JWT',
  rationale: 'Edge runtime compatibility',
  madeBy: '01-02',
  affects: ['02-*'],
  timestamp: '2024-01-15T10:40:00Z'
}

// Checkpoint reached
{
  type: 'checkpoint:reached',
  plan: '01-03',
  task: 2,
  checkpointType: 'human-verify',
  awaiting: 'user approval',
  timestamp: '2024-01-15T11:00:00Z'
}
```

## Event Storage

Events are stored in `.planning/blackboard/events.json`:

```json
{
  "events": [
    { "type": "task:started", ... },
    { "type": "artifact:created", ... },
    { "type": "task:completed", ... }
  ],
  "lastEventId": 42,
  "retentionPolicy": "24h"
}
```

## Emitting Events

### From Agents

```markdown
<step name="emit_task_started">
Before executing task:
```bash
# Emit event to blackboard
EVENT=$(cat <<EOF
{
  "type": "task:started",
  "agent": "gsd-executor",
  "plan": "${PLAN}",
  "task": ${TASK_NUM},
  "taskName": "${TASK_NAME}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)

# Append to events file
jq ".events += [$EVENT] | .lastEventId += 1" \
  .planning/blackboard/events.json > tmp.json && mv tmp.json .planning/blackboard/events.json
```
</step>
```

### From Hooks

```javascript
// hooks/gsd-event-emitter.js
export default async function({ tool, result, session }) {
  if (tool === 'Write' && result.success) {
    await emitEvent({
      type: 'artifact:created',
      path: result.path,
      timestamp: new Date().toISOString()
    });
  }
}

async function emitEvent(event) {
  const eventsFile = '.planning/blackboard/events.json';
  const data = JSON.parse(await fs.readFile(eventsFile, 'utf-8'));
  data.events.push({ ...event, id: ++data.lastEventId });
  await fs.writeFile(eventsFile, JSON.stringify(data, null, 2));
}
```

## Subscribing to Events

### Orchestrator Subscription

```markdown
<step name="wait_for_completions">
After spawning parallel executors:

1. Poll events file for completion events:
```bash
while true; do
  COMPLETED=$(jq '[.events[] | select(.type == "task:completed" and .plan | startswith("'$PHASE'"))] | length' \
    .planning/blackboard/events.json)

  if [[ $COMPLETED -ge $EXPECTED ]]; then
    break
  fi

  sleep 5
done
```

2. Collect results from completion events
3. Handle any failure events
</step>
```

### Dependency Notification

When an artifact is created:
1. Check if any waiting plans depend on it
2. Emit `dependency:satisfied` event
3. Waiting plans can proceed

## Event Handlers

### Built-in Handlers

| Event Type | Handler | Action |
|------------|---------|--------|
| task:completed | blackboard-sync | Update shared-context.json |
| artifact:created | dependency-resolver | Check and notify dependents |
| decision:made | decision-tracker | Add to decisions.json |
| checkpoint:reached | orchestrator | Present to user |
| task:failed | error-handler | Log and notify |

### Custom Handlers

In `.planning/config.json`:

```json
{
  "event_handlers": {
    "task:completed": [
      "builtin:blackboard-sync",
      "custom:slack-notify"
    ],
    "task:failed": [
      "builtin:error-handler",
      "custom:pagerduty-alert"
    ]
  }
}
```

## Benefits

1. **Real-Time Coordination**: No polling delays
2. **Loose Coupling**: Agents don't need to know about each other
3. **Audit Trail**: Full event history for debugging
4. **Extensibility**: Custom handlers for integrations
5. **Future GUI**: Events enable real-time dashboard updates
