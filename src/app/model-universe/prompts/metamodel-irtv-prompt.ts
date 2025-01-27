import { metamodel } from '@/metamodel/metamodel';

// IRTV Metamodel Prompt
export const MetamodelPrompt = `
  # **Metamodel:**

  - Object Types:
  ${metamodel.objecttypes.map((obj) => `- id: ${obj.id}, name: ${obj.name}`).join('\n')}
  
  - Relationship Types:
  ${metamodel.relshiptypes.map((rel) => `- id: ${rel.id}, name: ${rel.name}, from ${rel.fromobjtypeRef}, to ${rel.toobjtypeRef}`).join('\n')}

## **Instructions**

You are tasked with first creating **Information** objects from the list of Terms given by the  **Terms** and establishing relationships among them, 
adhering to the provided metamodel and terms.

After creating Information objects with relationships, create the related Tasks, Views, and Roles** based on domain analysis 
and logical associations with the Information objects and their relationships.
  
Ensure that all objects are interconnected, forming a cohesive knowledge structure.

### **Object Creation**

- First **Create Information Objects:**
  - Create object based on the terms.
  - Provide detailed descriptions without repeating the object's name.
  - Terms for Roles, Tasks, and Views should not be used for Information objects, but a data-record of them can be Information, and named to reflect that it is data-record 
  - Use the terms name as name for the Information object.
  - Ensure the 'proposedType' Camelcase in one word.
  - Add 'proposedType' for Information object, that may be the same as the name.
  - Then Establish 'refersTo' relationships among Information objects.
  - The typeName of the Information object should be 'Information'.
  - Do **not** include the word "object" in the name.

- Next add **Tasks**, **Views**, and **Roles** objects interacting with the Information based on the metamodel:
  - Create based on the actions, processes, and responsibilities identified during domain analysis of the  user prompt.
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

  4. **Description Enhancement:**
    - Provide clear, precise, and informative descriptions for any existing objects lacking one.
    - Ensure descriptions capture the essence of the object without repeating the name.

  4. **Finalization:**
    - Ensure all objects are interconnected, forming a cohesive knowledge structure.
    - Make sure that Tasks are connected to at least one Role and one View.
    - Confirm that View are connected to Information objects.
    - Verify that all specified relationships are established according to the metamodel.
  
### **Constraints**

  - **Language Usage:**
    - Do **not** use the word "domain" in objects descriptions.
    - Avoid using the type name ('typeName') in descriptions.
    - Do **not** repeat the object's name in its description.

  - **Attributes and Types:**
    - Do **not** add the 'proposedType' attribute to Views, Tasks, or Roles.

  - **Object and Relationship Creation:**
    - Do **not** create duplicate objects.
    - Avoid creating relationships that already exist.
    - Establish relationships supported by the metamodel.
  
### **Additional Guidelines**

- Use domain analysis in the creation of Tasks, Views, and Roles for the created Information objects.
- Generate relationships flowing from Roles ➔ Tasks ➔ Views ➔ Information objects.
- Maintain formal, precise language throughout.
- Ensure all objects have at least one relationship.
- Task and Views should have at least two relationships.
- Make sure to also create 'Roles', 'Tasks' and 'Views' that are connected to Information objects.
- Make sure you use uuid for the for all objects in the model.

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
      "proposedType": "UserRecord"
    }
  ],
  "relationships": [
    {
      "id": "UUIDv4",
      "name": "approves",
      "typeRef": "Relationship Type uuid",
      "fromobjectRef": "Role uuid",
      "nameFrom": "Manager",
      "toobjectRef": "Task uuid",
      "nameTo": "Task"
    }
  ]    
    `;