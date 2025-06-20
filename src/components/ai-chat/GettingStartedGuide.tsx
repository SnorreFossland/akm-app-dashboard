import React from 'react';
import { Edit, Check, FileText, Paperclip, Library, BookmarkPlus } from 'lucide-react';

const GettingStartedGuide: React.FC = () => {
    return (
        <div className="flex-1 p-2 text-primary bg-secondary overflow-auto min-h-0 max-h-[calc(100vh-14rem)]">
            <div className="flex flex-col items-center justify-start w-full pb-6">
                <div className="mx-auto">
                    <section>
                        <h2 className="text-xl font-semibold text-blue-200 mb-3">Getting Started</h2>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="md:col-span-3 space-y-4">
                                <div className="p-4 border border-gray-700 rounded-lg bg-secondary/40">
                                    <h3 className="text-lg font-medium text-secondary-foreground/70">1. Ask a Question Directly</h3>
                                    <div className='ms-2'>Type or paste your question in the provided input area below.</div>
                                    <ul className="list-disc pl-6 mt-1 text-secondary-foreground/70">
                                        <li>Click the <span className="text-blue-200">Send ↑</span> button to submit your question.</li>
                                        <li>Alternatively, you can press the <span className="text-blue-200">Enter</span> key 2 times quickly to send your question.</li>
                                    </ul>
                                </div>

                                <div className="p-4 border border-gray-700 rounded-lg bg-secondary/40">
                                    <h3 className="text-lg font-medium text-secondary-foreground/70">2. Use Prompt Templates</h3>
                                    <div className='ms-2'>Select a prompt template from the dropdown menu above the upper right corner of the input area.</div>
                                    <ul className="list-disc pl-6 mt-1 text-secondary-foreground/70">
                                        <li>You can type or paste additional text under the template text.</li>
                                        <li>You can add text in the left panel as <span className="text-blue-200">Document Context.</span>This text will be used as context for the prompt.</li>
                                        <li>You can also click <FileText className="inline w-4 h-4 mr-1" /> to add a local text-file to use as context for your prompt.</li>
                                    </ul>
                                </div>

                                <div className="p-4 border border-gray-700 rounded-lg bg-secondary/40">
                                    <h3 className="text-lg font-medium text-secondary-foreground/70">3. You can refine a document or text.</h3>
                                    <ul className="list-disc pl-6 mt-1 text-secondary-foreground/70">
                                        <li>Alt. 1: Click the <span className="text-blue-200"> <FileText className="inline w-4 h-4 mx-1 mb-1" /> Load a file</span> button above the input area to select a local file to enhance or refine. (a new set of templates will appear).
                                        </li>
                                        <li>Alt. 2: Click the upper left button to open the left panel, then Context tab. <br />
                                            (The document text will be inserted and used as context for your prompt.)</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                <div className="p-4 border border-gray-700 rounded-lg bg-secondary/40">
                                    <h3 className="text-lg font-medium text-blue-200 mb-2">Tips</h3>
                                    <ul className="list-disc pl-6 space-y-2 text-secondary-foreground/70">
                                        <li>You can specify format in your question for specific response formats (e.g., JSON, XML, MD (Markdown), etc.)</li>
                                        <li>You can also use <span className="text-blue-200">Markdown</span> syntax in your questions.</li>
                                        <li>You can specify which language the AI should respond in by adding  <span className="text-blue-200">respond in &quot;Language&quot;</span></li>
                                        <li>Consider providing examples to clarify your request.</li>
                                        <li>Be clear and concise to improve response accuracy.</li>
                                        <li>Utilize bullet points for clarity when listing multiple items.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-blue-200 my-3">Working with the AI Response</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-secondary-foreground/70">1. Preview the Response</h3>
                                <p className="text-secondary-foreground/70">Click the &quot;Preview&quot; button to see a Markdown preview of the text.</p>
                            </div>
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-secondary-foreground/70">2. Save the Document</h3>
                                <p className="text-secondary-foreground/70">Click the <BookmarkPlus className="inline w-4 h-4 mr-1" /> button to save the response text to the library.</p>
                            </div>
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-secondary-foreground/70">3. Open Library</h3>
                                <p className="text-secondary-foreground/70">
                                    Click the <Library className="inline w-6 h-6 mb-2" /> button in the left panel to open the library with the saved documents. Select a document to view its details.
                                </p>
                            </div>
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-secondary-foreground/70">4. Edit the Document</h3>
                                <p className="text-secondary-foreground/70">
                                    Click the <Edit className="inline w-4 h-4 mr-1" /> button to make any changes to the document. Click the <Check className="inline text-bold h-4 w-4" /> button to apply your changes,
                                    and <BookmarkPlus className="inline text-bold h-4 w-4" /> button to save to library.
                                </p>
                            </div>
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-secondary-foreground/70">5. View a document</h3>
                                <p className="text-secondary-foreground/70">
                                    Click the <Library className="inline w-4 h-4 mr-1" /> button and then click on a document to view its details.
                                </p>
                            </div>
                            <div className="p-3 border border-gray-700 rounded-lg">
                                <h3 className="font-medium text-secondary-foreground/70">6. Import a Document from local file</h3>
                                <p className="text-secondary-foreground/70">
                                    Click the <Library className="inline w-4 h-4 mr-1" /> button and then &quot;Import File&quot; to import a document from your local device.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl mt-4 font-semibold text-blue-200 mb-3">Tips for Effective Use</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-blue-500/20 p-2 mt-1">
                                    <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                                </div>
                                <div>
                                    <h3 className="font-medium text-secondary-foreground/70">Be Specific</h3>
                                    <p className="text-secondary-foreground/70">The more detailed your question or topic description, the better the AI can assist you.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-blue-500/20 p-2 mt-1">
                                    <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                                </div>
                                <div>
                                    <h3 className="font-medium text-secondary-foreground/70">Use Templates Wisely</h3>
                                    <p className="text-secondary-foreground/70">Templates can save you time and ensure you cover all necessary points.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-blue-500/20 p-2 mt-1">
                                    <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                                </div>
                                <div>
                                    <h3 className="font-medium text-secondary-foreground/70">Review and Edit</h3>
                                    <p className="text-secondary-foreground/70">Always review the generated content and make edits as needed to ensure accuracy and relevance.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-blue-500/20 p-2 mt-1">
                                    <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                                </div>
                                <div>
                                    <h3 className="font-medium text-secondary-foreground/70">Save and Organize</h3>
                                    <p className="text-secondary-foreground/70">Use the library feature to keep your documents organized and easily accessible.</p>
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