// no-check
"use server"
import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { deepseek } from "@ai-sdk/deepseek";
import { mistral } from "@ai-sdk/mistral";
import { generateText } from "ai";

// Default model if none is specified
const defaultModel = "deepseek-chat"; // Change this to your preferred default model
// const defaultModel = "gpt-4-turbo";

export async function POST(req: Request) {
  try {
    const { prompt, aiModelName } = await req.json(); // Parse the JSON body

    if (!prompt || typeof prompt !== "string") {
      console.error("Invalid or missing prompt");
      return NextResponse.json({ error: "Invalid or missing prompt" }, { status: 400 });
    }

    console.log("Received prompt:", prompt);
    console.log("Using model:", aiModelName || defaultModel);

    // Choose the model provider based on the specified model name
    let modelProvider;

    if (aiModelName?.includes("deepseek")) {
      // Check for Deepseek API key
      const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
      if (!deepseekApiKey) {
        return NextResponse.json({
          error: "Deepseek API key is missing. Set the DEEPSEEK_API_KEY environment variable."
        }, { status: 500 });
      }
      modelProvider = deepseek(aiModelName, { apiKey: deepseekApiKey } as any);
    } else if (aiModelName?.includes("mistral")) {
      // Check for Mistral API key
      const mistralApiKey = process.env.MISTRAL_API_KEY;
      if (!mistralApiKey) {
        return NextResponse.json({
          error: "Mistral API key is missing. Set the MISTRAL_API_KEY environment variable."
        }, { status: 500 });
      }
      modelProvider = mistral(aiModelName, { apiKey: mistralApiKey } as any);
    } else {
      // Check for OpenAI API key
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return NextResponse.json({
          error: "OpenAI API key is missing. Set the OPENAI_API_KEY environment variable."
        }, { status: 500 });
      }
      modelProvider = openai(aiModelName || defaultModel, { apiKey: openaiApiKey } as any);
    }

    try {
      // Generate response from the selected API
      const text = await generateText({
        model: modelProvider, // Type assertion to bypass incompatible types
        prompt,
      });

      if (!text || typeof text.text !== "string") {
        console.error("Failed to generate a response");
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
      }

      console.log("Generated response:", text.text);

      // Return a structured JSON response with the text string
      return NextResponse.json({ prompt, response: text.text });
    } catch (apiError) {
      // Handle specific API errors
      console.error("API call error:", apiError);

      // Check for insufficient balance error from Deepseek
      if (
        typeof apiError === 'object' && 
        apiError !== null && 
        'responseBody' in apiError && 
        typeof apiError.responseBody === 'string' && 
        apiError.responseBody.includes("Insufficient Balance")
      ) {
        // Handle insufficient balance error
        return NextResponse.json({
          error: "Insufficient balance in your Deepseek account"
        }, { status: 402 });
      }
      
      // Handle other API errors
      return NextResponse.json({
        error: `API error: ${apiError instanceof Error ? apiError.message : "Unknown error occurred"}`
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}