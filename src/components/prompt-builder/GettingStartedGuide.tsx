import React from 'react';
import { Edit, Check, FileText, Paperclip, Library, BookmarkPlus } from 'lucide-react';

const GettingStartedGuide: React.FC = () => {
    return (
        <div className="m-2 p-4 rounded bg-gray-900 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 max-h-[calc(100vh-21rem)]">
            <h2 className="text-xl font-bold text-green-500 mb-4">Welcome to the Prompt Builder</h2>

            <p className="text-white mb-3">
                The Prompt Builder is an AI-powered tool that helps you create perfect prompts for domain-specific knowledge models.
                Its about asking the right questions to ask AI to give the best definition of a subject  (The Domain we want to explore).
            </p>

            <h3 className="text-lg font-bold text-green-400 mt-4 mb-2">How it works:</h3>

            <ol className="text-white list-decimal ml-5 space-y-2">
                <li><span className="font-bold">Start with a Subject :</span> Enter a domain, topic, or theme you want to create a prompt for.</li>
                <li><span className="font-bold">Answer Clarifying Questions:</span> The AI will ask questions to refine your requirements.</li>
                <li><span className="font-bold">Review & Edit:</span> Examine the suggested prompt and make any necessary edits.</li>
                <li><span className="font-bold">Keep:</span> When satisfied, save your prompt to use with your knowledge models. </li>
            </ol>
            <div className="text-sm font-bold mt-4 mb-2">
                <span className="text-green-400">Note: </span> You can run the prompt in next step
            </div>
            <div className="mt-6 p-3 border border-green-700 rounded bg-background">
                <h4 className="text-green-400 font-bold mb-2">Tips for best results:</h4>
                <ul className="text-white list-disc ml-5 space-y-1">
                    <li>Be specific about your domain</li>
                    <li>Provide detailed answers to the clarification questions</li>
                    <li>Don&apos;t hesitate to iterate through multiple rounds of refinement</li>
                    <li>Edit the final prompt to add any missing details</li>
                </ul>
            </div>
        </div>

    )
}
export default GettingStartedGuide;