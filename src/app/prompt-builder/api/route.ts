"use server"
import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

const modelName = "gpt-4-turbo";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json(); // Parse the JSON body

    if (!prompt || typeof prompt !== "string") {
      console.error("Invalid or missing prompt");
      return NextResponse.json({ error: "Invalid or missing prompt" }, { status: 400 });
    }

    console.log("Received prompt:", prompt);
    // Generate response from OpenAI API
    const text = await generateText({
      model: openai(modelName),
      prompt,
      max_tokens: 150,
    });

    if (!text || typeof text.text !== "string") { // Ensure text.text is a string
      console.error("Failed to generate a response from OpenAI");
      return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }

    console.log("Generated response:", text.text);

    // Return a structured JSON response with the text string
    return NextResponse.json({ prompt, response: text.text }); // Extracted 'text.text'
    // return text;
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}