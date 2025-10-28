# Tech Plan – Domain-Driven Model Builder

## 1. Architecture Overview
The Model Builder is a workspace module for creating structured AKM models through three modelling tiers:
1. **POPS Domain Scoping** — defines Products, Organizations, Processes, and Systems.
2. **IRTV Scenario Modelling** — adds detail to Processes as Information, Roles, Tasks, and Views.
3. **TYPE Entity Modelling** — defines EntityTypes, Properties, and Datatypes derived from IRTV Information objects.

All tiers share a unified Redux data store, modular GoJS diagram views, and persist to a common PostgreSQL schema.

---

## 2. Core Modules

### 2.1 POPS Module
- **Purpose:** Define the top-level structure of the domain.  
- **Entities:** `Product`, `Organization`, `Process`, `System`.  
- **Data Model:**  

### 2.2 IRTV Module
- **Purpose:** Add scenario logic for each Process in POPS.
	•	Entities: Information, Role, Task, View.
	•	Relations:
	•	Role performs Task.
	•	Task uses Information.
	•	View visualizes Information.
	•	Reducers:
	•	addScenario(processId), assignRole, connectTaskInfo, addView.
	•	UI Components:
	•	ScenarioCanvas (nested diagram per Process).
	•	TaskTable for metadata editing.
	•	Output: IRTV.json scenario definition.

    2.3 META Module
	•	Purpose: Generate formal type definitions from IRTV Information objects.
	•	Entities: EntityType, Property, Datatype, Metamodel.
	•	Flow:
	1.	Import IRTV Information nodes.
	2.	Derive EntityTypes and Properties.
	3.	Allow editing and export as TypeScript interfaces or CSV schema.
	•	Output: metamodel.ts, metamodel.csv.

