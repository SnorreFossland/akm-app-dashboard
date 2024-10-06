import { metamodel } from '@/metamodel/metamodel';;

export const metamodelPrompt = `
  # **Metamodel:**
  - Object Types:
  ${metamodel.objecttypes.map((obj) => `- id: ${obj.id}, name: ${obj.name}`).join('\n')}
  
  - Relationship Types:
  ${metamodel.relshiptypes.map((rel) => `- id: ${rel.id}, name: ${rel.name}, from ${rel.fromobjtypeRef}, to ${rel.toobjtypeRef}`).join('\n')}

## **Instructions**

You are tasked with first creating **Information objects** from the list of Ontology Terms and establishing relationships among them, adhering to the provided metamodel and ontology.

After creating Information objects with relationships, **create the related Tasks, Views, and Roles** based on domain analysis and logical associations with the Information objects and their relationships.

Your goal is to expand the knowledge base with at least **10 new Information objects and some Views, Tasks and Roles** with corresponding set of relationships, ensuring all objects are interconnected.

### **Object Creation**

- First **Create Information Objects:**
  - Create based on ontology terms.
  - Include an attribute 'proposedType' derived from the ontology.
  - Provide detailed descriptions without repeating the object's name.
  - Use ontology terms for 'name' and 'proposedType'.
  - Then Establish 'refersTo' relationships among Information objects.

- Next add **Tasks, Views, and Roles objects** based on the metamodel:
  - Create based on the actions, processes, and responsibilities identified during domain analysis of the Prompt: ${prompt}.
  - Do **not** add the 'proposedType' attribute.
  - Ensure names are appropriate (e.g., Views should not include the word "view" in the name).
  - Establish relationships between Tasks, Views, and Roles with Information objects.
  1. **Define Tasks:**
    - Identify actions or processes interacting with Information objects.
    - Create Tasks with descriptive names including a verb.
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
    - Provide detailed descriptions without repeating the role's name.
    - Establish 'performs' or 'manages' relationships from Roles to Tasks.

  4. **Finalization:**
    - Ensure all objects are interconnected, forming a cohesive knowledge structure.
    - Makd sure that Tasks are connected to at least one Role and one View.
    - Confirm that View are connected to Information objects.
    - Verify that all specified relationships are established according to the metamodel.
  `;