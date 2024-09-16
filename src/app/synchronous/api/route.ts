import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

import { RecipeSchema } from "@/recipeSchema";

const modelName = "gpt-4o-2024-08-06";

const apiKey = process.env.OPENAI_API_KEY;
const client = new OpenAI({ apiKey });

export async function POST(req: Request) {
  if (!apiKey) {
    console.error("API key is missing");
    return NextResponse.error();
  }
  const { prompt } = await req.json();

  const response = await client.chat.completions.create({
    model: modelName,
    messages: [
      {
        role: "user",
        content: `Recipe for ${prompt || "chocolate brownies"}`,
      },
    ],
    response_format: zodResponseFormat(RecipeSchema, "recipeSchema"),
  });

  return NextResponse.json(
    JSON.parse(response.choices[0].message.content || "")
  );
}
