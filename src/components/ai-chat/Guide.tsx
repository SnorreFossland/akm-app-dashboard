import React from 'react';
import { Edit, Check, FileText, Paperclip, Library, BookmarkPlus } from 'lucide-react';

const Guide: React.FC = () => {
    return (
        <div className="flex flex-col gap-2">
            {/* <div className="space-y-4 p-1 max-h-[calc(100vh-22rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800"> */}
                <div className="p-4 border border-gray-700 rounded-lg bg-secondary/80">
                    <h3 className="text-lg font-medium text-secondary-foreground">1. Ask a Question Directly</h3>
                    <div className='ms-2'>Type or paste your question in the provided input area.</div>
                    <ul className="list-disc pl-4 text-secondary-foreground">
                        <li>Click the <span className="text-blue-200">Send ↑</span> button to submit your question.</li>
                        <li>Alternatively, you can quickly press the <span className="text-blue-200">Enter</span> key 2 times to send your question.</li>
                    </ul>
                </div>

                <div className="p-4 border border-gray-700 rounded-lg bg-secondary/90">
                    <h3 className="text-lg font-medium text-secondary-foreground">2. Use Prompt Templates</h3>
                    <div className='ms-2'>Select a prompt template from the dropdown menu above the upper right corner of the input area.</div>
                    <ul className="list-disc pl-6 mt-1 text-secondary-foreground">
                        <li>You can type or paste additional text under the template text.</li>
                        <li>
                            Open the left panel <br /> (Click on the upperleft icon
                            <span className="inline-flex items-center">
                                <svg className="inline-block mx-1 " width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <line x1="2" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <line x1="2" y1="17" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </span> to access the left panel.)
                            You can add text in the <span className="text-blue-200">Current Context.</span>This text will be used as context for the prompt.
                        </li>
                        <li>You can also click <FileText className="inline w-4 h-4 mr-1" />, to add a local text-file to use as context for your prompt.</li>
                    </ul>
                </div>

                <div className="p-4 border border-gray-700 rounded-lg bg-secondary/85">
                    <h3 className="text-lg font-medium text-secondary-foreground">3. You can refine a document or text.</h3>
                    <ul className="list-disc pl-6 mt-1 text-secondary-foreground">
                        <li>Alt. 1: Click the <span className="text-blue-200"> <FileText className="inline w-4 h-4 mx-1 mb-1" /> Load a file</span> button above the input area to select a local file to enhance or refine. (a new set of templates will appear).
                        </li>
                        <li>Alt. 2: Click the upper left button to open the left panel, then Context tab. <br />
                            (The document text will be inserted and used as context for your prompt.)</li>
                    </ul>
                </div>
            {/* </div> */}
        </div>
    )
};

export default Guide;

