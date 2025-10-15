#!/usr/bin/env zsh
# Reorg spec/doc files and insert minimal spec headers (idempotent).
# Usage:
#   ./scripts/reorg-spec.sh        # interactive run
#   ./scripts/reorg-spec.sh -n     # dry-run (no fs/git changes)
#   ./scripts/reorg-spec.sh -y     # non-interactive
set -euo pipefail
IFS=$'\n\t'

DRY_RUN=0
AUTO_YES=0
while [[ $# -gt 0 ]]; do
  case $1 in
    -n|--dry-run) DRY_RUN=1 ;;
    -y|--yes) AUTO_YES=1 ;;
    -h|--help) echo "Usage: $0 [-n|--dry-run] [-y|--yes]"; exit 0 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
  shift
done

do_cmd() { echo "+ $*"; [[ "$DRY_RUN" -eq 1 ]] || "$@"; }

first_existing() {
  for p in "$@"; do [[ -f "$p" ]] && { echo "$p"; return 0; } done
  return 1
}

ensure_spec_file() {
  local dest="$1"
  if [[ -f "$dest" && -s "$dest" ]]; then
    echo "OK: $dest exists"
    return 0
  fi
  do_cmd mkdir -p "$(dirname "$dest")"
  case "$(basename "$dest")" in
    01-spec.md)
      do_cmd cat > "$dest" <<'EOF'
# 01-spec — What & Why

## Summary
[One-paragraph summary of the product and goals]

## Context / Existing system
(See archived: docs/history/spec-existing-application.md)

## Goals (high-level)
- G1: schema-first generation of artifacts
- G2: unified endpoint & model mapping
- G3: consistent agent UIs and persistence model

## Acceptance criteria
- A1: typed models validate with zod
- A2: model mapping and endpoints have tests
- A3: route/navigation verification passes

## Related
- spec/constitution.md
- spec/02-plan.md
EOF
      ;;
    02-plan.md)
      do_cmd cat > "$dest" <<'EOF'
# 02-plan — How (architecture, data model, interfaces)

## Summary
[How we'll build it — modules, responsibilities, and milestones]

## Architecture overview
- UI agents
- Orchestrators
- Shared ai helpers: src/lib/ai

## Data model / Schemas
- OntologySchema
- ModelviewSchema
- ObjectSchema

## Interfaces
(See spec/appendix-endpoints.md for contract details)

## Mapping: Features → Modules
- F1: Route & nav → src/data/navigationData.ts
- F2: Model mapping → src/lib/ai/modelMap.ts
- F3: Streaming/genmodel → src/lib/ai/genmodel.ts

## Implementation plan & milestones
- Milestone 1: route/nav normalization
- Milestone 2: unify helpers & mapping
- Milestone 3: schema-constrained genmodel adoption

## Testing & Observability
- Unit tests for helpers
- Integration tests for genmodel roundtrip
EOF
      ;;
    03-tasks.md)
      do_cmd cat > "$dest" <<'EOF'
# 03-tasks — Atomic tasks

Traceability: each task must include a Task ID (e.g., F1) and reference a plan section in spec/02-plan.md.
PRs should reference Task IDs.

## Immediate / Near-term tasks
(Tasks extracted from ROADMAP — each task should contain acceptance criteria)
EOF
      ;;
    appendix-endpoints.md)
      do_cmd cat > "$dest" <<'EOF'
# Appendix: Endpoint Contracts

This appendix contains payload/response shapes and error contract recommendations.

- /api/genmodel — streamed typed JSON responses
- /api/vercel-ai/generate — exploratory text

Error shape:
{
  "status": number,
  "code"?: string,
  "message": string,
  "details"?: any
}
EOF
      ;;
    *)
      do_cmd touch "$dest"
      ;;
  esac
  do_cmd git add -- "$dest" || true
  echo "Created template: $dest"
}

append_file_with_section() {
  local src="$1" dst="$2" heading="$3"
  if [[ ! -f "$src" ]]; then
    echo "SKIP: source missing: $src"
    return 0
  fi
  ensure_spec_file "$dst"
  if ! grep -qF "$heading" "$dst" 2>/dev/null; then
    do_cmd printf "\n\n%s\n\n" "$heading" >> "$dst"
  fi
  do_cmd cat "$src" >> "$dst"
  do_cmd git add -- "$dst" || true
  echo "Appended $src -> $dst under heading: $heading"
}

