
import { NextResponse } from "next/server";
import { generateModel } from "@/utils/modelGenerator"; // Assume this function generates the model

export async function POST(req: Request) {
  try {
    const { aiModelName, schemaName, systemPrompt, systemBehaviorGuidelines, userPrompt, userInput, contextItems, contextOntology, contextMetamodel } = await req.json();

    if (!aiModelName || !schemaName) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Generate the model data
    const modelData = await generateModel({
      aiModelName,
      schemaName,
      systemPrompt,
      systemBehaviorGuidelines,
      userPrompt,
      userInput,
      contextItems,
      contextOntology,
      contextMetamodel,
    });

    // Validate the generated data
    if (!modelData || typeof modelData !== "object") {
      return NextResponse.json({ error: "Invalid model data generated." }, { status: 500 });
    }

    // Ensure all string fields are properly escaped
    const safeModelData = JSON.parse(JSON.stringify(modelData));

    return NextResponse.json(safeModelData, { status: 200 });
  } catch (error) {
    console.error("Error in /api/genmodel:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
