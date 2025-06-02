import React from 'react';
import { Edit, Check, FileText, Paperclip, Library, BookmarkPlus } from 'lucide-react';

const GettingStartedGuide: React.FC = () => {
    return (
        <div className="flex-1 p-2 text-primary text-sm bg-secondary overflow-auto min-h-0">
            <div className="flex flex-col items-center justify-start w-full pb-6">
                <div className="mx-auto">
                    <section>
                        <h2 className="text-xl font-semibold text-blue-400 mb-3">Getting Started</h2>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="md:col-span-3 space-y-4 p-4 border border-gray-700 rounded-lg">
                                <div className="px-4 b bg-secondary/40">
                                    <ol className="list-decimal pl-6 mt-1 text-secondary-foreground/50">
                                        <li className="text-lg font-medium text-secondary-foreground/50">Select IRTV type to generate in the Prompt Templates</li>
                                        <div className='ms-2'>Select a prompt template from the dropdown menu above and right of the input area.</div>
                                        <ul className="list-disc pl-6 mt-1 text-secondary-foreground/50">
                                            <li>
                                                Type or paste a list of Concepts/Terms, tasks, views or roles in the provided input area.
                                            </li>
                                            <li>
                                                You can click <FileText className="inline w-4 h-4 mr-1" /> to add a local text-file to use as context for your prompt.
                                            </li>
                                        </ul>

                                        <li className="text-lg font-medium text-secondary-foreground/50">Load a Domain definition</li>
                                        <div className='ms-2'>In the left Panel, click on the "Domain" Tab to view the available Domain definition.</div>
                                        <ul className="list-disc pl-6 mt-1 text-secondary-foreground/50">
                                            <li className='ms-2'>This definition might contain a list of Concepts and Relationships that will be used as input to generate the IRTV.</li>
                                            <li className='ms-2'>If a list of Concepts and Relationships is missing AI will suggest relevant Concepts and Relationships that will be used as input to generate the IRTV.</li>
                                        </ul>
                                        <li className="text-lg font-medium text-secondary-foreground/50">Load an Ontology list of Concepts and relationships</li>
                                        <ul className="list-disc pl-6 mt-1 text-secondary-foreground/50">
                                            <li className='ms-2'>In the left Panel, click on the "Ontology" Tab to view the available Concepts and relationships.</li>
                                            <li className='ms-2'>This list of Concepts and Relationships will be used as input to generate the IRTV.</li>
                                        </ul>
                                    </ol>
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-4">
                                <div className="p-4 border border-gray-700 rounded-lg bg-secondary/50">
                                    <h3 className="text-lg font-medium text-blue-400 mb-2">Tips</h3>
                                    <ul className="list-disc pl-6 space-y-2 text-secondary-foreground/50">
                                        <li>....</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-blue-400 my-3">Working with the AI Response</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-secondary-foreground/50">1. Preview the Response</h3>
                                <p className="text-secondary-foreground/70">Click the &quot;Preview&quot; button to see a Markdown preview of the text.</p>
                            </div>
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-secondary-foreground/50">2. Save the Document</h3>
                                <p className="text-secondary-foreground/70">Click the <BookmarkPlus className="inline w-4 h-4 mr-1" /> button to save the response text to the library.</p>
                            </div>
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-secondary-foreground/50">3. Open Library</h3>
                                <p className="text-secondary-foreground/70">
                                    Click the <Library className="inline w-6 h-6 mb-2" /> button in the left panel to open the library with the saved documents. Select a document to view its details.
                                </p>
                            </div>
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-secondary-foreground/50">4. Edit the Document</h3>
                                <p className="text-secondary-foreground/70">
                                    Click the <Edit className="inline w-4 h-4 mr-1" /> button to make any changes to the document. Click the <Check className="inline text-bold h-4 w-4" /> button to apply your changes,
                                    and <BookmarkPlus className="inline text-bold h-4 w-4" /> button to save to library.
                                </p>
                            </div>
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-secondary-foreground/50">5. View a document</h3>
                                <p className="text-secondary-foreground/70">
                                    Click the <Library className="inline w-4 h-4 mr-1" /> button and then click on a document to view its details.
                                </p>
                            </div>
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-secondary-foreground/50">6. Import a Document from local file</h3>
                                <p className="text-secondary-foreground/70">
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
                                    <h3 className="font-medium text-secondary-foreground/50">Be Specific</h3>
                                    <p className="text-secondary-foreground/70">The more detailed your question or topic description, the better the AI can assist you.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-blue-500/20 p-2 mt-1">
                                    <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                                </div>
                                <div>
                                    <h3 className="font-medium text-secondary-foreground/50">Use Templates Wisely</h3>
                                    <p className="text-secondary-foreground/70">Templates can save you time and ensure you cover all necessary points.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-blue-500/20 p-2 mt-1">
                                    <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                                </div>
                                <div>
                                    <h3 className="font-medium text-secondary-foreground/50">Review and Edit</h3>
                                    <p className="text-secondary-foreground/70">Always review the generated content and make edits as needed to ensure accuracy and relevance.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-blue-500/20 p-2 mt-1">
                                    <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                                </div>
                                <div>
                                    <h3 className="font-medium text-secondary-foreground/50">Save and Organize</h3>
                                    <p className="text-secondary-foreground/70">Use the library feature to keep your documents organized and easily accessible.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div >
        </div >
    );
};

export default GettingStartedGuide;