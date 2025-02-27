import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ObjectSchema } from "@/objectSchema";
import { OntologySchema } from "@/ontologySchema";
import { ModelviewSchema } from "@/modelviewSchema";

const aiModelName = "gpt-4o-2024-08-06";

const debug = false;

export async function POST(req: Request) {
  const { schemaName, systemPrompt, systemBehaviorGuidelines, userPrompt, userInput, contextItems, contextOntology, contextMetamodel } = await req.json();
  if (debug) console.log('15 route \nschemaName', schemaName, '\nsystemPrompt', systemPrompt, '\nsystemBehaviorGuidelines', systemBehaviorGuidelines, '\nuserPrompt', userPrompt, '\nuserInput', userInput, '\ncontextItems', contextItems, '\ncontextOntology', contextOntology, '\ncontextMetamodel', contextMetamodel);
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

  const response = await client.chat.completions.create({
    model: aiModelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: systemBehaviorGuidelines },
      { role: 'user', content: userPrompt },
      { role: 'user', content: userInput },
      { role: 'assistant', content: contextItems },
      { role: 'assistant', content: contextOntology },
      { role: 'assistant', content: contextMetamodel },
    ],
    response_format: zodResponseFormat(schema, `${schema.constructor.name.toLowerCase()}Schema`),
    stream: true,
    temperature: 0.1,
  });

  const structuredOutput: string[] = [];
  let chatOutput = "";

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || "";
        const role = chunk.choices[0]?.delta?.role || "assistant";
        if (role === 'assistant') {
          structuredOutput.push(content);
        } else {
          chatOutput += content;
        }
        controller.enqueue(new TextEncoder().encode(content));
      }
      controller.close();
    },
  });

  const combinedOutput = {
    structuredOutput: structuredOutput.join(''),
    chatOutput,
  };

  console.log('70 route combinedOutput', combinedOutput);

  return new NextResponse(JSON.stringify(combinedOutput), { headers: { 'Content-Type': 'application/json' } });
}