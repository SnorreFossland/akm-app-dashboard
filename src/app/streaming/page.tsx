"use client";
import { useState, useEffect } from "react";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Loading } from "@/components/loading";
import { ObjectCard } from "@/components/object-card";
import { ObjectSchema } from "@/objectSchema";

export default function SyncPage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [object, setObjType] = useState<z.infer<typeof ObjectSchema>>();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SESSION_STORAGE_DATA') {
        sessionStorage.setItem('memorystate', event.data.data);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  async function handleSubmit() {
    setPrompt("");
    setIsLoading(true);
    setObjType(undefined);

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
    }

    try {
      const parsed = JSON.parse(data);
      const validatedData = ObjectSchema.parse(parsed);
      setObjType(validatedData);
    } catch (e) {
      if (e instanceof Error) {
        console.error("Validation failed:", e.message);
      } else {
        console.error("Validation failed:", e);
      }
    }

    setIsLoading(false);
  }

  const handleCopy = () => {
    if (object) {
      const jsonOutput = JSON.stringify(object, null, 2);
      navigator.clipboard.writeText(jsonOutput).then(() => {
        console.log('JSON copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy JSON:', err);
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-gray-800">
      <div className="mx-auto">Explore a Domain:</div>

      <div className="flex items-center mx-2 bg-gray-700">
        <Input
          className="flex-grow bg-gray-700 mx-auto mx-2"
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
        {object && (
          <button onClick={handleCopy} className="m-auto bg-blue-500 text-white px-4 py-2 rounded">
            Copy JSON
          </button>
        )}
      </div>

      {isLoading && <Loading />}
      <ObjectCard domain={object} />
    </div>
  );
}