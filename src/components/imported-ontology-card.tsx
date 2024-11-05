import React, { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from 'react-markdown';
import 'tailwindcss/tailwind.css'; // Ensure Tailwind CSS is imported


interface OntologyCardProps {
    ontologyData: {
        name: string;
        description: string;
        presentation: string;
        concepts: Concept[];
        relationships: Relationship[];
    };
}
interface Concept {
    name: string;
    description: string;
}
interface Relationship {
    name: string;
    nameFrom: string;
    nameTo: string;
}

const debug = false;

export const ImportedOntologyCard = ({ ontologyData }: OntologyCardProps) => {
    const diagramRef = useRef<HTMLDivElement>(null);
    const [mermaidDiagram, setMermaidDiagram] = useState('');

    const [activeTab, setActiveTab] = useState('concepts');
    const [regen, setRegen] = useState(true);

    if (!debug) console.log('35 ontology-card', ontologyData);

    const generateMermaidDiagram = useCallback((regen: boolean) => {
        try {
            let diagram = (regen) ? 'graph TD;\n' : 'graph TD;\n\n';
            ontologyData?.concepts.forEach((object) => {
                diagram += `${object.name.replace(/\s+/g, '_')}["${object.name}"];\n`;
            });
            ontologyData?.relationships.forEach((r) => {
                diagram += `${r.nameFrom.replace(/\s+/g, '_')} -->|${r.name.replace(/\s+/g, '_')}| ${r.nameTo.replace(/\s+/g, '_')};\n`;
            });
            setMermaidDiagram(diagram);
        } catch (error) {
            console.error('Error generating Mermaid diagram:', error);
        }
    }, [ontologyData]);

    useEffect(() => {
        generateMermaidDiagram;
    }, [ontologyData, generateMermaidDiagram]);

    useEffect(() => {
        if (mermaidDiagram && diagramRef.current) {
            try {
                mermaid.initialize({
                    startOnLoad: true,
                    theme: 'base',
                    themeVariables: {
                        primaryColor: '#667777',
                        edgeLabelBackground: '#22557715',
                        secondaryColor: '#8888ff',
                        tertiaryColor: '#ddddff',
                        primaryTextColor: '#ffdddd',
                        secondaryTextColor: '#00ff00',
                        tertiaryTextColor: '#0000ff',
                        lineColor: '#dddddd',
                        background: '#ffffff',
                        nodeBorderRadius: '25px',
                    },
                });
                mermaid.contentLoaded();
            } catch (error) {
                console.error('Error initializing Mermaid:', error);
            }
        }
    }, [mermaidDiagram]);

    const renderMermaidDiagram = () => {
        if (mermaidDiagram) {
            return <div ref={diagramRef} className="mermaid">{mermaidDiagram}</div>;
        }
        return null;
    };

    return (
        <>
            <div className="w-100">
                <div className="m-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-gray-700 mx-1 p-1">
                        <TabsList className="mx-1 mb-0 bg-gray-700">
                            {/* <TabsTrigger value="summary" className='pb-2 mt-3'>Summary</TabsTrigger> */}
                            <TabsTrigger value="concepts" className='pb-2 mt-3'>Concept List</TabsTrigger>
                            {/* <TabsTrigger value="diagram" className='pb-2 mt-3'>Diagram</TabsTrigger> */}
                        </TabsList>
                        <TabsContent value="concepts" className="flex m-0 px-1 py-2 rounded bg-background">
                            <Card className="w-full ">
                                <CardHeader>
                                    <CardTitle className="bg-gray-800 px-2 m-0 text-1xl font-bold">Concepts </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-6k ">
                                    <table className="divide-y divide-gray-700 text-sm w-full">
                                        <thead className="w-full bg-gray-800 sticky top-0">
                                            <tr className="w-full">
                                                <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Name</th>
                                                <th className="px-4 py-2 text-center font-medium text-gray-300 uppercase tracking-wider">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td colSpan={3}>
                                                    <div className="bg-gray-800 divide-y divide-gray-700 w-full max-h-[calc(100vh-20rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                                        <table className="min-w-full divide-y divide-gray-700 text-sm w-full">
                                                            <tbody className="bg-gray-900 divide-y divide-gray-700 min-w-full w-full">
                                                                {ontologyData?.concepts?.map((c, index) => (
                                                                    <tr key={c.name + index} className="w-full">
                                                                        <td className="px-4 py-2 text-left whitespace-nowrap text-gray-300">{c.name}</td>
                                                                        <td className="px-4 py-2 text-left text-gray-300 min-w-full">{c.description}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                            {/* <Card className="w-full">
                                <CardHeader>
                                    <CardTitle className="bg-gray-800 px-2 m-0 text-1xl font-bold">Relations</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-2">
                                    <div className="bg-gray-800 divide-y divide-gray-700 w-full max-h-[calc(82vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                        <table className="min-w-full divide-y divide-gray-700 text-sm">
                                            <thead className="bg-gray-900 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">From</th>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Relationship</th>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">To</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-gray-800 divide-y divide-gray-700 max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                                {ontologyData?.relationships?.map((rel, index) => (
                                                    <tr key={rel.name + index}>
                                                        <td className="px-4 py-2 whitespace-nowrap text-gray-300">{rel.nameFrom}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-gray-300">{rel.name}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-gray-300">{rel.nameTo}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card> */}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
};