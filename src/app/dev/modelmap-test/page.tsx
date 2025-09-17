"use client";
import React from "react";
import { mapModelId } from "@/lib/ai/modelMap";

export default function ModelMapTest() {
  const samples = [
    "gpt-4o",
    "gpt-4o-mini",
    "openai:gpt-4o",
    "mistral",
    "deepseek-chat",
    "gpt-5-mini",
    "unknown-model",
    "",
  ];

  return (
    <main className="p-4 max-w-xl mx-auto text-sm">
      <h1 className="text-lg font-semibold mb-2">Model Map Smoke Test</h1>
      <p className="mb-4 text-gray-400">A quick check of alias mapping used across agents.</p>
      <div className="border border-gray-700 rounded">
        {samples.map((s) => (
          <div key={s || "(empty)"} className="flex justify-between px-2 py-1 border-b border-gray-800">
            <span className="text-gray-400">{s || "(empty)"}</span>
            <span className="text-blue-300">{mapModelId(s)}</span>
          </div>
        ))}
      </div>
    </main>
  );
}

