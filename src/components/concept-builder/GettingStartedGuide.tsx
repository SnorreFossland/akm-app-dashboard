import React from 'react';
import { Edit, Check, FileText, Paperclip, Library, BookmarkPlus } from 'lucide-react';

const GettingStartedGuide: React.FC = () => {
    return (
        <>
                            <div className="m-1 mb-5">
                                {/* <details>
                                    <summary>
                                        <FontAwesomeIcon icon={faQuestionCircle} width="16" height="16" />
                                    </summary> */}
                                    <div className="bg-gray-600 p-2">
                                        <p>Explore the Concepts or Terms for a Domain assisted by AI</p>
                                        <p>This process involves several key steps, each contributing to the development of a structured and comprehensive model for a given domain.
                                            The goal is to build a  Model that leverages AI to facilitate the creation and integration of concepts within the domain.
                                        </p>
                                        <p><strong>Establish the Concept Ontology (Conceptual Framework) for the Domain:</strong></p>
                                        <p style={{ marginLeft: '20px' }}>The Concept Ontology refers to the foundational structure that defines the essential concepts, theories, models, and frameworks within a specific domain or field. It serves as a shared vocabulary that enables clear communication and collaboration among practitioners. This ontology includes:
                                            It encompasses the concepts, principles, and relationships that are essential for practitioners within the field to communicate effectively and advance knowledge.</p>
                                        <ul>
                                            <li><strong>• Core Concepts: </strong>Fundamental ideas and categories that are central to the domain.</li>
                                            <li><strong>• Principles and Theories: </strong>The underlying rules and logical structures that guide the domain’s knowledge and practices.</li>
                                            <li><strong>• Relationships: </strong>The connections and interactions between concepts that help explain how they relate to one another.</li>
                                        </ul>
                                        <p style={{ marginLeft: '20px' }}>By establishing this ontology, you create a well-organized framework that supports knowledge sharing, problem-solving, and further advancement within the field.</p>
                                    </div>
                                {/* </details> */}
                            </div>
        </>
    )
}
export default GettingStartedGuide;