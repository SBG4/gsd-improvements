# Parallel Phase Execution with Git Worktree

## Overview

Parallel phase execution enables independent phases to run simultaneously using Git worktree isolation. This provides true parallel development without merge conflicts.

## When to Use

Phases can run in parallel when:
- They have no dependencies on each other
- They modify different files
- They can be merged cleanly afterward

Example:
```yaml
phases:
  - 01-database       # No dependencies
  - 02-backend-api    # Depends on 01
  - 03-frontend-shell # NO dependencies (can parallel with 02!)
  - 04-integration    # Depends on 02 AND 03
```

Phases 02 and 03 can run in parallel, potentially cutting delivery time in half.

## Roadmap Enhancement

### Phase Dependencies in ROADMAP.md

```yaml
### Phase 1: Database Foundation
- **Goal:** PostgreSQL schema with user tables
- **Dependencies:** none
- **Worktree:** main

### Phase 2: Backend API
- **Goal:** REST API endpoints
- **Dependencies:** Phase 1
- **Worktree:** worktree-backend

### Phase 3: Frontend Shell
- **Goal:** React app structure
- **Dependencies:** none  # Can run parallel with Phase 2!
- **Worktree:** worktree-frontend

### Phase 4: Integration
- **Goal:** Connect frontend to backend
- **Dependencies:** Phase 2, Phase 3
- **Worktree:** main  # Merge point
```

## Execution Flow

### 1. Detect Parallel Opportunities

```bash
# Read ROADMAP.md
# Build dependency graph
# Identify phases with no pending dependencies

CURRENT_COMPLETED=(01)  # Phase 1 done

# Check Phase 2 dependencies: [01] - all in COMPLETED ✓
# Check Phase 3 dependencies: [] - none ✓
# Both can run!

PARALLEL_READY=(02 03)
```

### 2. Create Worktrees

```bash
# For each parallel phase, create isolated worktree
git worktree add ../project-worktree-02-backend -b phase-02-backend
git worktree add ../project-worktree-03-frontend -b phase-03-frontend
```

Each worktree:
- Has its own working directory
- Shares git history with main
- Can commit independently
- No file conflicts possible

### 3. Execute in Parallel

```bash
# Spawn executor for Phase 2 in worktree-02-backend
Task(
  prompt="Execute phase 02 in worktree at ../project-worktree-02-backend",
  subagent_type="gsd-executor",
  run_in_background=true
)

# Spawn executor for Phase 3 in worktree-03-frontend
Task(
  prompt="Execute phase 03 in worktree at ../project-worktree-03-frontend",
  subagent_type="gsd-executor",
  run_in_background=true
)

# Wait for both to complete
```

### 4. Merge Worktrees

After both phases complete:

```bash
# Switch to main branch
cd /main/project
git checkout main

# Merge phase-02-backend
git merge phase-02-backend --no-ff -m "merge(02): Backend API phase"

# Merge phase-03-frontend
git merge phase-03-frontend --no-ff -m "merge(03): Frontend Shell phase"

# Clean up worktrees
git worktree remove ../project-worktree-02-backend
git worktree remove ../project-worktree-03-frontend

# Delete branches
git branch -d phase-02-backend
git branch -d phase-03-frontend
```

### 5. Continue to Dependent Phase

Phase 4 can now start with both 02 and 03 merged:

```bash
# Phase 4 has all dependencies satisfied
/gsd:execute-phase 04
```

## Command Enhancement

### `/gsd:execute-phases` (New)

```bash
# Execute multiple phases in parallel
/gsd:execute-phases 02 03

# With explicit worktree names
/gsd:execute-phases 02 03 --worktrees backend frontend
```

### Modified `/gsd:execute-phase`

```markdown
<step name="check_parallel_execution">
If phase has `worktree` in ROADMAP.md frontmatter:

1. Create worktree if not exists
2. Change to worktree directory
3. Execute in isolated context
4. Return to main on completion
</step>
```

## Conflict Prevention

### File Ownership

In ROADMAP.md, declare file ownership per phase:

```yaml
### Phase 2: Backend API
- **Files:** src/api/*, src/services/*
- **Dependencies:** Phase 1

### Phase 3: Frontend Shell
- **Files:** src/components/*, src/app/*
- **Dependencies:** none
```

No overlap = safe to parallel.

### Shared Files

If phases MUST modify the same file:

```yaml
### Phase 2: Backend API
- **Files:** src/api/*, src/types/shared.ts

### Phase 3: Frontend Shell
- **Files:** src/components/*, src/types/shared.ts  # CONFLICT!
```

Options:
1. Make one depend on the other (sequential)
2. Split shared file (src/types/api.ts + src/types/ui.ts)
3. Use merge strategy with manual resolution

## Orchestrator Changes

### Dependency Graph Builder

```python
def build_dependency_graph(roadmap):
    phases = parse_phases(roadmap)
    graph = {}

    for phase in phases:
        graph[phase.id] = {
            'depends_on': phase.dependencies,
            'files': phase.files,
            'worktree': phase.worktree
        }

    return graph

def find_parallel_ready(graph, completed):
    ready = []
    for phase_id, info in graph.items():
        if phase_id in completed:
            continue
        if all(dep in completed for dep in info['depends_on']):
            ready.append(phase_id)
    return ready
```

### Merge Coordinator

```python
def merge_phases(phases):
    # Sort by dependency order (leaves first)
    sorted_phases = topological_sort(phases)

    for phase in sorted_phases:
        branch = f"phase-{phase.id}-{phase.name}"

        # Check for conflicts
        conflicts = check_merge_conflicts(branch)
        if conflicts:
            return handle_conflicts(phase, conflicts)

        # Merge
        git_merge(branch, no_ff=True)
        cleanup_worktree(phase.worktree)
```

## Benefits

1. **Time Savings**: 2-4x faster for independent phases
2. **Clean Isolation**: No file conflicts during development
3. **Easy Rollback**: Each phase on its own branch
4. **Clear History**: Merge commits mark phase boundaries
5. **Safe Merging**: Conflicts detected at merge, not runtime
