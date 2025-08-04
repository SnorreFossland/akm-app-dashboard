import React from 'react';
import { Edit, Check, FileText, Paperclip, Library, BookmarkPlus } from 'lucide-react';

const Guide: React.FC = () => {
    return (
        <div className="flex flex-col gap-2">
            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/90">
                <h3 className="text-lg font-medium text-secondary-foreground/70">Step 1: Define Ontology Core</h3>
                <div className='ms-2'>
                    Use the <span className="text-blue-400 font-semibold">'Ontology Builder'</span> tab to chat with the AI. Describe the core concepts, entities, and relationships of your ontology.
                </div>
            </div>

            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/90">
                <h3 className="text-lg font-medium text-secondary-foreground/70">Step 2: Preview Output</h3>
                <div className="text-sm text-secondary-foreground/60 mt-1">
                    The <span className="text-blue-400 font-semibold">'Output Preview'</span> panel on the right shows the generated output in Markdown.
                </div>
            </div>

            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/90">
                <h3 className="text-lg font-medium text-secondary-foreground/70">Step 3: Save Your Ontology</h3>
                <div className="text-sm text-secondary-foreground/60 mt-1">
                    Once you are satisfied with the ontology, click the <span className="text-blue-400 font-semibold">'Save'</span> button in the top bar to persist your changes.
                </div>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/90">
                <h3 className="text-lg font-medium text-secondary-foreground/70">Step 4: Review and Refine</h3>
                <div className="text-sm text-secondary-foreground/60 mt-1">
                    Check the <span className="text-blue-400 font-semibold">'Current Ontology'</span> tab to see the generated ontology details. Use the AI chat to refine the definition.
                </div>
            </div>
        </div>
    )
};

export default Guide;

