import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { OntologySchema } from "@/objectSchema";

import { v4 as uuidv4 } from 'uuid';

const modelName = "gpt-4o-2024-08-06";

export async function POST(req: Request) {
  const { prompt, existingContext, ontology } = await req.json();
  const client = new OpenAI();

  let terms: { name: string; description: string }[] = [];
  let relations: { name : string; nameFrom: string; nameTo: string }[] = [];
  console.log('16 ontology:', ontology);
  if (ontology !== null || typeof ontology === 'object') {
    if (Array.isArray(ontology)) {
      terms = ontology;
      relations = ontology;
      console.log('terms:', terms, relations);
    } else {
      console.error('ontology is not an array:', ontology);
    }
  } else {
    console.error('ontologyObjects is not an object or is null:');
  }

  const systemPrompt = `
You are a helpful assistant and metamodel expert helping to identify Concepts and Terms with relations within the domain.

**Your Role:**
- Ensure all terms have at least one relation.
- Create relations between new and existing objects.
- Create a informative description for each object without repeating the name in the description .
- Provide descriptions for objects missing one.
- Create relations between objects based on the ontology.


**Examples:**
{
  "terms": [
    {
      "name": "Object Name",
      "description": "Detailed description without repeating the name.",
    }
  ],
  "relships": [
    {
      "name": "Relationship Name",
      "fromName": "name of the from object",
      "toName": "name of the target object",
  ]
}
`;

  const context = `
**Context:**
- The user has provided a domain description.
- Analyze the domain and identify key concepts and terms and use the ontology list if possible.
- Create a description of the domain that gives an summary of the content, do not include/repeat the word "domain" in the description.

- Create relations between terms based on the ontology.
Ontology:
Terms:
  ${JSON.stringify(terms, null, 2)}
Relations:
  ${JSON.stringify(relations, null, 2)}
Check the ontology for matching word to use as Term name and use the ontology name if it can be used as the term name.
If the user prompt contains a term word, make sure you include that as a Term.
Do not create already existing objects.

Existing objects:
  ${existingContext}
`;
  const promptWithContext = `
User Prompt:̭
  ${prompt}

  ${context}
`
  const response = await client.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: promptWithContext },
    ],
    response_format: zodResponseFormat(OntologySchema, "objectSchema"),
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