# Agents – AKM Workspace App

## 1. Purpose
Define autonomous or semi-autonomous agents that operate inside the AKM Workspace to:
- Validate POPS, IRTV, and META models.
- Generate missing structures or relationships.
- Map external data (IMF, OSDU, JSON-LD) into AKM format.
- Provide feedback and automation within the modelling workflow.

---

## 2. Agent Taxonomy

| Agent                | Domain             | Input               | Output                              | Primary Role                        |
| -------------------- | ------------------ | ------------------- | ----------------------------------- | ----------------------------------- |
| **Validation Agent** | POPS / IRTV / META | Model JSON          | Report (warnings, errors, fixes)    | Structural and semantic checks      |
| **Schema Agent**     | IRTV → META        | IRTV JSON           | META JSON (EntityTypes, Properties) | Derive data model from scenarios    |
| **Mapping Agent**    | META ↔ IMF / OSDU  | Metamodels, schemas | Mapping specification JSON          | Align external standards            |
| **Refactor Agent**   | Any layer          | Model JSON          | Updated JSON                        | Normalize naming, remove duplicates |
| **Generator Agent**  | META               | Metamodel           | TypeScript / API files              | Produce executable code artifacts   |
| **Doc Agent**        | Any                | Model JSON          | Markdown report                     | Create human-readable documentation |
| **Observer Agent**   | Workspace          | User actions        | Log + Suggestions                   | Recommend workflow or fixes         |

---

## 3. Agent Interaction Model