merge_and_archive() {
  local src="$1" dst="$2" archive="$3" heading="$4"
  append_file_with_section "$src" "$dst" "$heading"
  do_cmd mkdir -p "$(dirname "$archive")"
  if git ls-files --error-unmatch -- "$src" >/dev/null 2>&1; then
    do_cmd git mv -- "$src" "$archive"
  else
    do_cmd mv -- "$src" "$archive"
    do_cmd git add -- "$archive" || true
  fi
  echo "Archived original: $src -> $archive"
}

move_or_mv() {
  local src="$1" dst="$2"
  if [[ ! -e "$src" ]]; then
    echo "SKIP: $src not found"
    return 0
  fi
  do_cmd mkdir -p "$(dirname "$dst")"
  if git ls-files --error-unmatch -- "$src" >/dev/null 2>&1; then
    do_cmd git mv -- "$src" "$dst"
  else
    do_cmd mv -- "$src" "$dst"
    do_cmd git add -- "$dst" || true
  fi
  echo "Moved: $src -> $dst"
}

# Pre-flight
if [[ ! -d .git ]]; then
  echo "ERROR: run from repo root (no .git found)"; exit 1
fi
echo "Git branch: $(git rev-parse --abbrev-ref HEAD)"

if [[ "$AUTO_YES" -eq 0 ]]; then
  echo
  echo "This will reorganize spec/ files and create spec/01–03 templates."
  printf "Proceed? [y/N]: "
  read -r REPLY
  if [[ ! "$REPLY" =~ ^[Yy]$ ]]; then
    echo "Aborted by user."
    exit 0
  fi
fi

# Prepare folders
do_cmd mkdir -p spec docs docs/history

# 1) 01-spec: product spec + merge spec-existing-application
prod_src=$(first_existing "spec/product_spec.md" "spec/product-spec.md")
if [[ -n "$prod_src" ]]; then
  ensure_spec_file "spec/01-spec.md"
  append_file_with_section "$prod_src" "spec/01-spec.md" "## Product spec (migrated)"
  if git ls-files --error-unmatch -- "$prod_src" >/dev/null 2>&1; then
    do_cmd git rm -- "$prod_src" || true
  else
    do_cmd rm -f -- "$prod_src" || true
  fi
else
  echo "WARN: product spec not found"
fi

if [[ -f spec/spec-existing-application.md ]]; then
  merge_and_archive "spec/spec-existing-application.md" "spec/01-spec.md" "docs/history/spec-existing-application.md" "## Context / Existing system (archived)"
fi

# 2) 02-plan: tech plan + merge tech stack
plan_src=$(first_existing "spec/tech_plan.md" "spec/tech-plan.md")
if [[ -n "$plan_src" ]]; then
  if [[ -f spec/02-plan.md ]]; then
    append_file_with_section "$plan_src" "spec/02-plan.md" "## Technical Plan (migrated)"
    do_cmd git rm -- "$plan_src" || true
  else
    move_or_mv "$plan_src" "spec/02-plan.md"
  fi
else
  echo "WARN: tech plan not found"
fi

stack_src=$(first_existing "spec/tech_stack.md" "spec/tech-stack.md")
if [[ -n "$stack_src" ]]; then
  ensure_spec_file "spec/02-plan.md"
  append_file_with_section "$stack_src" "spec/02-plan.md" "## Stack"
  do_cmd git rm -- "$stack_src" || true
fi

