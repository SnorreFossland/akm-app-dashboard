"use client";

import { useState } from "react";
import  { Textarea } from "@/components/ui/textarea";
import { systemPrompt, systemPromptTest } from "@/app/prompt-builder/prompts";

export default function VercelAiPage() {
  const [prompt, setPrompt] = useState(systemPrompt);

  const [chatOutput, setChatOutput] = useState<string>("");


  const handleSubmit = async () => {
    try {
      const response = await fetch("/prompt-builder/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setChatOutput(data.response); // Ensure 'data.response' is a string
      setPrompt("");
    } catch (error) {
      console.error('Submit Error:', error);
      setChatOutput("An error occurred while submitting the prompt.");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-4xl mx-auto">
      <button onClick={handleSubmit} className="btn">
        Submit
      </button>
      <h1 className="text-2xl font-bold">AKM Concept Definer</h1>
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
        handleSubmit();
          }
        }}
        rows={10} // Added this line to make the textarea more lines
        placeholder="What Domain do you want?"
      />

      {chatOutput && <div className="chat-output">{chatOutput}</div>}
    </div>
  );
}