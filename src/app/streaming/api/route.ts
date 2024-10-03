import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ObjectSchema } from "@/objectSchema";

import { metamodel } from '@/metamodel/metamodel';


// const modelName = "gpt-4o";
const modelName = "gpt-4o-2024-08-06";

export async function POST(req: Request) {
  const { prompt, existingContext, ontology } = await req.json();
  // console.log("13 Received existingContext:", existingContext);
  // console.log("14 Received ontology:", ontology);
// 
  const client = new OpenAI();
  
  let ontologyObjectTypes: { id: string; name: string; osduType: string; proposedType: string }[] = [];
  let ontologyRelationshipTypes: { id: string; from: string; to: string }[] = [];
  let ontologyObjectTypeNames: string[] = [];

  // if (ontology) {
  //   try {
  //     const response = await fetch(ontology);
  //     if (!response.ok) {
  //       throw new Error(`Failed to fetch ontology from URL: ${response.statusText}`);
  //     }
  //     ontologyData = await response.json();
  //     console.log('22 ontologyData:', ontologyData);
  //   } catch (error) {
  //     console.error('Failed to fetch or parse ontologyData:', error);
  //     return new NextResponse('Invalid ontologyData JSON', { status: 400 });
  //   }
  // } else {
  //   console.error('ontology is not provided or is null:');
  // }

  // console.log('36 ontology:', ontology.slice(0, 4));

  if (ontology !== null || typeof ontology === 'object') {
    if (Array.isArray(ontology)) {
      // console.log('38 ontology:', ontology.slice(0, 4));
    } else {
      console.error('ontology is not an array:', ontology);
    }
    ontologyObjectTypes = ontology
    // Reduce the ontology array to get the latest version of each type
    // ontologyObjectTypes = Object.values(
    //   ontology.reduce((acc: any, item: any) => {
    //     const name = item.entity_name;
    //     const version = name.split(':')[1];
    //     // const proposedType = name.split(':')[0];

    //     if (!acc[name] || acc[name].version < version) {
    //       acc[name] = {
    //         // id: item.kind,
    //         name: name,
    //         // group: item.group,
    //         // proposedType: proposedType,
    //         version: version
    //       };
    //     }
    //     return acc;
    //   }, {})
    // );

    ontologyRelationshipTypes = ontology
    // ontologyRelationshipTypes = ontology
    //   .flatMap((item: any) =>
    //     item.relations.map((rel: any) => ({
    //       id: item.id + rel.name,
    //       from: item.id,
    //       to: rel.targetGroup + '-' + rel.targetEntity
    //     }))
    //   );
    
    ontologyObjectTypeNames = Array.from(
      new Set(ontologyObjectTypes.map((item: any) => item.entity_name))
    );
    
    console.log('82 ontologyObjectTypes:', ontologyObjectTypes.slice(0,1));
    // console.log('82 'ontologyRelationships:', ontologyRelationshipTypes.slice(0,4));
    console.log('83 ontologyObjectTypeNames:', ontologyObjectTypeNames.slice(0, 9));

  } else {
    console.error('ontologyObjects is not an object or is null:');
  }

  const context = `
**Context:**
- The user has provided a domain description.
- Analyze the domain and identify key concepts and terms and use the ontology list if possible.
- These concepts as Information objects representing the product data structure.
- Create a description of the domain that gives an summary of the content, do not include/repeat the word "domain" in the description.
- Create relationships between Information, Role, Task and View objects
Ontology:
  ${JSON.stringify(ontologyObjectTypeNames, null, 2)}
Check the ontology for matching word to use as the proposedType of the Information objects and use the ontology name if it can be used as the typename.
If the user prompt contains an object type word, make sure you include that as an Information object.
Existing objects:
  ${existingContext}
`;

  const metamodelPrompt = `
**Metamodel:**
- Object Types:
${metamodel.objecttypes.map((obj) => `- id: ${obj.id}, name: ${obj.name}`).join('\n')}

- Relationship Types:
${metamodel.relshiptypes.map((rel) => `- id: ${rel.id}, name: ${rel.name}, from ${rel.fromobjtypeRef}, to ${rel.toobjtypeRef}`).join('\n')}

**Instructions:**
- Analyze the domain and identify key concepts/terms.
- Create new objects based on these concepts/terms and the existing context and use the ontologyObjectTypes names if possible.
- Create at least 20 new objects and more relationships.
- Create relationships between objects based on the metamodel.
- Ensure all objects have relationships.
- Information objects have an attribute "proposedType" representing the proposed type.
- Do not create new relationships between objects that already has relationship.
- Relationships are between objects using the of the objects id as fromobjtypeRef and toobjtypeRef.
- Use the relshipType name as the name of the relationship.
- Use uuidv4 for the id of the objects and relationship.
- Make sure you create missing relationships between existing objects.
- Create also relationships between new objects and existing objects.

**Steps:**
- Start by creating Information objects based on key information concepts from the domain and coordinate it to the ontology.
  The Information objects represent the product data structure and data record.
  Use ontology name as name and proposedType for new Information objects if possible.
  Create a detailed description for each object without repeating the name in the description.
  Create the relationships between the Information objects.
  Information objects refersTo Information objects.
  Check with the ontology to find proposedType for new Information objects.
- Then, create Views that represent how information from the product record is presented. Do not include the word view in the name.
  Create relationship Views refersTo Information.
- Next, define Tasks that apply these views, use names including a verb. Description should not including the word task Task can be detailed by triggering new tasks.
  Task triggers Task.
- Next, assign Roles that perform or manage these tasks.
  Roles performs/manages Tasks.
- Finally, make sure all objects have relationships and that all Information objects are connected to a View.
  Information objects refersTo Information objects.
  Views refersTo Information.
  Tasks triggers Tasks.
  Roles performs/manages Tasks.

**Constraints:**
- Do not use the word "domain" in the description of the domain.
- Do not use the word of the typeName in the description of the objects.
- Do not use the typeName in the name, proposedType or description of the objects.
- Do not add proposedType to Views, Tasks or Roles.
- Do not create already existing objects
- Do not create new relationships between objects that already have a relationship.
- Do not create relationships that are not based on the metamodel.
- Do not repeat the name of the object in the description.

Make sure to generate relationships from Role to Task to Views to Information objects.
Make sure to create relationships between objects based on the metamodel.
Make sure not to create relationships that already exists or previously created.
Make sure to no proposedType for Views, Tasks or Roles.
Make sure the proposedType for Information objects is named from the ontology.


**Styling:**
-Use formal language and avoid colloquialisms.

**Goals:**
- Ensure all objects have at least one relationship.
- Create relationships between new and existing objects.
- Create relationships between objects based on the metamodel.
- Create a informative description for each object without repeating the name in the description .
- Provide descriptions for objects missing one.

**Examples:**
{
  "objects": [
    {
      "id": "id as uuidv4",
      "name": "Object Name",
      "description": "Detailed description without repeating the name.",
      "proposedType": "CamelCaseType and only for Information objects",
      "typeRef": "Object Type id",
      "typeName": "Object Type Name"
    }
  ],
  "relships": [
    {
      "id": "id as uuidv4",
      "name": "Relationship Name",
      "typeRef": "Relationship Type id"
      "fromobjectRef": "id of the from object",
      "toobjectRef": "id of the target object",
    }
  ]
}
`;

// If the prompt is empty, provide a default prompt
  const promptWithContext = (prompt === "") 
  ? `

  ${context}

  ${metamodelPrompt}
` 
  : `
  User Prompt:

  ${prompt}

  ${context}

  ${metamodelPrompt} 

`;

  const systemPrompt = `
You are a helpful assistant and Active Knowledge modeling expert helping to explore the knowledge concepts/terms of the domain provided in the user prompt: "${prompt}".

**Your Role:**
- Analyze the domain and identify key concepts and terms and the relationships between them.
- 
- Analyze the concepts and suggest new objects and relationships based on the metamodel

Create relationships between objects based on the metamodel.
Make sure to use the relationship type name as the name of the relationship.
Always generate UUID as id for objects and relationships.
Make sure to not create relationships that already exist or previously created.
Make sure to create missing relationships between existing objects.
Make sure to create relationships between new objects and existing objects.
Don't create existing objects, but relationships can be created to or from existing objects and new objects.
If existing objects description field is empty, add your best suggestion of a description.

`;

  const response = await client.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: promptWithContext },
    ],
    response_format: zodResponseFormat(ObjectSchema, "objectSchema"),
    stream: true,
    temperature: 0.1, // Set the temperature here
  });

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || "";
        controller.enqueue(new TextEncoder().encode(content));
      }
      controller.close();
    },
  });

  return new NextResponse(stream);
}