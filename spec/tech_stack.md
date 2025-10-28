# Tech Stack – Model Builder (Domain Definition)

## Frontend
- **Next.js 15 (App Router)** — main framework; SSR + API routes.  
- **Redux Toolkit** — state management for model trees, nodes, and selections.  
- **GoJS** — graph editor for nodes and relationships (POPS, IRTV, META).  
- **ShadCN UI** — base components for panels, modals, and toolbars.  
- **TailwindCSS** — layout styling.  
- **Mermaid** — Preview of charts and model instances.  

## Backend
- **Next.js API Routes** — store, fetch, and transform model JSON.  
- **Prisma + PostgreSQL** — persistence for domain definitions, entities, and properties.  
- **GraphQL (Apollo)** — optional query layer for model data access.  

## Model Layer
- **AKM MetaSchema** — POPS / IRTV / META definitions as TypeScript interfaces.  
- **Validation Engine** — enforces type and relation rules based on IMF-like ontology.  
- **Import/Export** — CSV, JSON-LD, and IMF-RDF structures.  

## Integration / Agents
- **AI Agents** — for schema completion and pattern recognition (future).  
- **GitHub Actions** — for versioning and spec sync.  

## Testing / QA
- **Playwright** — for UI and interaction testing.  
- **Jest** — for data and reducer tests.  