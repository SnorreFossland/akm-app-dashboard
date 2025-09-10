import fs from "fs";
import path from "path";
import React from "react";
import MarkdownPreview from "@/components/ai-chat/MarkdownPreview";

export default function RoadmapPage() {
  const filePath = path.join(process.cwd(), "ROADMAP.md");
  let content = "# Roadmap\nFile not found.";
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {}

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <MarkdownPreview mdPreview={content} />
    </main>
  );
}
