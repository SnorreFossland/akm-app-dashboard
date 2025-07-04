import React from 'react';
import { Edit, Check, FileText, Paperclip, Library, BookmarkPlus } from 'lucide-react';

const GettingStartedGuide: React.FC = () => {
    return (
        <div className="flex-1 p-2 text-primary bg-secondary overflow-auto min-h-0 max-h-[calc(100vh-14rem)]">
            <div className="flex flex-col items-center justify-start w-full pb-6">
                <div className="mx-auto max-w-4xl">
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-4">Domain Concept Exploration</h2>
                            <p className="text-lg text-muted-foreground">
                                Explore the Concepts or Terms for a Domain assisted by AI
                            </p>
                        </div>

                        <div className="bg-card p-6 rounded-lg border">
                            <p className="mb-4">
                                This process involves several key steps, each contributing to the development of a structured and comprehensive model for a given domain. The goal is to build a Model that leverages AI to facilitate the creation and integration of concepts within the domain.
                            </p>

                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold">
                                    Establish the Concept Ontology (Conceptual Framework) for the Domain
                                </h3>

                                <div className="pl-4 border-l-4 border-primary/20">
                                    <p className="mb-4">
                                        The Concept Ontology refers to the foundational structure that defines the essential concepts, theories, models, and frameworks within a specific domain or field. It serves as a shared vocabulary that enables clear communication and collaboration among practitioners.
                                    </p>

                                    <p className="mb-4">
                                        It encompasses the concepts, principles, and relationships that are essential for practitioners within the field to communicate effectively and advance knowledge.
                                    </p>
                                </div>

                                <div className="bg-muted/50 p-4 rounded-lg">
                                    <h4 className="font-semibold mb-3">Key Components:</h4>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary font-semibold">•</span>
                                            <div>
                                                <strong>Core Concepts:</strong> Fundamental ideas and categories that are central to the domain.
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary font-semibold">•</span>
                                            <div>
                                                <strong>Principles and Theories:</strong> The underlying rules and logical structures that guide the domain's knowledge and practices.
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary font-semibold">•</span>
                                            <div>
                                                <strong>Relationships:</strong> The connections and interactions between concepts that help explain how they relate to one another.
                                            </div>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-primary/10 p-4 rounded-lg">
                                    <p className="font-medium">
                                        By establishing this ontology, you create a well-organized framework that supports knowledge sharing, problem-solving, and further advancement within the field.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GettingStartedGuide;