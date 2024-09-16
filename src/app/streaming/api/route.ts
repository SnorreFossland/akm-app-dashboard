import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

import { ObjTypeSchema } from "@/objTypeSchema";
import { RecipeSchema } from "@/recipeSchema";

const modelName = "gpt-4o-2024-08-06";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const client = new OpenAI();

  const response = await client.chat.completions.create({
    model: modelName,
    messages: [
      {
        role: "user",
        content: `Definition for ${prompt || "Treatment"}`,
      },
    ],
    response_format: zodResponseFormat(ObjTypeSchema, "objTypeSchema"),
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
