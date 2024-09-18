"use client";

import { useState } from "react";
import { experimental_useObject as useObject } from "ai/react";
import { Input } from "@/components/ui/input";
import { ObjectCard } from "@/components/object-card";

import { ObjectSchema } from "@/objectSchema";
import { Loading } from "@/components/loading";

export default function VercelAiPage() {
  const [prompt, setPrompt] = useState("Bike production");
  const { object, submit, isLoading } = useObject({
    schema: ObjectSchema,
    api: "/vercel-ai/api",
    initialValue: {
      name: "",
      objects: [],
      relationships: [],
    },
  });


  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">AKM Concept definer</h1>
      <Input
        value={prompt}
        disabled={isLoading}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            submit( prompt );
            setPrompt("");
          }
        }}
        placeholder="What Domain do you want?"
      />
      {isLoading && <Loading />}
      {object && prompt && <ObjectCard domain={object as any} />}
    </div>
  );
}