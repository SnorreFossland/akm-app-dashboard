export const ContextPrompt = `
## **Context:**
    - The user has provided a domain description.
    - Analyze the domain and identify key concepts and terms and use term name from the ontology list if possible.
    - Create a description of the domain that gives an summary of the content, do not include/repeat the word "domain" in the description.
    - Do not create any terms that already is Information objects in Existing Context.
  `;
  
  // ${existingContext} is added to the prompt to show the existing context in the system