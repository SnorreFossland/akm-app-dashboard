import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ObjectSchema } from "@/objectSchema";
import { OntologySchema } from "@/ontologySchema";
import { ModelviewSchema } from "@/modelviewSchema";

const modelName = "gpt-4o-2024-08-06";

export async function POST(req: Request) {
  const { step, prompt, systemPrompt, contextPrompt, ontologyPrompt, metamodelPrompt } = await req.json();
  const client = new OpenAI();
  console.log('12 route', step, prompt, systemPrompt, contextPrompt, ontologyPrompt, metamodelPrompt);
  if (step === 1) {
    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
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
    // console.log('37 route', step, prompt, systemPrompt, ontologyPrompt, metamodelPrompt);
    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
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
  } else if (step === 3) {
    console.log('62 route', step, prompt, systemPrompt, contextPrompt, ontologyPrompt);
    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: zodResponseFormat(ModelviewSchema, "modelviewSchema"),
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