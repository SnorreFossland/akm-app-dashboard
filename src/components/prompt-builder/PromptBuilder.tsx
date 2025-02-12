'use client';
import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { systemPrompt } from '@/app/prompt-builder/prompts';
// Use a revised system prompt that does not ask for the topic.
const revisedSystemPrompt = "Please create the best ChatGPT prompt based on the provided domain.";

export default function PromptBuilder() {
    // Updated default prompt text
    const [prompt, setPrompt] = useState({ text: revisedSystemPrompt, domain: "" });
    const [result, setResult] = useState<string>("");

    const handleBuildPrompt = async () => {
        console.log("14 Building prompt...", prompt);
        // Validate that a topic is provided before generating a prompt.
        if (!prompt.domain.trim()) {
            alert("Please enter a domain/topic before generating a new prompt.");
            return;
        }
        try {
            const response = await fetch("/api/genprompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: prompt.text, domain: prompt.domain }),
            });
            if (!response.ok) throw new Error(`Error: ${response.statusText}`);
            const data = await response.json();
            setResult(data.response);
        } catch (error) {
            console.error("Error building prompt:", error);
            setResult("Failed to build prompt.");
        }
    };

    return (
        <div className="flex h-[calc(100vh-5rem)] w-full">
            <div className="border-solid rounded border-4 border-green-700 w-1/4">
                <h2 className="text-xl font-bold mb-2">Prompt Builder</h2>
                {/* Revised prompt text area */}
                <Textarea
                    value={prompt.text}
                    onChange={(e) => setPrompt({ ...prompt, text: e.target.value })}
                    rows={10}
                    placeholder="System prompt for building your final prompt..."
                />
                {/* Input field for the domain/topic */}
                <div className="mt-4">
                    <label className="block font-semibold mb-1">Enter your Domain/Topic:</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded"
                        placeholder="E.g., E-Scooter Rental Services"
                        value={prompt.domain}
                        onChange={(e) => setPrompt({ ...prompt, domain: e.target.value })}
                    />
                </div>
                <button onClick={handleBuildPrompt} className="btn mt-2">
                    Build Prompt
                </button>
                <div className="border-solid rounded border-4 border-blue-800 h-full mt-4">
                    {result && (
                        <div className="mt-4">
                            <h3 className="font-semibold">Result:</h3>
                            <Textarea
                                value={result}
                                onChange={(e) => setResult(e.target.value)}
                                rows={10}
                                className="bg-gray-80 p-2 border rounded"
                            />
                            <button onClick={handleBuildPrompt} className="btn mt-2">
                                Send to ChatGPT
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
