"use server"
import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

const modelName = "gpt-4-turbo";

export async function POST(req: Request) {
  console.log("9 Received request:", req.json());
  try {
    const { prompt, domain } = await req.json(); // Extract domain as well
    if (!prompt || typeof prompt !== "string" || !domain || typeof domain !== "string") {
      console.error("Invalid or missing prompt/domain");
      return NextResponse.json({ error: "Invalid or missing prompt/domain" }, { status: 400 });
    }

    // Create final prompt including domain info
    const finalPrompt = `${prompt}\n\nDomain/Topic: ${domain}`;
    console.log("Received prompt:", finalPrompt);

    // Generate response from OpenAI API
    const text = await generateText({
      model: openai(modelName),
      prompt: finalPrompt,
      maxTokens: 150,
    });

    if (!text || typeof text.text !== "string") {
      console.error("Failed to generate a response from OpenAI");
      return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }

    console.log("Generated response:", text.text);
    return NextResponse.json({ prompt: finalPrompt, response: text.text });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}