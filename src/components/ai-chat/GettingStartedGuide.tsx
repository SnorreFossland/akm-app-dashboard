import React from 'react';
import { Edit, Check, FileText, Paperclip, Library, BookmarkPlus } from 'lucide-react';

const GettingStartedGuide: React.FC = () => {
    return (
        <div className="flex-1 text-primary overflow-auto min-h-0">
            <div className="flex flex-col items-center justify-start w-full pb-6">
                <div className="space-y- max-w-3xl mx-auto">
                    <section>
                        <h2 className="text-xl font-semibold text-blue-400 mb-3">Getting Started</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-medium text-gray-200">1. Ask a Question Directly</h3>
                                <ul className="list-disc pl-6 mt-1 text-gray-300">
                                    <li>Type your question in the provided input area.</li>
                                    <li>Click the up-arrow to send your question to the AI.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-gray-200">2. Use Prompt Templates</h3>
                                <ul className="list-disc pl-6 mt-1 text-gray-300">
                                    <li>Select a prompt template from the dropdown menu above the input area.</li>
                                    <li>You can add a local file to use as context for your prompt.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-gray-200">Add a local file to refine, or use as context to your questions.</h3>
                                <ul className="list-disc pl-6 mt-1 text-gray-300">
                                    <li>
                                        <strong>Alternative 1 Refine: </strong>
                                        Click the <FileText className="inline w-4 h-4 mr-1" /> button above the input area to select a file for refinement.
                                    </li>
                                    <li>
                                        <strong>Alternative 2 Context: </strong>
                                        Click the <Paperclip className="inline w-4 h-4 mr-1" /> button below the input area to select a file as context.
                                    </li>
                                    <li>
                                        <strong>Alternative 3 Use the Left Panel: </strong>
                                        Click the upper left button to open the left panel.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-blue-400 my-3">Working with the AI Response</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-gray-200">1. Preview the Response</h3>
                                <p className="text-gray-300">Click the &quot;Preview&quot; button to see a Markdown preview of the text.</p>
                            </div>
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-gray-200">2. Save the Document</h3>
                                <p className="text-gray-300">Click the <BookmarkPlus className="inline w-4 h-4 mr-1" /> button to save the response text to the library.</p>
                            </div>
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-gray-200">3. Open Library</h3>
                                <p className="text-gray-300">
                                    Click the <Library className="inline w-6 h-6 mb-2" /> button in the left panel to open the library with the saved documents. Select a document to view its details.
                                </p>
                            </div>
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-gray-200">4. Edit the Document</h3>
                                <p className="text-gray-300">
                                    Click the <Edit className="inline w-4 h-4 mr-1" /> button to make any changes to the document. Click the <Check className="inline text-bold h-4 w-4" /> button to apply your changes,
                                     and <BookmarkPlus className="inline text-bold h-4 w-4" /> button to save to library.
                                </p>
                            </div>
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-gray-200">5. View a document</h3>
                                <p className="text-gray-300">
                                    Click the <Library className="inline w-4 h-4 mr-1" /> button and then click on a document to view its details.
                                </p>
                            </div>
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-gray-200">6. Import a Document from local file</h3>
                                <p className="text-gray-300">
                                    Click the <Library className="inline w-4 h-4 mr-1" /> button and then &quot;Import File&quot; to import a document from your local device.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl mt-4 font-semibold text-blue-400 mb-3">Tips for Effective Use</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-blue-500/20 p-2 mt-1">
                                    <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-200">Be Specific</h3>
                                    <p className="text-gray-300">The more detailed your question or topic description, the better the AI can assist you.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-blue-500/20 p-2 mt-1">
                                    <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-200">Use Templates Wisely</h3>
                                    <p className="text-gray-300">Templates can save you time and ensure you cover all necessary points.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-blue-500/20 p-2 mt-1">
                                    <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-200">Review and Edit</h3>
                                    <p className="text-gray-300">Always review the generated content and make edits as needed to ensure accuracy and relevance.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-blue-500/20 p-2 mt-1">
                                    <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-200">Save and Organize</h3>
                                    <p className="text-gray-300">Use the library feature to keep your documents organized and easily accessible.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default GettingStartedGuide;