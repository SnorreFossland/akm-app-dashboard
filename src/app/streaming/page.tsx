"use client";
import { useState } from "react";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { ObjTypeCard } from "@/components/recipe-card";
import { Loading } from "@/components/loading";
import { ObjTypeSchema } from "@/objTypeSchema";

export default function SyncPage() {
  const [prompt, setPrompt] = useState("chocolate brownies");
  const [isLoading, setIsLoading] = useState(false);
  const [objType, setObjType] = useState<z.infer<typeof ObjTypeSchema>>();

  async function handleSubmit() {
    setPrompt("");
    setIsLoading(true);
    setObjType(undefined);
  
    console.log("Submitting prompt: Type Definition");
  
    const res = await fetch("/streaming/api", {
      method: "POST",
      body: JSON.stringify({ prompt: "Type Definition" }),
    });
  
    if (!res.ok) {
      console.error("Failed to fetch:", res.statusText);
      setIsLoading(false);
      return;
    }
  
    const reader = res.body?.getReader();
    if (!reader) {
      console.error("No reader available");
      setIsLoading(false);
      return;
    }
  
    const decoder = new TextDecoder();
    let data = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      data += decoder.decode(value, { stream: true });
      console.log("Received chunk:", data);
    }
  
    try {
      console.log("Complete data received:", data); // Log the complete data
      const parsed = JSON.parse(data); // Use JSON.parse to parse the complete JSON
      console.log("Parsed data:", parsed); // Log the parsed data
      const validatedData = ObjTypeSchema.parse(parsed);
      setObjType(validatedData);
      console.log("Validation successful:", validatedData);
    } catch (e) {
      console.error("Validation failed:", e.errors);
    }
  
    setIsLoading(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>object type</div>  
      <Input
        value={prompt}
        disabled={isLoading}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            handleSubmit();
          }
        }}
        placeholder="What type do you want defined?"
      />
      {isLoading && <Loading />}
      <ObjTypeCard objType={objType} />
    </div>
  );
}