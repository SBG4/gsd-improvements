#!/bin/bash
# GSD Enhanced - Auto Install Script
# Usage: curl -fsSL https://raw.githubusercontent.com/SBG4/gsd-improvements/main/install.sh | bash

set -e

REPO="https://github.com/SBG4/gsd-improvements.git"
CLAUDE_DIR="$HOME/.claude"
TMP_DIR="/tmp/gsd-install-$$"

echo "=== GSD Enhanced Installer ==="
echo ""

# Create .claude directory if it doesn't exist
mkdir -p "$CLAUDE_DIR/get-shit-done"
mkdir -p "$CLAUDE_DIR/hooks"
mkdir -p "$CLAUDE_DIR/commands/gsd"

# Clone repo
echo "[1/4] Cloning GSD Enhanced..."
git clone --quiet "$REPO" "$TMP_DIR"

# Copy files
echo "[2/4] Installing framework..."
cp -r "$TMP_DIR"/* "$CLAUDE_DIR/get-shit-done/" 2>/dev/null || true

echo "[3/4] Installing hooks and commands..."
cp "$TMP_DIR"/hooks/* "$CLAUDE_DIR/hooks/" 2>/dev/null || true
cp "$TMP_DIR"/commands/gsd/* "$CLAUDE_DIR/commands/gsd/" 2>/dev/null || true

# Create CLAUDE.md if it doesn't exist
if [ ! -f "$CLAUDE_DIR/CLAUDE.md" ]; then
echo "[4/4] Creating CLAUDE.md..."
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
echo "[4/4] CLAUDE.md exists, skipping..."
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
