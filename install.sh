#!/bin/bash
# GSD Enhanced - Auto Install Script
# Usage: curl -fsSL https://raw.githubusercontent.com/SBG4/gsd-improvements/main/install.sh | bash

set -e

REPO="https://github.com/SBG4/gsd-improvements.git"
CLAUDE_DIR="$HOME/.claude"
TMP_DIR="/tmp/gsd-install-$$"

echo "=== GSD Enhanced Installer ==="
echo ""

# Check for Node.js
if ! command -v npx &> /dev/null; then
    echo "ERROR: Node.js/npx not found. Install Node.js first:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi

# Create .claude directory if it doesn't exist
mkdir -p "$CLAUDE_DIR/get-shit-done"
mkdir -p "$CLAUDE_DIR/hooks"
mkdir -p "$CLAUDE_DIR/commands/gsd"

# Install base GSD framework first
echo "[1/5] Installing base GSD framework..."
cd "$CLAUDE_DIR"
npx get-shit-done-cc --local 2>/dev/null || echo "Base GSD install completed"

# Clone enhancements repo
echo "[2/5] Cloning GSD Enhanced..."
git clone --quiet "$REPO" "$TMP_DIR"

# Overlay enhancement files (won't overwrite base GSD)
echo "[3/5] Installing enhancements..."
cp -rn "$TMP_DIR"/* "$CLAUDE_DIR/get-shit-done/" 2>/dev/null || true

echo "[4/5] Installing hooks and commands..."
cp -n "$TMP_DIR"/hooks/* "$CLAUDE_DIR/hooks/" 2>/dev/null || true
cp -n "$TMP_DIR"/commands/gsd/* "$CLAUDE_DIR/commands/gsd/" 2>/dev/null || true

# Create CLAUDE.md if it doesn't exist
if [ ! -f "$CLAUDE_DIR/CLAUDE.md" ]; then
echo "[5/5] Creating CLAUDE.md..."
cat > "$CLAUDE_DIR/CLAUDE.md" << 'EOF'
# Claude Code Configuration

## GSD Enhanced Framework Installed

Use these commands for structured development:

- `/gsd:new-project` - Start a new project with full planning
- `/gsd:progress` - Check current progress
- `/gsd:plan-phase` - Plan the next phase
- `/gsd:execute-phase` - Execute a planned phase
- `/gsd:learn` - Capture patterns from this project
- `/gsd:apply-patterns` - Apply learned patterns

## Quick Start
When starting a new project, run `/gsd:new-project` to initialize.
EOF
else
echo "[5/5] CLAUDE.md exists, skipping..."
fi

# Cleanup
rm -rf "$TMP_DIR"

echo ""
echo "=== Installation Complete ==="
echo ""
echo "GSD Enhanced installed to: $CLAUDE_DIR/get-shit-done/"
echo ""
echo "Start Claude Code and run: /gsd:new-project"
echo ""
