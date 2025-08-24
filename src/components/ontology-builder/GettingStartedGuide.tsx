import React from 'react';
import { Edit, Check, FileText, Paperclip, Library, BookmarkPlus } from 'lucide-react';

const GettingStartedGuide: React.FC = () => {
    return (
        <>
            <div className="h-full p-4 rounded bg-gray-900 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-full">
                <h2 className="text-xl font-bold text-green-500 mb-4">Welcome to the Ontology Builder</h2>

                <p className="text-white mb-3">
                    The Ontology Builder helps you explore, define, and refine a structured set of concepts and relationships
                    for your domain. Use AI assistance to generate an initial ontology, then iteratively review, edit,
                    and accept the parts that fit your needs.
                </p>
                <p className="text-white mb-3">
                    The resulting ontology becomes shared context across the suite, improving precision and relevance
                    for downstream tasks that rely on domain concepts and their relationships.
                </p>

                <h3 className="text-lg font-bold text-green-400 mt-4 mb-2">How it works:</h3>

                <ol className="text-white list-decimal ml-5 space-y-2">
                    <li>
                        <span className="font-bold">Click the template button (or write your own prompt):</span>{' '}
                        A predefined ontology prompt will be inserted; you can edit it to match your domain.
                    </li>
                    <li>
                        <span className="font-bold">Describe your domain/topic or paste existing concepts:</span>{' '}
                        Provide a brief description and any example concepts/terms or relationships you already have.
                    </li>
                    <li>
                        <span className="font-bold">Click “Send” to generate a suggestion:</span>{' '}
                        The AI will propose concepts and relationships based on your input.
                    </li>
                    <li>
                        <span className="font-bold">Preview the generated ontology in the right panel:</span>{' '}
                        Review the proposed concepts, definitions, and relationships.
                    </li>
                    <li>
                        <span className="font-bold">Edit and refine:</span>{' '}
                        Adjust wording, add missing items, and remove irrelevant ones.
                    </li>
                    <li>
                        <span className="font-bold">Accept and Save:</span>{' '}
                        Accept items you want to keep, then save to your Library for reuse.
                    </li>
                </ol>

                <h3 className="text-lg font-bold text-green-400 mt-5 mb-2">Quick actions</h3>

                <ul className="text-white space-y-2">
                    <li className="flex items-start gap-2">
                        <Edit className="h-4 w-4 text-green-400 mt-1" />
                        <div>
                            <span className="font-bold">Edit before sending:</span>{' '}
                            Tweak the prompt or current draft for better results.
                        </div>
                    </li>
                    <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-1" />
                        <div>
                            <span className="font-bold">Accept response:</span>{' '}
                            Commit selected concepts and relationships to your current ontology.
                        </div>
                    </li>
                    <li className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-green-400 mt-1" />
                        <div>
                            <span className="font-bold">View in Markdown:</span>{' '}
                            Open the response in Markdown to edit the text more comfortably.
                        </div>
                    </li>
                    <li className="flex items-start gap-2">
                        <Paperclip className="h-4 w-4 text-green-400 mt-1" />
                        <div>
                            <span className="font-bold">Attach context documents:</span>{' '}
                            Provide source material to ground the ontology suggestions.
                        </div>
                    </li>
                    <li className="flex items-start gap-2">
                        <Library className="h-4 w-4 text-green-400 mt-1" />
                        <div>
                            <span className="font-bold">Open Library:</span>{' '}
                            Browse or reuse previous ontologies and documents.
                        </div>
                    </li>
                    <li className="flex items-start gap-2">
                        <BookmarkPlus className="h-4 w-4 text-green-400 mt-1" />
                        <div>
                            <span className="font-bold">Save to Library:</span>{' '}
                            Persist your refined ontology for future sessions and sharing.
                        </div>
                    </li>
                </ul>

                <h3 className="text-lg font-bold text-green-400 mt-5 mb-2">Tips & best practices</h3>
                <ul className="list-disc ml-5 text-white space-y-1">
                    <li>Start simple: capture a small core of concepts first, then iterate.</li>
                    <li>Be explicit about scope and intended use to guide better suggestions.</li>
                    <li>Use consistent naming, singular nouns for concepts, and clear relationship labels.</li>
                    <li>Ground the AI with examples and short definitions for better precision.</li>
                </ul>
            </div>
        </>
    );
};

export default GettingStartedGuide;