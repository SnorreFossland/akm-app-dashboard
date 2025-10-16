# Constitution

## 1. Purpose
Defines non-negotiable project rules.

## 2. Principles
- Specification precedes planning and coding.
- All PRs reference a Task ID.
- No code without associated tests.

## 3. Stack Boundaries
Next.js, Redux Toolkit, shadcn/ui, mermaid only.
No uncontrolled DOM libs or global mutable state.

## 4. Code Quality
- ESLint: no warnings in CI.
- Prettier enforced.
- 90% line coverage minimum.
- TypeScript strict mode required.

## 5. Security
No secrets committed; .env in .gitignore; review third-party deps quarterly.

## 6. Collaboration
Conventional Commits; branch naming `feat/*`, `fix/*`; PR review required.

## 7. Documentation
All new features update `/spec/` and `/docs/`.

## 8. Violations
Any artifact conflicting with this document must be corrected before merge.