import React, { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { columns } from "@/components/concept-builder/concept-columns";
import { ConceptTable } from "@/components/concept-builder/concept-table";
import { RelshipTable } from "@/components/concept-builder/relship-table";
import { ColumnDef } from "@tanstack/react-table";
import ReactMarkdown from 'react-markdown';
import 'tailwindcss/tailwind.css';

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

export const OntologyCard = ({ ontologyData }: OntologyCardProps) => {
    const diagramRef = useRef<HTMLDivElement>(null);
    const [mermaidDiagram, setMermaidDiagram] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState('concepts');
    const [zoom, setZoom] = useState(1);
    const [isZoomMode, setZoomMode] = useState(false);

    if (debug) console.log('35 ontology-card', ontologyData);

    // Memoize the diagram generation to prevent infinite loops
    const generateMermaidDiagram = useCallback(() => {
        if (!ontologyData || !ontologyData.concepts || ontologyData.concepts.length === 0) {
            setMermaidDiagram('');
            return;
        }

        try {
            let diagram = 'graph TD;\n';
            const validNodes = new Set();

            // Add concepts as nodes with better sanitization
            ontologyData.concepts.forEach((concept, index) => {
                if (concept && concept.name && concept.name.trim()) {
                    // Create a more robust node ID
                    const nodeId = concept.name
                        .replace(/[^a-zA-Z0-9]/g, '_')
                        .replace(/_+/g, '_')
                        .replace(/^_|_$/g, '') || `concept_${index}`;

                    const nodeName = concept.name.replace(/"/g, "'"); // Escape quotes
                    diagram += `    ${nodeId}["${nodeName}"];\n`;
                    validNodes.add(concept.name);
                }
            });

            // Add relationships as edges only for valid nodes
            if (ontologyData.relationships && ontologyData.relationships.length > 0) {
                ontologyData.relationships.forEach((rel, index) => {
                    if (rel && rel.nameFrom && rel.nameTo && rel.name &&
                        validNodes.has(rel.nameFrom) && validNodes.has(rel.nameTo)) {

                        const fromId = rel.nameFrom
                            .replace(/[^a-zA-Z0-9]/g, '_')
                            .replace(/_+/g, '_')
                            .replace(/^_|_$/g, '') || `from_${index}`;

                        const toId = rel.nameTo
                            .replace(/[^a-zA-Z0-9]/g, '_')
                            .replace(/_+/g, '_')
                            .replace(/^_|_$/g, '') || `to_${index}`;

                        const relationName = rel.name.replace(/"/g, "'"); // Escape quotes
                        diagram += `    ${fromId} -->|"${relationName}"| ${toId};\n`;
                    }
                });
            }

            console.log('Generated Mermaid diagram:', diagram);
            setMermaidDiagram(diagram);

        } catch (error) {
            console.error('Error generating Mermaid diagram:', error);
            setMermaidDiagram('');
        }
    }, [ontologyData]);

    // Debug effect - separate from diagram generation
    useEffect(() => {
        if (ontologyData && debug) {
            console.log('69 Ontology data being passed to OntologyCard:', {
                name: ontologyData.name,
                concepts: ontologyData.concepts?.length || 0,
                relationships: ontologyData.relationships?.length || 0,
                conceptsData: ontologyData.concepts,
                relationshipsData: ontologyData.relationships
            });
        }
    }, [ontologyData]);

    // Zoom and scroll handling
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.shiftKey) {
                e.preventDefault();
                const scrollAmount = e.deltaY * 2;
                container.scrollLeft += scrollAmount;
                console.log('Horizontal scroll', scrollAmount);
            } else if (isZoomMode) {
                e.preventDefault();
                const zoomSensitivity = 0.1;
                if (e.deltaY < 0) {
                    setZoom((prev) => Math.min(prev + zoomSensitivity, 5));
                } else {
                    setZoom((prev) => Math.max(prev - zoomSensitivity, 0.5));
                }
            }
        };

        if (isZoomMode) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [isZoomMode]);

    // Generate diagram when ontologyData changes or when switching to diagram tab
    useEffect(() => {
        if (activeTab === 'diagram' || ontologyData) {
            generateMermaidDiagram();
        }
    }, [ontologyData, activeTab, generateMermaidDiagram]);

    // Initialize Mermaid when diagram content changes
    useEffect(() => {
        const renderDiagram = async () => {
            if (mermaidDiagram && diagramRef.current && activeTab === 'diagram') {
                try {
                    // Clear previous content
                    diagramRef.current.innerHTML = '';

                    // Initialize mermaid
                    mermaid.initialize({
                        startOnLoad: false,
                        theme: 'dark',
                        themeVariables: {
                            primaryColor: '#224444',
                            edgeLabelBackground: '#22557715',
                            secondaryColor: '#8888ff',
                            tertiaryColor: '#ddddff',
                            primaryTextColor: '#ffdddd',
                            secondaryTextColor: '#00ff00',
                            tertiaryTextColor: '#0000ff',
                            lineColor: '#dddddd',
                            background: '#ffffff',
                            nodeBorderRadius: '25px',
                            rough: false,
                        },
                        securityLevel: 'loose',
                    });

                    // Generate unique ID for this diagram
                    const diagramId = `mermaid-diagram-${Date.now()}`;

                    // Render the diagram
                    const { svg } = await mermaid.render(diagramId, mermaidDiagram);

                    // Insert the SVG into the container
                    diagramRef.current.innerHTML = svg;

                } catch (error) {
                    console.error('Error rendering Mermaid diagram:', error);
                    if (diagramRef.current) {
                        diagramRef.current.innerHTML = `<div class="p-4 text-center text-red-400">Error rendering diagram: ${error.message}</div>`;
                    }
                }
            }
        };

        if (activeTab === 'diagram') {
            renderDiagram();
        }
    }, [mermaidDiagram, activeTab]);

    const handleAuxClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button === 1) {
            setZoomMode((prev) => !prev);
            e.preventDefault();
        }
    };

    const renderMermaidDiagram = () => {
        if (mermaidDiagram) {
            return (
                <div
                    ref={diagramRef}
                    className="mermaid min-w-[1200px]"
                    style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: '0 0',
                        margin: '10px'
                    }}
                    onAuxClick={handleAuxClick}
                >
                    {mermaidDiagram}
                </div>
            );
        }
        return <div className="p-4 text-center text-gray-400">No diagram data available</div>;
    };

    return (
        <>
            <div className="p-1 w-100 rounded overflow-hidden">
                <div className="bg-gray-700 px-1">
                    <h3 className="flex pl-1 font-bold bg-gray-700 text-gray-00 inline-block">
                        Domain name: <span className="mx-1 px-1 inline-block bg-background">{ontologyData?.name}</span>
                    </h3>
                    <details>
                        <summary className="mx-1 text-gray-400 w-full cursor-pointer">Description...</summary>
                        <div className="mx-1 p-1 inline-block">{ontologyData?.description}</div>
                    </details>
                </div>
                <div className="">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-gray-700 m-1">
                        <TabsList className="mx-1 mb-0 bg-gray-700">
                            <TabsTrigger value="summary" className='pb-2 mt-3'>Ontology Summary</TabsTrigger>
                            <TabsTrigger value="concepts" className='pb-2 mt-3'>Concept List</TabsTrigger>
                            <TabsTrigger value="relationships" className='pb-2 mt-3'>Relationship List</TabsTrigger>
                            <TabsTrigger value="diagram" className='pb-2 mt-3'>Ontology Map</TabsTrigger>
                        </TabsList>

                        <TabsContent value="summary" className="flex p-1 m-0 rounded bg-background">
                            <Card className="p-1 w-full border-gray-700 h-[calc(100vh-25rem)]">
                                <CardContent>
                                    <div className="prose prose-sm bg-background p-2 divide-y divide-gray-600 max-h-[calc(100vh-26rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                        <ReactMarkdown>{ontologyData?.presentation}</ReactMarkdown>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="concepts" className="m-0 px-1 py-1 rounded bg-background">
                            <Card className="">
                                <CardHeader className="px-3 pt-3 pb-0">
                                    <CardTitle className="bg-background px-2 text-1xl rounded">Concepts</CardTitle>
                                </CardHeader>
                                <CardContent className="max-h-[calc(100vh-26rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                    {ontologyData && <ConceptTable data={ontologyData.concepts} />}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="relationships" className="m-0 px-1 py-1 rounded bg-background">
                            <Card className="mt-1">
                                <CardHeader className="px-3 pt-3 pb-0">
                                    <CardTitle className="bg-background px-2 text-1xl rounded">Relations</CardTitle>
                                </CardHeader>
                                <CardContent className="max-h-[calc(100vh-26rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                    {ontologyData && <RelshipTable data={ontologyData.relationships} />}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="diagram" className="m-0 px-1 rounded bg-background h-[calc(100vh-22rem)] overflow-hidden">
                            <>
                                <div className="flex justify-between items-center mx-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => generateMermaidDiagram()}
                                            className="px-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-700"
                                        >
                                            Regenerate Diagram
                                        </button>

                                        <button
                                            onClick={() => setZoomMode(prev => !prev)}
                                            className={`px-2 py-1 text-xs rounded ${isZoomMode
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-500 text-gray-200'}`}
                                        >
                                            {isZoomMode ? 'Zoom Mode: ON' : 'Zoom Mode: OFF'}
                                        </button>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="mr-2 text-xs">Zoom</span>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="2"
                                            step="0.1"
                                            value={zoom}
                                            onChange={(e) => setZoom(Number(e.target.value))}
                                            className="w-32"
                                        />
                                    </div>
                                </div>
                                <Card className="w-full my-1">
                                    <div
                                        ref={containerRef}
                                        className="h-[calc(100vh-24rem)] overflow-auto bg-gray-600 rounded border relative"
                                        style={{
                                            maxWidth: '100%',
                                            overflowX: 'auto',
                                        }}
                                    >
                                        <div className="text-xs text-gray-400 ml-2">
                                            {isZoomMode ? 'Use wheel to zoom' : 'Hold Shift+wheel for horizontal scrolling'}
                                        </div>
                                        <div className="min-w-max p-2">
                                            {renderMermaidDiagram()}
                                        </div>
                                    </div>
                                </Card>
                            </>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
};