# 3) ROADMAP: extract near-term to spec/03-tasks.md; long-term to docs/ROADMAP.md
if [[ -f spec/ROADMAP.md ]]; then
  if grep -q '^## Immediate' spec/ROADMAP.md 2>/dev/null && grep -q '^## Agent-Specific Enhancements' spec/ROADMAP.md 2>/dev/null; then
    tmp_immediate=$(mktemp)
    tmp_long=$(mktemp)
    awk 'BEGIN{p=0} /^## Immediate/{p=1} p{print} /^## Agent-Specific Enhancements/{exit}' spec/ROADMAP.md > "$tmp_immediate"
    awk '/^## Agent-Specific Enhancements/{p=1} p{print}' spec/ROADMAP.md > "$tmp_long"
    ensure_spec_file "spec/03-tasks.md"
    append_file_with_section "$tmp_immediate" "spec/03-tasks.md" "## Immediate (extracted from ROADMAP)"
    do_cmd mv -- "$tmp_long" docs/ROADMAP.md
    do_cmd git add -- docs/ROADMAP.md || true
    do_cmd git rm -- spec/ROADMAP.md || true
    rm -f "$tmp_immediate" "$tmp_long"
  else
    move_or_mv "spec/ROADMAP.md" "docs/ROADMAP.md"
  fi
else
  echo "WARN: spec/ROADMAP.md missing"
fi

# 4) constitution -> ensure in spec
if [[ -f spec/constitution.md ]]; then
  echo "spec/constitution.md present (canonical)"
else
  if [[ -f constitution.md ]]; then
    move_or_mv "constitution.md" "spec/constitution.md"
  else
    echo "WARN: constitution not found locally; creating minimal template"
    ensure_spec_file "spec/constitution.md"
  fi
fi

# 5) endpoint contracts -> appendix (move or append)
if [[ -f spec/endpoint-contracts.md ]]; then
  if [[ -f spec/appendix-endpoints.md ]]; then
    append_file_with_section "spec/endpoint-contracts.md" "spec/appendix-endpoints.md" "## Endpoint Contracts (migrated)"
    do_cmd git rm -- "spec/endpoint-contracts.md" || true
  else
    move_or_mv "spec/endpoint-contracts.md" "spec/appendix-endpoints.md"
  fi
fi
ensure_spec_file "spec/appendix-endpoints.md"

# 6) spec-kit -> fold into README.md
if [[ -f spec/spec-kit.md ]]; then
  if [[ ! -f README.md ]]; then
    do_cmd printf "%s\n" "# Project README" > README.md
    do_cmd git add README.md || true
  fi
  if ! grep -q "^## Spec Kit" README.md 2>/dev/null; then
    do_cmd printf "\n\n## Spec Kit\n\n" >> README.md
    do_cmd git add README.md || true
  fi
  do_cmd cat spec/spec-kit.md >> README.md
  if git ls-files --error-unmatch -- spec/spec-kit.md >/dev/null 2>&1; then
    do_cmd git rm -- spec/spec-kit.md || true
  else
    do_cmd rm -f -- spec/spec-kit.md || true
  fi
  do_cmd git add README.md || true
fi

# 7) supporting docs -> docs/
move_or_mv "spec/SEARCH_PATTERNS.md" "docs/SEARCH_PATTERNS.md"
move_or_mv "spec/TESTING_CHECKLIST.md" "docs/TESTING.md"
move_or_mv "spec/migration.md" "docs/MIGRATION.md"
move_or_mv "spec/agents.md" "docs/AGENTS.md"

# 8) CODEOWNERS: prefer root
if [[ -f .github/CODEOWNERS.md ]]; then
  if [[ -f CODEOWNERS ]]; then
    move_or_mv ".github/CODEOWNERS.md" "CODEOWNERS.from_dotgithub"
  else
    move_or_mv ".github/CODEOWNERS.md" "CODEOWNERS"
  fi
fi

# 9) stop tracking .specify/memory
if [[ -d .specify/memory ]]; then
  tracked=$(git ls-files -- .specify/memory 2>/dev/null || true)
  if [[ -n "$tracked" ]]; then
    do_cmd git rm --cached -r .specify/memory || true
  fi
  if [[ ! -f .gitignore ]] || ! grep -qF ".specify/memory/" .gitignore 2>/dev/null; then
    do_cmd printf "\n.specify/memory/\n" >> .gitignore
    do_cmd git add .gitignore || true
  fi
fi

