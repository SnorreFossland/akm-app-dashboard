This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project Docs

- Agents Guide: see `agents.md`
- Roadmap: see `ROADMAP.md`
- Endpoint Contracts: see `docs/endpoint-contracts.md`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3001) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## What is AKM?

### Summary

The Active Knowledge Modeling (AKM) methodology outlines a structured approach to visual solutions development, leveraging information modeling to build customized IT platforms. AKM emphasizes a model-driven approach, using visual representations of information, roles, tasks, and views (IRTV) to manage knowledge and automate processes. It utilizes a knowledge architecture, which integrates information from diverse sources and provides a comprehensive picture of the solution being developed. This methodology advocates for user-centric design, enabling business users to control and adapt solutions through visual models, rather than being reliant on IT support. The document describes the core principles of AKM, outlining the different stages of development, from concept selection to platform delivery, and offers detailed explanations of how to implement the methodology.
+ printf


## Spec Kit


+ cat
spec/spec-kit.md
+ cat
spec/spec-kit.md
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