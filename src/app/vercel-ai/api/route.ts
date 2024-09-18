import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { ObjectSchema } from "@/objectSchema";

const modelName = "gpt-4o-2024-08-06";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      console.error("Prompt is required");
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    console.log("Received prompt:", prompt);

    const { object } = await generateObject({
      model: openai(modelName, { structuredOutputs: true }),
      schema: ObjectSchema,
      prompt: `Object in domain: ${prompt}`,
    });

    if (!object) {
      console.error("Failed to generate object");
      return NextResponse.json({ error: "Failed to generate object" }, { status: 500 });
    }

    console.log("Generated object:", object);

    return NextResponse.json(object);
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}