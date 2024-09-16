"use client";
import { useState } from "react";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { RecipeCard } from "@/components/recipe-card";

import { Loading } from "@/components/loading";
import { RecipeSchema } from "@/recipeSchema";

export default function SyncPage() {
  const [prompt, setPrompt] = useState("chocolate brownies");
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState<z.infer<typeof RecipeSchema>>();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setPrompt("");
    setIsLoading(true);
    setRecipe(undefined);
    setError(null);

    try {
      const response = await fetch("/synchronous/api", {
        method: "POST",
        body: JSON.stringify({ prompt: "chocolate brownies" }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setRecipe(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        value={prompt}
        disabled={isLoading}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            handleSubmit();
          }
        }}
      />
      {isLoading && <Loading />}
      {error && <div className="error">{error}</div>}
      {recipe && <RecipeCard recipe={recipe} />}
    </div>
  );
}