import React from 'react';
import { Edit, Check, FileText, Paperclip, Library, BookmarkPlus } from 'lucide-react';

const GettingStartedGuide: React.FC = () => {
    return (
        <>
            <div className="h-full p-4 rounded bg-gray-900 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-full">
                <h2 className="text-xl font-bold text-green-500 mb-4">Welcome to the Domain Builder</h2>

                <p className="text-white mb-3">
                    The Domain Builder enables you to create and scope a detailed domain definition
                    that will be used as basis for AI in delivering precise and contextually relevant responses about the current domain/topic.
                </p>
                <p className="text-white mb-3">
                    The main objective of the Domain Builder is to help you create and perfect the context for your endeavour, using AI assistance, ensuring the results precisely match your specified needs and requirements.
                </p>

                <h3 className="text-lg font-bold text-green-400 mt-4 mb-2">How it works:</h3>

                <ol className="text-white list-decimal ml-5 space-y-2">
                    <li><span className="font-bold">Click on the button below:</span>A predefined template prompt will be inserted.(You can type your own or edit it)</li>
                    <li><span className="font-bold">Describe your domain/topic:</span> Provide a name and description for your domain.</li>
                    <li><span className="font-bold">Click Send to generate the definition:</span> The response is shown above.</li>
                    <li><span className="font-bold">Preview the generated content in the right panel:</span></li>
                    <li><span className="font-bold">Edit and refine:</span> Customize the generated content to your needs.</li>
                    <li><span className="font-bold">Click </span>
                    <Library className="inline-block w-5 h-4 text-green-600" /> to save your domain definition as the current Domain, to be used as context for future interactions.</li>
                </ol>

                <div className="mt-6 p-3 border border-green-700 rounded bg-background">
                    <h4 className="text-green-400 font-bold mb-2">Tips for best results:</h4>
                    <ul className="text-white list-disc ml-5 space-y-1">
                        <li>Be specific in your domain description</li>
                        {/* <li>Make sure you have a well-crafted prompt from the Prompt Builder</li> */}
                        <li>Review and edit the AI-generated response</li>
                        <li>Consider adding examples and use cases</li>
                    </ul>
                </div>
            </div>
        </>
    )
}
export default GettingStartedGuide;