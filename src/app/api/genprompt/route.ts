"use server"
import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { deepseek } from "@ai-sdk/deepseek";
import { mistral } from "@ai-sdk/mistral";
import { generateText } from "ai";

// Default model if none is specified
const defaultModel = "mistral-medium";
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
      modelProvider = deepseek(aiModelName, { apiKey: deepseekApiKey });
    } else if (aiModelName?.includes("mistral")) {
      // Check for Mistral API key
      const mistralApiKey = process.env.MISTRAL_API_KEY;
      if (!mistralApiKey) {
        return NextResponse.json({
          error: "Mistral API key is missing. Set the MISTRAL_API_KEY environment variable."
        }, { status: 500 });
      }
      modelProvider = mistral(aiModelName, { apiKey: mistralApiKey });
    } else {
      // Check for OpenAI API key
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return NextResponse.json({
          error: "OpenAI API key is missing. Set the OPENAI_API_KEY environment variable."
        }, { status: 500 });
      }
      modelProvider = openai(aiModelName || defaultModel, { apiKey: openaiApiKey });
    }

    try {
      // Generate response from the selected API
      const text = await generateText({
        model: modelProvider as any, // Type assertion to bypass incompatible types
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
      if (apiError.responseBody && apiError.responseBody.includes("Insufficient Balance")) {
        return NextResponse.json({
          error: "Your Deepseek account has insufficient balance. Please add funds to your account or switch to another model."
        }, { status: 402 });
      }

      // Handle other API errors
      return NextResponse.json({
        error: `API error: ${apiError.message || "Unknown error occurred"}`
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}