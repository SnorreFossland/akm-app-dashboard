export const constraints = `
### **Constraints**

- **Language Usage:**
  - Do **not** use the word "domain" in descriptions.
  - Avoid using the type name ('typeName') in descriptions.
  - Do **not** repeat the object's name in its description.

- **Attributes and Types:**
  - Do **not** add the 'proposedType' attribute to Views, Tasks, or Roles.
  - Ensure the 'proposedType' for Information objects is accurately derived from ontology terms.

- **Object and Relationship Creation:**
  - Do **not** create duplicate objects.
  - Avoid creating relationships that already exist.
  - Establish relationships supported by the metamodel.
`;