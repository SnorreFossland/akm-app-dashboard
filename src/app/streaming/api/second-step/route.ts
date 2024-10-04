import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ObjectSchema } from "@/objectSchema";
import { metamodel } from '@/metamodel/metamodel';
import { v4 as uuidv4 } from 'uuid';

const modelName = "gpt-4o-2024-08-06";

export async function POST(req: Request) {
  const { terms, relations } = await req.json();
  const client = new OpenAI();

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

  const promptWithContext = (prompt === "")
    ? `

  ${context}

`
    : `
  User Prompt:

  ${prompt}

  ${context}

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
      { role: 'user', content: JSON.stringify({ infoobjects, relationships }) },
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