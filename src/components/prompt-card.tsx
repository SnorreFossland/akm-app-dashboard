import React, { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { columns } from "@/components/ontology-builder/concept-columns";
import { ConceptTable } from "@/components/ontology-builder/concept-table";
import { RelshipTable } from "@/components/ontology-builder/relship-table";
import { ColumnDef } from "@tanstack/react-table";
import ReactMarkdown from 'react-markdown';
import 'tailwindcss/tailwind.css';

interface PromptCardProps {
    promptData: Array<{
        id: string; // unique identifier
        name: string;
        prompt: string;
        response: string;
    }> | [];
}

interface OntologyCardProps {
    ontologyData: {
        name: string;
        description: string;
        concepts: Concept[];
        relationships: Relationship[];
        presentation: string;
    } | null;
}
interface Concept {
    name: string;
    description: string;
}

interface Relationship {
    name: string;
    nameFrom: string;
    nameTo: string;
    description: string;
    color?: string;
}

const debug = false;

export const PromptCard = ({ promptData }: PromptCardProps) => {
    const diagramRef = useRef<HTMLDivElement>(null);
    const [mermaidDiagram, setMermaidDiagram] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState('summary');
    const [zoom, setZoom] = useState(1);
    const [isZoomMode, setZoomMode] = useState(false);

    if (debug) console.log('35 prompt-card', promptData);


    return (
        <>
            <div className="w-full">
                <div className="w-full">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className=" p-1">
                        <TabsList className="bg-transparent">
                            <TabsTrigger
                                value="summary"
                                className="ml-1 rounded-b-none data-[state=active]:bg-card data-[state=active]:text-white data-[state=active]:font-semibold  data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-gray-300 data-[state=inactive]:text-gray-100 py-2 px-4 border-gray-400"
                            >
                                Ontology Summary
                            </TabsTrigger>

                        </TabsList>

                        <TabsContent value="summary" className="rounded  w-full mt-0 ">
                            <Card className="pt-1">
                                <CardContent className="max-h-[calc(100vh-4rem)] overflow-hidden">
                                    <div className=" px-1">
                                        {promptData?.map(prompt => prompt.name && (
                                            <>
                                                <h3 className="flex p-1 font-bold  text-gray-00 inline-block">
                                                    Prompt name: <span className="mx-1 px-1 inline-block">{prompt?.name}</span>
                                                </h3>
                                                <details>
                                                    <summary className="mx-1 text-gray-400 w-full cursor-pointer">Description...</summary>
                                                    <div className="mx-1 p-1 inline-block">{prompt.response}</div>
                                                </details>
                                            </>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
};