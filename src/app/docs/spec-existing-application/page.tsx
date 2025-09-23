import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const metadata = {
  title: 'App Spec — AI Dashboard',
};

export default async function AppSpecPage() {
  const specPath = path.join(process.cwd(), 'docs', 'spec-existing-application.md');
  let content = '# App Spec\n\nSpec file not found.';
  try {
    content = await fs.promises.readFile(specPath, 'utf8');
  } catch {}

  return (
    <div className="px-4 py-6 md:px-8 lg:px-12 max-w-screen-lg mx-auto text-gray-100">
      <h1 className="text-2xl font-bold mb-4">Application Specification</h1>
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
