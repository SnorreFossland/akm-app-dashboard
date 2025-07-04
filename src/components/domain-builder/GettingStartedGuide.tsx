import React from 'react';
import { Edit, Check, FileText, Paperclip, Library, BookmarkPlus } from 'lucide-react';

const GettingStartedGuide: React.FC = () => {
    return (
        <>
            <div className="h-full p-4 rounded bg-gray-900 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-full">
                <h2 className="text-xl font-bold text-green-500 mb-4">Welcome to the Domain Builder</h2>

                <p className="text-white mb-3">
                    The Domain Builder helps you define and create comprehensive domain knowledge collections
                    that will be used by AI models to provide accurate and relevant information.
                </p>

                <h3 className="text-lg font-bold text-green-400 mt-4 mb-2">How it works:</h3>

                <ol className="text-white list-decimal ml-5 space-y-2">
                    <li><span className="font-bold">Define your domain:</span> Provide a name and detailed description.</li>
                    <li><span className="font-bold">Use existing prompt:</span> Your domain will use the prompt created in the Prompt Builder.</li>
                    <li><span className="font-bold">Generate definition:</span> Let AI create a comprehensive domain presentation.</li>
                    <li><span className="font-bold">Edit and refine:</span> Customize the generated content to your needs.</li>
                    <li><span className="font-bold">Keep:</span> Save your domain definition for use in knowledge models.</li>
                </ol>

                <div className="mt-6 p-3 border border-green-700 rounded bg-background">
                    <h4 className="text-green-400 font-bold mb-2">Tips for best results:</h4>
                    <ul className="text-white list-disc ml-5 space-y-1">
                        <li>Be specific in your domain description</li>
                        <li>Make sure you have a well-crafted prompt from the Prompt Builder</li>
                        <li>Review and edit the AI-generated presentation</li>
                        <li>Consider adding examples and use cases</li>
                    </ul>
                </div>
            </div>
        </>
    )
}
export default GettingStartedGuide;