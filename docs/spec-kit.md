# Spec Kit Usage Guide

## Purpose
Spec Kit enforces a **spec → plan → implement** workflow.  
It ensures that features and agents are defined, planned, and tested before merging.

## Workflow Phases
1. **Specify**  
   - Define the *what* in `.specify/product_spec.md`.  
   - Include goals, inputs/outputs, acceptance criteria.  
2. **Plan**  
   - Define the *how* in `.specify/tech_plan.md`.  
   - Include endpoints, data flows, files to touch, validation rules.  
3. **Implement**  
   - Execute tasks from `.specify/tasks.yaml`.  
   - Code changes must reference plan tasks.  

## Required Files
- `.specify/product_spec.md` → product specification.  
- `.specify/tech_plan.md` → technical plan.  
- `.specify/tasks.yaml` → implementation tasks with IDs, phases, dependencies.  

## Enforcement
- CI runs Spec Kit checks with three gates:  
  - `specify:spec`  
  - `specify:plan`  
  - `specify:impl`  
- PRs cannot merge unless all gates pass.  
- Any schema or endpoint change must update both `.specify/*` and `docs/endpoint-contracts.md`.  

## CLI Commands
Scripts defined in `package.json`:
```bash
pnpm spec:init   # Initialize Spec Kit
pnpm spec:spec   # Validate product spec
pnpm spec:plan   # Validate technical plan
pnpm spec:impl   # Validate implementation tasks
pnpm spec:check  # Run all phases