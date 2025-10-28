# ROADMAP – AKM Workspace App

## 1. Purpose
Define phased milestones for implementing the AKM Workspace App — a collaborative environment for modelling POPS, IRTV, and META structures using SpecKit planning and JSON-based storage.

Each milestone aligns with one AKM step:
1. Domain Scoping (POPS)
2. Scenario Modelling (IRTV)
3. Solution Building (META)
4. Integration & Automation (Agents + Generators)

---

## 2. Version Overview

| Version    | Codename     | Focus                     | Output                                               |
| ---------- | ------------ | ------------------------- | ---------------------------------------------------- |
| **v0.1.0** | *Scoping*    | POPS Domain Modeller      | `/models/pops.json`, working GoJS editor             |
| **v0.2.0** | *Scenario*   | IRTV Workspace Modeller   | `/models/irtv/{processId}.json`, nested diagrams     |
| **v0.3.0** | *Metatype*   | META Definition Builder   | `/models/meta/metamodel.json`, TypeScript generator  |
| **v0.4.0** | *Integrator* | JSON/IMF Data Mapping     | Import/export, validation pipeline                   |
| **v0.5.0** | *Agent*      | AI Agents + Validation    | Automated checks, pattern generation                 |
| **v1.0.0** | *Workspace*  | Unified collaborative app | Real-time co-editing, GitHub sync, versioned release |

---

## 3. Milestone Details

### v0.1.0 – POPS Domain Modeller
**Goal:** Enable creation, editing, and visualization of POPS models.

**Deliverables**
- GoJS canvas for Products, Organizations, Processes, Systems.
- Redux store + JSON persistence.
- `pops.json` read/write API routes.
- Schema validation (`pops-schema.json`).
- Jest and Playwright tests.

**Acceptance Criteria**
- Models can be created, linked, saved, and reopened.
- JSON export/import verified.

---

### v0.2.0 – IRTV Workspace Modeller
**Goal:** Define scenarios for each POPS Process.

**Deliverables**
- IRTV editor with Role–Task–Information–View elements.
- Context-based creation (linked to POPS process ID).
- JSON persistence per process.
- Validation rules and test coverage.

**Acceptance Criteria**
- At least one IRTV model linked to a POPS process.
- IRTV → META exportable dataset.

---

### v0.3.0 – META Definition Builder
**Goal:** Transform IRTV Information into structured metamodels.

**Deliverables**
- META editor (EntityType, Property, Datatype).
- Import from IRTV.
- Code generator for `metamodel.ts`.
- Automated validation and Jest integration tests.

**Acceptance Criteria**
- Generated metamodel compiles and passes type validation.

---

### v0.4.0 – Integrator
**Goal:** Implement data exchange and alignment with external standards (IMF, OSDU).

**Deliverables**
- Import/export for JSON-LD, CSV, and RDF.
- Mapping tool for Information ↔ Schema alignment.
- Validation layer enforcing IMF constraints.

**Acceptance Criteria**
- Roundtrip (AKM → IMF → AKM) tested with sample dataset.

---

### v0.5.0 – Agent & Automation
**Goal:** Introduce AI-driven modelling assistance and integrity checks.

**Deliverables**
- Agent definitions in `agents.md`.
- Automatic schema generation suggestions.
- Semantic validation (lineage, missing roles, duplicate info).
- Unit tests for agent responses.

**Acceptance Criteria**
- Agents identify missing or inconsistent model elements automatically.

---

### v1.0.0 – Workspace Integration
**Goal:** Deliver a cohesive, collaborative modelling environment.

**Deliverables**
- Unified dashboard combining POPS, IRTV, META.
- Real-time multi-user collaboration (Y.js).
- GitHub sync and SpecKit versioning.
- Release documentation and user guide.

**Acceptance Criteria**
- Workspace runs end-to-end model pipeline.
- Models persist, sync, and regenerate consistently.
- 100% SpecKit compliance across all layers.

---

## 4. Long-Term Extensions (Post v1.0)
- Integration with IMF digital thread API.
- Visual diff and lineage tracking.
- Cloud storage backend (Postgres/Neo4j).
- Agent-based auto-documentation.
- Plugin SDK for external model types.

---

## 5. Governance
- Milestones tracked as GitHub Projects.
- All merges require passing SpecKit validation and test suite.
- Each release tagged and documented with associated SpecKit files.

---

## 6. Summary Flow