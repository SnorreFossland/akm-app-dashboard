import { metamodel } from '@/metamodel/metamodel';

// IRTV Metamodel Prompt
export const MetamodelPrompt = `
  # **Metamodel:**
  - Object Types:
  ${metamodel.objecttypes.map((obj) => `- id: ${obj.id}, name: ${obj.name}`).join('\n')}
  
  - Relationship Types:
  ${metamodel.relshiptypes.map((rel) => `- id: ${rel.id}, name: ${rel.name}, from ${rel.fromobjtypeRef}, to ${rel.toobjtypeRef}`).join('\n')}

  - Object Typeviews:
  ${metamodel.objecttypeviews.map((view) => `- id: ${view.id}, name: ${view.name}`).join('\n')}

## **Instructions**

You are tasked with first creating **Information objects** from the list of Ontology Terms given by the  **Information** and establishing relationships among them, adhering to the provided metamodel and ontology.

After creating Information objects with relationships, **create the related Tasks, Views, and Roles** based on domain analysis and logical associations with the Information objects and their relationships.
  
Ensure that all objects are interconnected, forming a cohesive knowledge structure.

### **Object Creation**

- First **Create Information Objects:**
  - Create object based on ontology terms.
  - Provide detailed descriptions without repeating the object's name.
  - Include an attribute 'proposedType' derived from the ontology terms.
  - Terms for Roles, Tasks, and Views should not be used for Information objects, but a data-record of them can be Information, and named to reflect that it is data-record 
  - Use ontology terms for 'name' and 'proposedType', use Camelcase.
  - Then Establish 'refersTo' relationships among Information objects.
  - Do **not** include the word "object" in the name.

- Next add **Tasks, Views, and Roles objects** based on the metamodel:
  - Create based on the actions, processes, and responsibilities identified during domain analysis of the  user prompt.
  - Do **not** add the 'proposedType' attribute.
  - Ensure names are appropriate (e.g., Views should not include the word "view" in the name).
  - Establish relationships between Tasks, Views, and Roles with Information objects.

  1. **Define Tasks:**
    - Identify actions or processes interacting with Information objects.
    - Create Tasks with descriptive names including a verb but not including the word 'Task'.
    - Provide detailed descriptions without using the word "task."
    - Establish 'worksOn' relationships between Tasks and Information objects.
    - Sequence tasks using 'triggers' relationships.

  2. **Develop Views:**
    - Create Views representing the presentation of Information objects for Tasks.
    - Names should not include the word "view."
    - Make sure that you create Views that cover all Information objects.
    - Establish 'applies' relationships from Tasks to Views.
    - Establish 'refersTo' relationships from Views to the created Information objects.
    - Ensure Views are connected to at least one Task and an Information object.

  3. **Assign Roles:**
    - Define Roles that perform or manage Tasks.
    - Names should not include the word "role."
    - Provide detailed descriptions without repeating the role's name.
    - Establish 'performs' or 'manages' relationships from Roles to Tasks.

  4. **Finalization:**
    - Ensure all objects are interconnected, forming a cohesive knowledge structure.
    - Make sure that Tasks are connected to at least one Role and one View.
    - Confirm that View are connected to Information objects.
    - Verify that all specified relationships are established according to the metamodel.
  
### **Constraints**

  - **Language Usage:**
    - Do **not** use the word "domain" in descriptions.
    - Avoid using the type name ('typeName') in descriptions.
    - Do **not** repeat the object's name in its description.

  - **Attributes and Types:**
    - Do **not** add the 'proposedType' attribute to Views, Tasks, or Roles.
    - Ensure the 'proposedType' for Information objects is accurately derived from ontology terms.
    - Use ontology terms for 'name' and 'proposedType' of Information objects if appropriate.
    - Ensure the 'proposedType' Camelcase one word.

  - **Object and Relationship Creation:**
    - Do **not** create duplicate objects.
    - Avoid creating relationships that already exist.
    - Establish relationships supported by the metamodel.
  
### **Additional Guidelines**

- Use domain analysis to in the creation of Tasks, Views, and Roles for the created Information objects.
- Generate relationships flowing from Roles ➔ Tasks ➔ Views ➔ Information objects.
- Maintain formal, precise language throughout.
- Ensure all objects have at least one relationship.
- Make sure to also create Roles, Tasks and Views that are connected to Information objects.

### **Examples**

{
  "objects": [
    {
      "id": "UUIDv4",
      "name": "Approve Request",
      "description": "Reviews and approves incoming requests based on predefined criteria.",
      "typeRef": "Task Type id",
      "typeName": "Task"
    },
    {
      "id": "UUIDv4",
      "name": "Manager",
      "description": "Oversees task execution and ensures objectives are met.",
      "typeRef": "Role Type id",
      "typeName": "Role"
    },
    {
      "id": "UUIDv4",
      "name": "User
      "description": "The user performing a Task.",
      "typeRef": "Role Type id",
      "typeName": "Role"
    },
    {
      "id": "UUIDv4",
      "name": "Request",
      "description": "Incoming request for approval.",
      "typeRef": "View Type id",
      "typeName": "View"
    },
    {
      "id": "UUIDv4",
      "name": "Equipment Record",
      "description": "Record of equipments.",
      "typeRef": "Information Type id",
      "typeName": "Information",
      "proposedType": "Equipment"
    },
    {
      "id": "UUIDv4",
      "name": "User Record",
      "description": "Record of users.",
      "typeRef": "Information Type id",
      "typeName": "Information",
      "proposedType": "Equipment"
    }
  ],
  "relationships": [
    {
      "id": "UUIDv4",
      "name": "approves",
      "typeRef": "Relationship Type id",
      "fromobjectRef": "Approve Request id",
      "nameFrom": "Approve Request",
      "toobjectRef": "Manager id",
      "nameTo": "Manager"
    }
    `;