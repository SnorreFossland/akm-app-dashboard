import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ObjectSchema } from "@/objectSchema";

import { metamodel } from '@/metamodel/metamodel';

const modelName = "gpt-4o-2024-08-06";

export async function POST(req: Request) {
  const { prompt, existingContext } = await req.json();
  console.log("Received prompt:", prompt);
  console.log("Received existingContext:", existingContext);

  const client = new OpenAI();

  const context = `
**Context:**

- Explore the domain information concepts as Information objects kwith related Roles, Tasks, Views about the domain specified by the user.

    New objects:
    Suggest at least 10 new objects and their relationships.
    New objects may have relationship to or from existing objects.
    Make sure all objects have at least one relationship.
    - First evaluate the domain and create the information concepts and terms used within the domain.
    - Then create Information objects that represent the concepts/terms.
    - Then create Tasks that works on the Information objects is named as verb..
    - Then create Roles that performs the Tasks.
    - Then create Views that have Inputs and Outputs to the Information objects, the relationship has direction from View to Information.
    - hasInput and hasOutput relationships are from View to Information.
    - Concepts are created as Information objects (typeName: Information) and have the proposedType filled in as a representing the Information name in one word noun.
    - Roles process Role objects (typeName: Role).
    - Tasks should be Task objects (typeName: Task).
    - Views should be View objects (typeName: View) and must have a applies relationship from a Task.


Create a description of the domain that gives an summary of the content, exclude the word "domain" in the description.
  `;

  const promptWithContext = `

    ${context}

    Existing objects:

    ${existingContext}

    Don't create existing objects, but relationships can be created to or from existing objects and new objects.
    If existing objects description field is empty, add your best suggestion of a description.
    Use existing id for existing objects and generate new id for new objects.
    Create missing relationships also between existing objects.
    Make sure Views are related to Information and from Tasks.
    Make sure Tasks have a relationship from Roles and to Views.
    Make sure all objects have relationships.
`;

  const systemPrompt = `
You are a concept modeling expert helping to explore the domain of "${prompt}".

**Your Role:**
- Analyze the domain and identify key concepts.
- Create new objects and relationships based on the metamodel.
- Use existing objects and relationships as context.

**Metamodel:**
The metamodel consists objecttypes and relationshiptypes

- **Object Types:**
${metamodel.objecttypes.map((obj) => `- id: ${obj.id} name: ${obj.name}`).join('\n')}
  
- **Relationship Types:**
${metamodel.relshiptypes.map((rel) => `- ${rel.id}: from ${rel.nameFrom} to ${rel.nameTo}`).join('\n')}

**Instructions:**
objects:
- Generate new UUIDs for new objects.
- Create Information objects that represent the concepts/terms.
- Then create Tasks named as verb, that reference the Information.
- Then create Roles as process roles that performs the Tasks.
- Then create Views  that have Inputs and Outputs to the Information properties.
- Information objects (typeName: Information) and have the proposedType filled in as a representing the proposed type. If several word use camelcase.
- Roles process Role objects (typeName: Role).
- Tasks should be Task objects (typeName: Task).
- Views should be View objects (typeName: View) and must have a applies relationship from a Task.
- Do not recreate existing objects

relationships:
- Relationships are between objects using the of the objects id as fromobjtypeRef and toobjtypeRef.
- Create relatinships between new objects and existing objects.
- Ensure all objects have relationships.
- Information objects should have relationships includes to Properties.
- Tasks should have relationship applies from Roles and to Views
- Views should have relationships refersTo from Tasks to Information.
- Views should have relationships hasInput and hasOutput to Properties.

- Provide descriptions for objects missing one.
- Format your response as JSON with "objects" and "relships" arrays.

**Examples:**

- **Object:**
objects: [
  {
    "id": "9d0de1ea-2aa4-4ec7-8915-5e20eef95c3d",
    "name": "Bike Customer",
    "proposedType": "Customer",
    "typeRef": "058cbb1b-018e-4959-2a33-a27889543209",
    "typeName": "Information",
  }
]
- **Relationship:**
relships: [
  {
    "fromobjectRef": "40686084-128e-44ac-a88f-185a0c9163cd",
    "name": "performs",
    "toobjectRef": "f2616435-c36b-4e33-3da6-fd4bfcc5033b",
    "typeRef": "5607bf3b-23d3-4141-f95b-06ff806f86f2",
  },
    ]
`;


  const response = await client.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: promptWithContext },
    ],
    response_format: zodResponseFormat(ObjectSchema, "objectSchema"),
    stream: true,
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