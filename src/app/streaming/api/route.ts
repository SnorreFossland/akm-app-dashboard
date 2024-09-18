import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

import { ObjectSchema } from "@/objectSchema";

const modelName = "gpt-4o-2024-08-06";

export async function POST(req: Request) {
  const { prompt } = await req.json();
  console.log("Received prompt:", prompt);

  const client = new OpenAI();

  const context = `
Context:
- The domain is related to ${prompt}.
- The user is looking for a detailed exploration of the domain concepts.
- Ensure that the Information objects are clearly defined and related to the domain.
- Provide examples where necessary to illustrate the concepts.
- The output should be structured and easy to understand.
- Use bullet points or lists to organize the information where appropriate.
`;

  const systemPrompt: OpenAI.ChatCompletionMessageParam = {
    role: "system",
    content: `You are a helpful assistant and a concept modelling expert that can define the domain concepts as Information objects
with related Roles, Tasks, Views about the domain specified by the user. 
Roles are process roles of typeName: Role.
Tasks are the actions that Roles can perform in the domain of typeName: Task.
Views are the ways to visualize the Information of typeName: View.
Information should be a one word noun.
Task should be a verb.
You can also provide detailed and accurate answers to the user's queries. 
Provide detailed and accurate answers to the user's queries.
${context}`
  };

  const response = await client.chat.completions.create({
    model: modelName,
    messages: [
      systemPrompt,
      {
        role: "user",
        content: `Domain to explore is ${prompt}`,
      },
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

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain",
      "Transfer-Encoding": "chunked",
    },
  });
}