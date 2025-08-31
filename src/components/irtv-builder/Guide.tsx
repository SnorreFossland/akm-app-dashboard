import React from 'react';
import { Edit, Check, FileText, Paperclip, Library, BookmarkPlus } from 'lucide-react';

const Guide: React.FC = () => {
    return (
        <div className="flex flex-col gap-2">
            {/* <div className="space-y-4 p-1 max-h-[calc(100vh-22rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800"> */}
            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/90">
                <h3 className="text-lg font-medium text-secondary-foreground/70">Step 1: Set the Context</h3>
                <div className="text-sm text-secondary-foreground/60 mt-1">
                    Use the tabs in this panel to provide context. You can use a saved conversation, the current model, or other documents.
                </div>
            </div>

            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/90">
                <h3 className="text-lg font-medium text-secondary-foreground/70">Step 2: Interact with the AI</h3>
                <div className="text-sm text-secondary-foreground/60 mt-1">
                    Use the <span className="text-blue-400 font-semibold">AI IRTV Modelling Assistant</span> in the main panel to describe the model or view you want to create.
                </div>
            </div>

            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/85">
                <h3 className="text-lg font-medium text-secondary-foreground/70">Step 3: Preview the Output</h3>
                <div className="text-sm text-secondary-foreground/60 mt-1">
                    The <span className="text-blue-400 font-semibold">IRTV Preview</span> panel on the right will show the generated model or view as you work.
                </div>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/85">
                <h3 className="text-lg font-medium text-secondary-foreground/70">Step 4: View in Modeller</h3>
                <div className="text-sm text-secondary-foreground/60 mt-1">
                    Switch to the <span className="text-blue-400 font-semibold">Model</span> tab in the main panel to see a graphical representation of your work in the modeller.
                </div>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/85">
                <h3 className="text-lg font-medium text-secondary-foreground/70">Step 5: Save Your Work</h3>
                <div className="text-sm text-secondary-foreground/60 mt-1">
                    Use the file operations in the top bar to save your model and views.
                </div>
            </div>
            {/* </div> */}
        </div>
    )
};

export default Guide;

