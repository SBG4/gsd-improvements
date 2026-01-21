# Initialize Query Infrastructure

Initialize the semantic query infrastructure for `/gsd:query` command.

<step name="create_index_directory">
Create the index directory structure:
```bash
mkdir -p .planning/index/embeddings
```
</step>

<step name="create_schema">
Create index schema configuration:
```bash
cat > .planning/index/schema.json << 'EOF'
{
  "version": "1.0.0",
  "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "indexes": {
    "plans": {
      "source": ".planning/phases/**/PLAN.md",
      "fields": ["goal", "tasks", "artifacts", "dependencies"]
    },
    "artifacts": {
      "source": ".planning/blackboard/artifacts.json",
      "fields": ["path", "provides", "created_by"]
    },
    "decisions": {
      "source": ".planning/blackboard/decisions.json",
      "fields": ["decision", "rationale", "affects"]
    }
  },
  "relationships": {
    "plan_depends_on": "plans → plans",
    "plan_creates": "plans → artifacts",
    "decision_affects": "decisions → plans"
  }
}
EOF
```
</step>

<step name="create_graph_db">
Initialize SQLite graph database:
```bash
# Create graph.db with relationship tables
sqlite3 .planning/index/graph.db << 'EOF'
-- Nodes table
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Edges table for relationships
CREATE TABLE IF NOT EXISTS edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relationship TEXT NOT NULL,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES nodes(id),
  FOREIGN KEY (target_id) REFERENCES nodes(id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id);
CREATE INDEX IF NOT EXISTS idx_edges_relationship ON edges(relationship);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type);

-- Full-text search table
CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
  node_id,
  content,
  tokenize='porter'
);
EOF
```
</step>

<step name="index_existing_plans">
Index existing plans if any exist:
```bash
# Find all PLAN.md files
for plan in .planning/phases/*/PLAN.md .planning/phases/*/*/PLAN.md; do
  if [[ -f "$plan" ]]; then
    # Extract plan ID from path
    plan_id=$(echo "$plan" | grep -oE '[0-9]+-[0-9]+' | head -1)
    plan_name=$(basename $(dirname "$plan"))

    # Insert into graph.db
    sqlite3 .planning/index/graph.db "
      INSERT OR REPLACE INTO nodes (id, type, name, metadata)
      VALUES ('plan:$plan_id', 'plan', '$plan_name', '{}');
    "

    # Index content for search
    content=$(cat "$plan" | tr '\n' ' ' | sed "s/'/''/g")
    sqlite3 .planning/index/graph.db "
      INSERT OR REPLACE INTO search_index (node_id, content)
      VALUES ('plan:$plan_id', '$content');
    "

    echo "Indexed: $plan_id ($plan_name)"
  fi
done
```
</step>

<step name="index_artifacts">
Index artifacts from blackboard:
```bash
if [[ -f ".planning/blackboard/artifacts.json" ]]; then
  # Parse artifacts and insert into graph
  jq -r 'to_entries[] | "\(.key)|\(.value.created_by // "unknown")"' \
    .planning/blackboard/artifacts.json | while IFS='|' read -r path created_by; do

    artifact_id="artifact:$(echo "$path" | md5sum | cut -d' ' -f1)"

    sqlite3 .planning/index/graph.db "
      INSERT OR REPLACE INTO nodes (id, type, name, metadata)
      VALUES ('$artifact_id', 'artifact', '$path', '{}');
    "

    # Create relationship if created_by exists
    if [[ "$created_by" != "unknown" ]]; then
      sqlite3 .planning/index/graph.db "
        INSERT INTO edges (source_id, target_id, relationship)
        VALUES ('plan:$created_by', '$artifact_id', 'creates');
      "
    fi

    echo "Indexed artifact: $path"
  done
fi
```
</step>

<step name="verify_initialization">
Verify the initialization:
```bash
echo "=== Query Infrastructure Initialized ==="
echo ""
echo "Database: .planning/index/graph.db"
sqlite3 .planning/index/graph.db "SELECT COUNT(*) || ' nodes' FROM nodes;"
sqlite3 .planning/index/graph.db "SELECT COUNT(*) || ' edges' FROM edges;"
sqlite3 .planning/index/graph.db "SELECT COUNT(*) || ' search entries' FROM search_index;"
echo ""
echo "You can now use: /gsd:query <your question>"
```
</step>

## Usage

After initialization, use the query command:

```bash
# Query plans
/gsd:query "Which plans create user models?"

# Query dependencies
/gsd:query "What does phase 02 depend on?"

# Query artifacts
/gsd:query "Where is authentication implemented?"
```

## Rebuilding Index

To rebuild the index from scratch:

```bash
rm -rf .planning/index
/gsd:init-query
```
