---
name: gsd:contracts
description: Manage and validate API contracts between phases
argument-hint: "[validate | generate | show <phase>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

<objective>
Manage API contracts that define interfaces between phases.

Commands:
- `validate` - Check all contracts against codebase
- `generate` - Generate contracts from SUMMARY.md files
- `show <phase>` - Display contracts for a specific phase
- (none) - Show all contracts overview
</objective>

<context>
@.planning/ROADMAP.md
@./.claude/get-shit-done/contracts/protocol.md
</context>

<process>

## 1. Parse Arguments

| Subcommand | Action |
|------------|--------|
| (none) | Show contracts overview |
| `validate` | Validate all contracts |
| `generate` | Generate contracts from summaries |
| `show <N>` | Show contracts for phase N |

## 2. Show Contracts Overview (default)

```bash
# List all phases with contracts
for phase_dir in .planning/phases/*/; do
  if [[ -d "${phase_dir}CONTRACTS" ]]; then
    exports=$(grep "^export" "${phase_dir}CONTRACTS/exports.ts" 2>/dev/null | wc -l)
    deps=$(grep "^import" "${phase_dir}CONTRACTS/dependencies.ts" 2>/dev/null | wc -l)
    echo "| $(basename $phase_dir) | $exports | $deps |"
  fi
done
```

Output:
```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► API CONTRACTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Phase | Exports | Dependencies |
|-------|---------|--------------|
| 01-foundation | 5 | 0 |
| 02-auth | 8 | 3 |
| 03-api | 12 | 5 |

───────────────────────────────────────────────────────

## Dependency Graph

```
01-foundation
    └── 02-auth (imports: User, UserCreate)
        └── 03-api (imports: AuthService, User)
```

───────────────────────────────────────────────────────

Commands:
- `/gsd:contracts validate` - Check contracts
- `/gsd:contracts show 02` - Show phase 02 contracts
- `/gsd:contracts generate` - Regenerate from summaries
```

## 3. Validate Contracts

```bash
# For each phase with contracts
for phase_dir in .planning/phases/*/; do
  if [[ ! -d "${phase_dir}CONTRACTS" ]]; then
    continue
  fi

  echo "Validating $(basename $phase_dir)..."

  # Check exports exist in codebase
  while IFS= read -r export_line; do
    # Extract type name
    type_name=$(echo "$export_line" | grep -oE "interface \w+|type \w+" | awk '{print $2}')
    if [[ -n "$type_name" ]]; then
      # Search for implementation
      if ! grep -r "interface $type_name\|type $type_name" src/ >/dev/null 2>&1; then
        echo "  ✗ Missing: $type_name"
        ERRORS=$((ERRORS + 1))
      else
        echo "  ✓ Found: $type_name"
      fi
    fi
  done < <(grep "^export" "${phase_dir}CONTRACTS/exports.ts" 2>/dev/null)

  # Check dependencies are satisfied
  while IFS= read -r import_line; do
    # Extract source phase
    source=$(echo "$import_line" | grep -oE "\.\./[^/]+/CONTRACTS" | head -1)
    if [[ -n "$source" && ! -f ".planning/phases/$source/exports.ts" ]]; then
      echo "  ✗ Unsatisfied dependency: $source"
      ERRORS=$((ERRORS + 1))
    fi
  done < <(grep "^import" "${phase_dir}CONTRACTS/dependencies.ts" 2>/dev/null)
done
```

Output:
```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► CONTRACT VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 01-foundation
✓ User (src/models/user.ts:5)
✓ UserCreate (src/models/user.ts:12)
✓ UserResponse (src/models/user.ts:18)

## 02-auth
✓ AuthService (src/services/auth.ts:8)
✓ LoginRequest (src/types/auth.ts:3)
✗ RefreshToken - NOT FOUND

## 03-api
✓ All 12 exports found

───────────────────────────────────────────────────────

**Result:** 1 error found

**Missing:**
- RefreshToken (02-auth) - defined in contract but not in codebase

**Action:** Implement missing types or update contracts.
```

## 4. Generate Contracts

From SUMMARY.md files:

```bash
for phase_dir in .planning/phases/*/; do
  summary="${phase_dir}"*-SUMMARY.md
  if [[ ! -f "$summary" ]]; then
    continue
  fi

  # Create CONTRACTS directory
  mkdir -p "${phase_dir}CONTRACTS"

  # Extract from frontmatter
  # tech-stack.patterns → interfaces
  # key-files.created → exports
  # dependency-graph.provides → export list

  # Generate exports.ts
  cat > "${phase_dir}CONTRACTS/exports.ts" << EOF
/**
 * Phase: $(basename $phase_dir)
 * Generated from: $(basename $summary)
 * Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)
 */

// TODO: Fill in actual type definitions from codebase
// Based on SUMMARY.md, this phase provides:
$(grep -A20 "key-files:" "$summary" | grep "created:" | sed 's/.*- /\/\/ - /')

EOF

  echo "Generated: ${phase_dir}CONTRACTS/exports.ts"
done
```

## 5. Show Phase Contracts

```bash
PHASE=$1
PHASE_DIR=$(ls -d .planning/phases/${PHASE}-* 2>/dev/null | head -1)

if [[ -z "$PHASE_DIR" ]]; then
  echo "Phase $PHASE not found"
  exit 1
fi

echo "# Contracts for $(basename $PHASE_DIR)"
echo ""
echo "## Exports"
cat "${PHASE_DIR}/CONTRACTS/exports.ts" 2>/dev/null || echo "No exports defined"
echo ""
echo "## Dependencies"
cat "${PHASE_DIR}/CONTRACTS/dependencies.ts" 2>/dev/null || echo "No dependencies"
```

</process>

<success_criteria>
- [ ] Contracts overview displayed
- [ ] Validation checks all exports exist
- [ ] Validation checks dependencies satisfied
- [ ] Generation creates contract stubs
- [ ] Phase-specific view works
</success_criteria>