# 10) minimal page updates: roadmap page -> docs/ROADMAP.md; archive spec page ref
if [[ -f src/app/roadmap/page.tsx ]]; then
  echo "Updating src/app/roadmap/page.tsx to read docs/ROADMAP.md"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "DRY: replace `ROADMAP.md` -> `docs/ROADMAP.md` in src/app/roadmap/page.tsx"
  else
    perl -0777 -pe 's/path\.join\(process\.cwd\(\)\s*,\s*["'\''"]?ROADMAP\.md["'\''"]?\)/path.join(process.cwd(), "docs", "ROADMAP.md")/g' -i.bak src/app/roadmap/page.tsx || true
    do_cmd git add -- src/app/roadmap/page.tsx || true
    do_cmd rm -f src/app/roadmap/page.tsx.bak || true
  fi
fi

if [[ -f src/app/docs/spec-existing-application/page.tsx ]]; then
  echo "Updating src/app/docs/spec-existing-application/page.tsx to reference docs/history"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "DRY: replace docs/spec-existing-application.md -> docs/history/spec-existing-application.md"
  else
    perl -0777 -pe 's|docs/spec-existing-application\.md|docs/history/spec-existing-application.md|g' -i.bak src/app/docs/spec-existing-application/page.tsx || true
    do_cmd git add -- src/app/docs/spec-existing-application/page.tsx || true
    do_cmd rm -f src/app/docs/spec-existing-application/page.tsx.bak || true
  fi
fi

# Link: add reference in plan to appendix endpoints if missing
if [[ -f spec/02-plan.md ]] && ! grep -q 'appendix-endpoints.md' spec/02-plan.md 2>/dev/null; then
  do_cmd printf "\n\nSee: spec/appendix-endpoints.md\n" >> spec/02-plan.md
  do_cmd git add -- spec/02-plan.md || true
fi

# Finalize & commit
if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "DRY RUN complete — no commit created."
  exit 0
fi

do_cmd git add -A
if ! git diff --cached --quiet; then
  do_cmd git commit -m "Reorg: canonical spec core under /spec (01–03), supporting docs → /docs, archive existing-system, fold spec-kit into README; ignore .specify/memory"
else
  echo "No staged changes to commit."
fi

