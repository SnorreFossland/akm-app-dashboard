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
      relships: [],
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
            submit(prompt);
            setPrompt("");
          }
        }}
        placeholder="What Domain do you want?"
      />
      {isLoading && <Loading />}
      {object && prompt && <ObjectCard model={{
        ...object,
        id: "generated-id",
        metamodelRef: "default-metamodel",
        modelviews: [],
        name: object.name || "Untitled",
        description: object.description || "",
        // Ensure objects is always an array with required properties
        objects: (object.objects || []).map(obj => ({
          id: obj?.id || "generated-obj-id",
          name: obj?.name || "",
          description: obj?.description || "",
          proposedType: obj?.proposedType || "",
          typeRef: obj?.typeRef || "",
          typeName: obj?.typeName || "",
          category: "default" // Add the missing required category field
        })),
        // If relships is also required in the Model type
        relships: (object.relships || []).map(rel => ({
          id: rel?.id || "generated-rel-id",
          name: rel?.name || "",
          typeRef: rel?.typeRef || "",
          fromobjectRef: rel?.fromobjectRef || "",
          nameFrom: rel?.nameFrom || "",
          toobjectRef: rel?.toobjectRef || "",
          nameTo: rel?.nameTo || ""
        }))
      }} />}
    </div>
  );
}