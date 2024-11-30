import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ObjectSchema } from "@/objectSchema";
import { OntologySchema } from "@/ontologySchema";
import { ModelviewSchema } from "@/modelviewSchema";

// const aiModelName = "gpt-4o-2024-08-06";

const debug = false;

export async function POST(req: Request) {
  console.log('13 route POST');
  const { aiModelName, schemaName, systemPrompt, systemBehaviorGuidelines, userPrompt, userInput, contextItems, contextOntology, contextMetamodel } = await req.json();
  // if (!debug) console.log('15 route userPrompt', userPrompt);
  if (!debug) console.log('15 route \nschemaName', schemaName, '\nsystemPrompt', systemPrompt, '\nsystemBehaviorGuidelines', systemBehaviorGuidelines, '\nuserPrompt', userPrompt, '\nuserInput', userInput, '\ncontextItems', contextItems, '\ncontextOntology', contextOntology, '\ncontextMetamodel', contextMetamodel);
  const client = new OpenAI();

  let schema;
  if (schemaName === 'OntologySchema') {
    schema = OntologySchema;
  } else if (schemaName === 'ObjectSchema') {
    schema = ObjectSchema;
  } else if (schemaName === 'ModelviewSchema') {
    schema = ModelviewSchema;
  } else {
    return new NextResponse("Invalid schema", { status: 400 });
  }

  console.log('27 route schema', schemaName);
  
  const messages = [
    systemPrompt ? { role: 'system', content: systemPrompt } : null,
    systemBehaviorGuidelines ? { role: 'system', content: systemBehaviorGuidelines } : null,
    userPrompt ? { role: 'user', content: userPrompt } : null,
    userInput ? { role: 'user', content: userInput } : null,
    contextItems ? { role: 'assistant', content: contextItems } : null,
    contextOntology ? { role: 'assistant', content: contextOntology } : null,
    contextMetamodel ? { role: 'assistant', content: contextMetamodel } : null,
  ].filter(Boolean);

  console.log('42 route messages', messages);

  const response = await client.chat.completions.create({
    model: aiModelName,
    messages: messages,
    response_format: zodResponseFormat(schema, `${schema.constructor.name.toLowerCase()}Schema`),
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