# GSD Framework Improvements

Enhanced version of the [Get Shit Done](https://github.com/glittercowboy/get-shit-done-cc) framework for Claude Code with 10 major improvements based on research of 12+ competing frameworks.

## Features Added

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Blackboard Architecture** | Shared state for agent coordination | 13-57% token reduction |
| **Self-Learning Patterns** | Capture and reuse successful patterns | Continuous improvement |
| **Parallel Phase Execution** | Git worktree isolation | 2-4x faster delivery |
| **API Contract Generation** | TypeScript interfaces between phases | Earlier error detection |
| **Multi-Language Support** | TypeScript, Python, Go profiles | Broader adoption |
| **Dynamic Model Tiering** | Opus/Sonnet/Haiku per task | Cost optimization |
| **Property-Based Testing** | Generate tests from specs | Higher confidence |
| **Session Continuity** | Auto-save and recovery | No lost work |
| **Agent Communication** | Event-driven coordination | Real-time sync |
| **Community Fixes** | Windows paths, query infrastructure | Cross-platform support |

## Installation

Copy to your Claude Code configuration:

```bash
cp -r * ~/.claude/get-shit-done/
cp hooks/* ~/.claude/hooks/
cp -r commands/gsd/* ~/.claude/commands/gsd/
```

## New Commands

```bash
/gsd:learn              # Capture patterns from current project
/gsd:apply-patterns     # Apply learned patterns to new project
/gsd:routing-stats      # Show agent performance statistics
/gsd:contracts          # Manage API contracts between phases
/gsd:sessions           # List and manage session snapshots
/gsd:init-query         # Initialize query infrastructure
```

## Directory Structure

```
.claude/get-shit-done/
├── blackboard/              # Shared state protocol
├── patterns/
│   ├── successful-plans/    # Verified plan patterns
│   ├── failure-patterns/    # Plans that needed revision
│   └── conventions-learned/ # Detected coding patterns
├── languages/               # Language-specific profiles
│   ├── typescript.md
│   ├── python.md
│   └── go.md
├── sessions/                # Session snapshots
├── contracts/               # API contracts
├── references/              # Technical documentation
│   ├── model-tiering.md
│   ├── property-testing.md
│   ├── agent-protocol.md
│   ├── parallel-phases.md
│   └── community-fixes.md
└── hooks/
    ├── gsd-blackboard-sync.js
    ├── gsd-session-save.js
    └── gsd-utils.js
```

## Research Sources

Based on analysis of:
- [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) - Scale-adaptive agents
- [Claude-Flow](https://github.com/ruvnet/claude-flow) - Self-learning SONA
- [ccswarm](https://github.com/nwiizo/ccswarm) - Git worktree isolation
- [wshobson/agents](https://github.com/wshobson/agents) - Model tiering
- [MetaGPT](https://arxiv.org/abs/2308.00352) - Structured communication
- [Blackboard Architecture Research](https://arxiv.org/html/2507.01701v1)

## License

MIT - Compatible with original GSD framework.

## Credits

- Original GSD: [glittercowboy/get-shit-done-cc](https://github.com/glittercowboy/get-shit-done-cc)
- Improvements: Claude Code session analysis and implementation
