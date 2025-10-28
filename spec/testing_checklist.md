# Testing Checklist – AKM Workspace App

## 1. Purpose
Ensure all modelling layers (POPS, IRTV, META) function correctly, preserve lineage, and comply with AKM principles and IMF semantics.

Testing is divided into:
- **Functional Validation:** each model layer behaves as intended.
- **Data Validation:** structure and relationships match schema rules.
- **Integration Validation:** data flow and lineage integrity between layers.
- **Semantic Alignment:** IMF-style constraints are respected.

---

## 2. POPS Layer Tests (Domain Scoping)

### 2.1 Functional
- [ ] Can create, edit, and delete nodes (Product, Organization, Process, System).
- [ ] Can link nodes and visualize relationships in GoJS.
- [ ] Model saves correctly to `/models/pops.json`.
- [ ] Undo/redo works without data loss.

### 2.2 Data Validation
- [ ] Each node has a unique `id`.
- [ ] Node `type` ∈ {Product, Organization, Process, System}.
- [ ] No orphaned links (each link connects existing node IDs).
- [ ] JSON validates against `pops-schema.json`.

### 2.3 Integration
- [ ] Each Process node ID can be referenced by IRTV models.
- [ ] Versioned JSON saved with timestamp for traceability.

---

## 3. IRTV Layer Tests (Scenario Modelling)

### 3.1 Functional
- [ ] Can open existing Process from POPS and create IRTV scenario.
- [ ] Can add and connect Information, Role, Task, and View elements.
- [ ] Changes persist to `/models/irtv/{processId}.json`.
- [ ] Diagram updates dynamically on relation changes.

### 3.2 Data Validation
- [ ] All node IDs unique within the process model.
- [ ] Each Task has at least one Role and one Information reference.
- [ ] Each View visualizes at least one Information object.
- [ ] `processId` matches an existing POPS Process node.
- [ ] JSON conforms to `irtv-schema.json`.

### 3.3 Integration
- [ ] References to POPS processes remain valid after edits.
- [ ] `Information` nodes can be exported to META as candidate `EntityTypes`.

---

## 4. META Layer Tests (Type Definition Modelling)

### 4.1 Functional
- [ ] Can import `Information` from IRTV models.
- [ ] Can define new `EntityType`, `Property`, and `Datatype`.
- [ ] Can save model to `/models/meta/metamodel.json`.
- [ ] Can generate TypeScript definitions with `POST /api/models/meta/generate`.

### 4.2 Data Validation
- [ ] All `EntityTypes` have unique names.
- [ ] All `Properties` belong to a valid `EntityType`.
- [ ] `Datatype` fields conform to schema (e.g., string, number, boolean).
- [ ] JSON validates against `meta-schema.json`.

### 4.3 Integration
- [ ] Every `EntityType` traceable to its originating IRTV Information node.
- [ ] Generated TypeScript matches schema and compiles without errors.

---

## 5. End-to-End Validation (POPS → IRTV → META)

- [ ] ID consistency maintained across layers.
- [ ] Data lineage (`sourceId`, `derivedFrom`) present in all models.
- [ ] JSON read/write cycle does not break model integrity.
- [ ] Model export/import preserves relationships.
- [ ] “Generate app” pipeline creates valid Next.js component or schema.

---

## 6. Semantic Validation (IMF Alignment)

Inspired by IMF Manual v0.3.0 (§3.3–4.2):

- [ ] `partOf` and `connectedTo` relations do not cross layers inappropriately.
- [ ] Each model enforces “single parent” hierarchy rule (no multi-partOf).
- [ ] Cross-aspect proxies (e.g., POPS ↔ IRTV ↔ META) remain valid.
- [ ] Aspect rules respected:
  - POPS → Domain scope
  - IRTV → Activity, Roles, Tasks, Views
  - META → EntityType, Property, Datatype

---

## 7. System Testing

### 7.1 API Tests
- [ ] `GET /api/models/*` returns 200 and valid JSON.
- [ ] `POST /api/models/*` writes file successfully.
- [ ] Validation endpoints return correct errors.

### 7.2 UI Tests
- [ ] Canvas rendering (GoJS) behaves as expected.
- [ ] Node inspector reflects selected model element.
- [ ] View updates dynamically after JSON change.

### 7.3 File Tests
- [ ] Files are saved with deterministic order (for git diff readability).
- [ ] Missing JSON files trigger creation on first save.

---

## 8. Acceptance Criteria
- [ ] Each model layer passes schema validation.
- [ ] POPS–IRTV–META lineage confirmed.
- [ ] Model generator outputs a valid metamodel.
- [ ] Manual test run confirmed for at least one complete workflow:
  1. Create domain →  
  2. Build scenario →  
  3. Generate types →  
  4. Export app schema.

---

## 9. Future Tests
- Integration with agents for model validation.
- IMF RDF export comparison tests.
- Collaborative editing consistency (multi-user tests).