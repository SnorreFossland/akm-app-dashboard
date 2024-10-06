import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ObjectSchema } from "@/objectSchema";
import { OntologySchema } from "@/ontologySchema";

const modelName = "gpt-4o-2024-08-06";

export async function POST(req: Request) {
  const { step, prompt, contextPrompt, ontologyPrompt, metamodelPrompt, systemPrompt } = await req.json();
  const client = new OpenAI();

  if (step === 1) {
    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${prompt}\n\n${contextPrompt}\n\n${ontologyPrompt}` },
      ],
      response_format: zodResponseFormat(OntologySchema, "ontologySchema"),
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
  } else if (step === 2) {
    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${prompt}\n\n${ontologyPrompt}\n\n${metamodelPrompt}` },
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
  } else {
    return new NextResponse("Invalid step", { status: 400 });
  }
}