echo "Done. Please review spec/01–03 and tidy merged content (dedupe headers, add task IDs in spec/03-tasks.md)."
```# filepath: scripts/reorg-spec.sh
#!/usr/bin/env zsh
# Reorg spec/doc files and insert minimal spec headers (idempotent).
# Usage:
#   ./scripts/reorg-spec.sh        # interactive run
#   ./scripts/reorg-spec.sh -n     # dry-run (no fs/git changes)
#   ./scripts/reorg-spec.sh -y     # non-interactive
set -euo pipefail
IFS=$'\n\t'

DRY_RUN=0
AUTO_YES=0
while [[ $# -gt 0 ]]; do
  case $1 in
    -n|--dry-run) DRY_RUN=1 ;;
    -y|--yes) AUTO_YES=1 ;;
    -h|--help) echo "Usage: $0 [-n|--dry-run] [-y|--yes]"; exit 0 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
  shift
done

do_cmd() { echo "+ $*"; [[ "$DRY_RUN" -eq 1 ]] || "$@"; }

first_existing() {
  for p in "$@"; do [[ -f "$p" ]] && { echo "$p"; return 0; } done
  return 1
}

ensure_spec_file() {
  local dest="$1"
  if [[ -f "$dest" && -s "$dest" ]]; then
    echo "OK: $dest exists"
    return 0
  fi
  do_cmd mkdir -p "$(dirname "$dest")"
  case "$(basename "$dest")" in
    01-spec.md)
      do_cmd cat > "$dest" <<'EOF'
# 01-spec — What & Why

## Summary
[One-paragraph summary of the product and goals]

## Context / Existing system
(See archived: docs/history/spec-existing-application.md)

## Goals (high-level)
- G1: schema-first generation of artifacts
- G2: unified endpoint & model mapping
- G3: consistent agent UIs and persistence model

## Acceptance criteria
- A1: typed models validate with zod
- A2: model mapping and endpoints have tests
- A3: route/navigation verification passes

## Related
- spec/constitution.md
- spec/02-plan.md
EOF
      ;;
    02-plan.md)
      do_cmd cat > "$dest" <<'EOF'
# 02-plan — How (architecture, data model, interfaces)

## Summary
[How we'll build it — modules, responsibilities, and milestones]

## Architecture overview
- UI agents
- Orchestrators
- Shared ai helpers: src/lib/ai

## Data model / Schemas
- OntologySchema
- ModelviewSchema
- ObjectSchema

## Interfaces
(See spec/appendix-endpoints.md for contract details)

## Mapping: Features → Modules
- F1: Route & nav → src/data/navigationData.ts
- F2: Model mapping → src/lib/ai/modelMap.ts
- F3: Streaming/genmodel → src/lib/ai/genmodel.ts

## Implementation plan & milestones
- Milestone 1: route/nav normalization
- Milestone 2: unify helpers & mapping
- Milestone 3: schema-constrained genmodel adoption

## Testing & Observability
- Unit tests for helpers
- Integration tests for genmodel roundtrip
EOF
      ;;
    03-tasks.md)
      do_cmd cat > "$dest" <<'EOF'
# 03-tasks — Atomic tasks

Traceability: each task must include a Task ID (e.g., F1) and reference a plan section in spec/02-plan.md.
PRs should reference Task IDs.

## Immediate / Near-term tasks
(Tasks extracted from ROADMAP — each task should contain acceptance criteria)
EOF
      ;;
    appendix-endpoints.md)
      do_cmd cat > "$dest" <<'EOF'
# Appendix: Endpoint Contracts

This appendix contains payload/response shapes and error contract recommendations.

- /api/genmodel — streamed typed JSON responses
- /api/vercel-ai/generate — exploratory text

Error shape:
{
  "status": number,
  "code"?: string,
  "message": string,
  "details"?: any
}
EOF
      ;;
    *)
      do_cmd touch "$dest"
      ;;
  esac
  do_cmd git add -- "$dest" || true
  echo "Created template: $dest"
}

append_file_with_section() {
  local src="$1" dst="$2" heading="$3"
  if [[ ! -f "$src" ]]; then
    echo "SKIP: source missing: $src"
    return 0
  fi
  ensure_spec_file "$dst"
  if ! grep -qF "$heading" "$dst" 2>/dev/null; then
    do_cmd printf "\n\n%s\n\n" "$heading" >> "$dst"
  fi
  do_cmd cat "$src" >> "$dst"
  do_cmd git add -- "$dst" || true
  echo "Appended $src -> $dst under heading: $heading"
}

merge_and_archive() {
  local src="$1" dst="$2" archive="$3" heading="$4"
  append_file_with_section "$src" "$dst" "$heading"
  do_cmd mkdir -p "$(dirname "$archive")"
  if git ls-files --error-unmatch -- "$src" >/dev/null 2>&1; then
    do_cmd git mv -- "$src" "$archive"
  else
    do_cmd mv -- "$src" "$archive"
    do_cmd git add -- "$archive" || true
  fi
  echo "Archived original: $src -> $archive"
}

move_or_mv() {
  local src="$1" dst="$2"
  if [[ ! -e "$src" ]]; then
    echo "SKIP: $src not found"
    return 0
  fi
  do_cmd mkdir -p "$(dirname "$dst")"
  if git ls-files --error-unmatch -- "$src" >/dev/null 2>&1; then
    do_cmd git mv -- "$src" "$dst"
  else
    do_cmd mv -- "$src" "$dst"
    do_cmd git add -- "$dst" || true
  fi
  echo "Moved: $src -> $dst"
}

# Pre-flight
if [[ ! -d .git ]]; then
  echo "ERROR: run from repo root (no .git found)"; exit 1
fi
echo "Git branch: $(git rev-parse --abbrev-ref HEAD)"

if [[ "$AUTO_YES" -eq 0 ]]; then
  echo
  echo "This will reorganize spec/ files and create spec/01–03 templates."
  printf "Proceed? [y/N]: "
  read -r REPLY
  if [[ ! "$REPLY" =~ ^[Yy]$ ]]; then
    echo "Aborted by user."
    exit 0
  fi
fi

# Prepare folders
do_cmd mkdir -p spec docs docs/history

# 1) 01-spec: product spec + merge spec-existing-application
prod_src=$(first_existing "spec/product_spec.md" "spec/product-spec.md")
if [[ -n "$prod_src" ]]; then
  ensure_spec_file "spec/01-spec.md"
  append_file_with_section "$prod_src" "spec/01-spec.md" "## Product spec (migrated)"
  if git ls-files --error-unmatch -- "$prod_src" >/dev/null 2>&1; then
    do_cmd git rm -- "$prod_src" || true
  else
    do_cmd rm -f -- "$prod_src" || true
  fi
else
  echo "WARN: product spec not found"
fi

if [[ -f spec/spec-existing-application.md ]]; then
  merge_and_archive "spec/spec-existing-application.md" "spec/01-spec.md" "docs/history/spec-existing-application.md" "## Context / Existing system (archived)"
fi

# 2) 02-plan: tech plan + merge tech stack
plan_src=$(first_existing "spec/tech_plan.md" "spec/tech-plan.md")
if [[ -n "$plan_src" ]]; then
  if [[ -f spec/02-plan.md ]]; then
    append_file_with_section "$plan_src" "spec/02-plan.md" "## Technical Plan (migrated)"
    do_cmd git rm -- "$plan_src" || true
  else
    move_or_mv "$plan_src" "spec/02-plan.md"
  fi
else
  echo "WARN: tech plan not found"
fi

stack_src=$(first_existing "spec/tech_stack.md" "spec/tech-stack.md")
if [[ -n "$stack_src" ]]; then
  ensure_spec_file "spec/02-plan.md"
  append_file_with_section "$stack_src" "spec/02-plan.md" "## Stack"
  do_cmd git rm -- "$stack_src" || true
fi

# 3) ROADMAP: extract near-term to spec/03-tasks.md; long-term to docs/ROADMAP.md
if [[ -f spec/ROADMAP.md ]]; then
  if grep -q '^## Immediate' spec/ROADMAP.md 2>/dev/null && grep -q '^## Agent-Specific Enhancements' spec/ROADMAP.md 2>/dev/null; then
    tmp_immediate=$(mktemp)
    tmp_long=$(mktemp)
    awk 'BEGIN{p=0} /^## Immediate/{p=1} p{print} /^## Agent-Specific Enhancements/{exit}' spec/ROADMAP.md > "$tmp_immediate"
    awk '/^## Agent-Specific Enhancements/{p=1} p{print}' spec/ROADMAP.md > "$tmp_long"
    ensure_spec_file "spec/03-tasks.md"
    append_file_with_section "$tmp_immediate" "spec/03-tasks.md" "## Immediate (extracted from ROADMAP)"
    do_cmd mv -- "$tmp_long" docs/ROADMAP.md
    do_cmd git add -- docs/ROADMAP.md || true
    do_cmd git rm -- spec/ROADMAP.md || true
    rm -f "$tmp_immediate" "$tmp_long"
  else
    move_or_mv "spec/ROADMAP.md" "docs/ROADMAP.md"
  fi
else
  echo "WARN: spec/ROADMAP.md missing"
fi

# 4) constitution -> ensure in spec
if [[ -f spec/constitution.md ]]; then
  echo "spec/constitution.md present (canonical)"
else
  if [[ -f constitution.md ]]; then
    move_or_mv "constitution.md" "spec/constitution.md"
  else
    echo "WARN: constitution not found locally; creating minimal template"
    ensure_spec_file "spec/constitution.md"
  fi
fi

# 5) endpoint contracts -> appendix (move or append)
if [[ -f spec/endpoint-contracts.md ]]; then
  if [[ -f spec/appendix-endpoints.md ]]; then
    append_file_with_section "spec/endpoint-contracts.md" "spec/appendix-endpoints.md" "## Endpoint Contracts (migrated)"
    do_cmd git rm -- "spec/endpoint-contracts.md" || true
  else
    move_or_mv "spec/endpoint-contracts.md" "spec/appendix-endpoints.md"
  fi
fi
ensure_spec_file "spec/appendix-endpoints.md"

# 6) spec-kit -> fold into README.md
if [[ -f spec/spec-kit.md ]]; then
  if [[ ! -f README.md ]]; then
    do_cmd printf "%s\n" "# Project README" > README.md
    do_cmd git add README.md || true
  fi
  if ! grep -q "^## Spec Kit" README.md 2>/dev/null; then
    do_cmd printf "\n\n## Spec Kit\n\n" >> README.md
    do_cmd git add README.md || true
  fi
  do_cmd cat spec/spec-kit.md >> README.md
  if git ls-files --error-unmatch -- spec/spec-kit.md >/dev/null 2>&1; then
    do_cmd git rm -- spec/spec-kit.md || true
  else
    do_cmd rm -f -- spec/spec-kit.md || true
  fi
  do_cmd git add README.md || true
fi

# 7) supporting docs -> docs/
move_or_mv "spec/SEARCH_PATTERNS.md" "docs/SEARCH_PATTERNS.md"
move_or_mv "spec/TESTING_CHECKLIST.md" "docs/TESTING.md"
move_or_mv "spec/migration.md" "docs/MIGRATION.md"
move_or_mv "spec/agents.md" "docs/AGENTS.md"

# 8) CODEOWNERS: prefer root
if [[ -f .github/CODEOWNERS.md ]]; then
  if [[ -f CODEOWNERS ]]; then
    move_or_mv ".github/CODEOWNERS.md" "CODEOWNERS.from_dotgithub"
  else
    move_or_mv ".github/CODEOWNERS.md" "CODEOWNERS"
  fi
fi

# 9) stop tracking .specify/memory
if [[ -d .specify/memory ]]; then
  tracked=$(git ls-files -- .specify/memory 2>/dev/null || true)
  if [[ -n "$tracked" ]]; then
    do_cmd git rm --cached -r .specify/memory || true
  fi
  if [[ ! -f .gitignore ]] || ! grep -qF ".specify/memory/" .gitignore 2>/dev/null; then
    do_cmd printf "\n.specify/memory/\n" >> .gitignore
    do_cmd git add .gitignore || true
  fi
fi

# 10) minimal page updates: roadmap page -> docs/ROADMAP.md; archive spec page ref
if [[ -f src/app/roadmap/page.tsx ]]; then
  echo "Updating src/app/roadmap/page.tsx to read docs/ROADMAP.md"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "DRY: replace `ROADMAP.md` -> `docs/ROADMAP.md` in src/app/roadmap/page.tsx"
  else
    perl -0777 -pe 's/path\.join\(process\.cwd\(\)\s*,\s*["'\''"]?ROADMAP\.md["'\''"]?\)/path.join(process.cwd(), "docs", "ROADMAP.md")/g' -i.bak src/app/roadmap/page.tsx || true
    do_cmd git add -- src/app/roadmap/page.tsx || true
    do_cmd rm -f src/app/roadmap/page.tsx.bak || true
  fi
fi

if [[ -f src/app/docs/spec-existing-application/page.tsx ]]; then
  echo "Updating src/app/docs/spec-existing-application/page.tsx to reference docs/history"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "DRY: replace docs/spec-existing-application.md -> docs/history/spec-existing-application.md"
  else
    perl -0777 -pe 's|docs/spec-existing-application\.md|docs/history/spec-existing-application.md|g' -i.bak src/app/docs/spec-existing-application/page.tsx || true
    do_cmd git add -- src/app/docs/spec-existing-application/page.tsx || true
    do_cmd rm -f src/app/docs/spec-existing-application/page.tsx.bak || true
  fi
fi

# Link: add reference in plan to appendix endpoints if missing
if [[ -f spec/02-plan.md ]] && ! grep -q 'appendix-endpoints.md' spec/02-plan.md 2>/dev/null; then
  do_cmd printf "\n\nSee: spec/appendix-endpoints.md\n" >> spec/02-plan.md
  do_cmd git add -- spec/02-plan.md || true
fi

# Finalize & commit
if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "DRY RUN complete — no commit created."
  exit 0
fi

do_cmd git add -A
if ! git diff --cached --quiet; then
  do_cmd git commit -m "Reorg: canonical spec core under /spec (01–03), supporting docs → /docs, archive existing-system, fold spec-kit into README; ignore .specify/memory"
else
  echo "No staged changes to commit."
fi

echo "Done. Please review spec/01–03 and tidy merged content (dedupe headers, add task IDs in spec/03-tasks.md)."
```