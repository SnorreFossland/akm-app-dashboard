"use client";
import { useState } from "react";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Loading } from "@/components/loading";
import { ObjectCard } from "@/components/object-card";
import { ObjectSchema } from "@/objectSchema";

export default function SyncPage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [object, setObjType] = useState<z.infer<typeof ObjectSchema>>();

  async function handleSubmit() {
    setPrompt("");
    setIsLoading(true);
    setObjType(undefined);
  
    // console.log("20 Submitting prompt:", prompt);
  
    const res = await fetch("/streaming/api", {
      method: "POST",
      body: JSON.stringify({ prompt: prompt }),
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
      // console.log("Received chunk:", data);
    }
  
    try {
      // console.log("Complete data received:", data); // Log the complete data
      const parsed = JSON.parse(data); // Use JSON.parse to parse the complete JSON
      // console.log("Parsed data:", parsed); // Log the parsed data
      const validatedData = ObjectSchema.parse(parsed);
      setObjType(validatedData);
      // console.log("55 Validation successful:", validatedData);
    } catch (e) {
      if (e instanceof Error) {
        console.error("Validation failed:", e.message);
      } else {
        console.error("Validation failed:", e);
      }
    }
  
    setIsLoading(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>Define object type:</div>  
      <Input
        value={prompt}
        disabled={isLoading}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            handleSubmit();
          }
        }}
        placeholder="What domain do you want explored?"
      />
      {isLoading && <Loading />}
      <ObjectCard domain={object} />
    </div>
  );
}