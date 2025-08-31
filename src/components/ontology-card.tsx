import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { columns } from "@/components/ontology-builder/concept-columns";
import { ConceptTable } from "@/components/ontology-builder/concept-table";
import { RelshipTable } from "@/components/ontology-builder/relship-table";
import { ColumnDef } from "@tanstack/react-table";
import ReactMarkdown from 'react-markdown';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import 'tailwindcss/tailwind.css';

interface OntologyCardProps {
    ontologyData: {
        name: string;
        description: string;
        concepts: Concept[];
        relationships: Relationship[];
        presentation: string;
    } | null;
    domainData?: {
        name: string;   
        description: string;
        presentation: string;
        prompt: string;
    }
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
    const pathname = usePathname();
    const [mermaidDiagram, setMermaidDiagram] = useState('');
    const [renderedSvg, setRenderedSvg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState('domain-ontology');
    const [zoom, setZoom] = useState(1);
    const [isZoomMode, setZoomMode] = useState(false);

    if (debug) console.log('35 ontology-card', ontologyData);

    // Initialize Mermaid once
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            themeVariables: {
                primaryColor: '#808080',
                edgeLabelBackground: '#21313c15',
                secondaryColor: '#8888ff',
                tertiaryColor: '#ddddff',
                primaryTextColor: '#ffeeee',
                secondaryTextColor: '#ccffcc',
                tertiaryTextColor: '#0000ff',
                lineColor: '#f0f0f0',
                background: '#ffffff',
                nodeBorderRadius: '25px',
                rough: true,
            },
            securityLevel: 'loose',
        });
    }, []);

    // Memoize the diagram generation to prevent infinite loops
    const generateMermaidDiagram = useCallback(() => {
        if (!ontologyData) {
            setMermaidDiagram('');
            setRenderedSvg('');
            return;
        }

        try {
            let diagram = 'graph TD;\n';
            const allNodes = new Set<string>();

            // Gather all nodes from concepts and relationships
            if (ontologyData.concepts) {
                ontologyData.concepts.forEach(c => c && c.name && allNodes.add(c.name));
            }
            if (ontologyData.relationships) {
                ontologyData.relationships.forEach(r => {
                    if (r && r.nameFrom) allNodes.add(r.nameFrom);
                    if (r && r.nameTo) allNodes.add(r.nameTo);
                });
            }

            if (allNodes.size === 0) {
                setMermaidDiagram('');
                setRenderedSvg('');
                return;
            }

            // Add all unique concepts as nodes
            allNodes.forEach((nodeName) => {
                if (nodeName && nodeName.trim()) {
                    const nodeId = nodeName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
                    const escapedNodeName = nodeName.replace(/"/g, "'");
                    diagram += `    ${nodeId}["${escapedNodeName}"];\n`;
                }
            });

            // Add relationships as edges
            if (ontologyData.relationships && ontologyData.relationships.length > 0) {
                ontologyData.relationships.forEach((rel, index) => {
                    if (rel && rel.nameFrom && rel.nameTo && rel.name) {
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

            // console.log('Generated Mermaid diagram:', diagram);
            setMermaidDiagram(diagram);

        } catch (error) {
            console.error('Error generating Mermaid diagram:', error);
            setMermaidDiagram('');
            setRenderedSvg('');
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

    // Render the diagram when mermaidDiagram changes
    useEffect(() => {
        const renderDiagram = async () => {
            if (mermaidDiagram && activeTab === 'diagram') {
                setIsLoading(true);
                try {
                    // Generate unique ID for this diagram
                    const diagramId = `mermaid-diagram-${Date.now()}`;

                    // Render the diagram
                    const { svg } = await mermaid.render(diagramId, mermaidDiagram);

                    // Store the rendered SVG
                    setRenderedSvg(svg);
                    console.log('Mermaid diagram rendered successfully');

                } catch (error) {
                    console.error('Error rendering Mermaid diagram:', error);
                    setRenderedSvg(`<div class="p-4 text-center text-red-400">Error rendering diagram: ${error}</div>`);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        renderDiagram();
    }, [mermaidDiagram, activeTab]);

    const handleAuxClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button === 1) {
            setZoomMode((prev) => !prev);
            e.preventDefault();
        }
    };

    const renderMermaidDiagram = () => {
        if (isLoading) {
            return <div className="p-4 text-center text-gray-400">Loading diagram...</div>;
        }

        if (renderedSvg) {
            return (
                <div
                    className="min-w-[1200px] w-full"
                    style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: '0 0',
                        margin: '10px'
                    }}
                    onAuxClick={handleAuxClick}
                    dangerouslySetInnerHTML={{ __html: renderedSvg }}
                />
            );
        }

        return <div className="p-4 text-center text-gray-400">No diagram data available</div>;
    };

    return (
        <div className="w-full h-full overflow-hidden bg-gray-800 rounded-lg shadow-lg">
            {/* <pre className="text-xs bg-gray-900 text-white p-2 rounded m-2 overflow-auto max-h-40">
                {JSON.stringify(ontologyData, null, 2)}
            </pre> */}
            <Tabs value={activeTab} defaultValue='domain-ontology' onValueChange={setActiveTab} className=" p-1">
                <TabsList className="grid grid-cols-4 bg-primary-foreground my-0 h-7 flex-1 mx-2 relative z-1">
                    {pathname === '/model-builder' && (
                        <TabsTrigger
                            value="domain-summary"
                            className="ml-1 rounded-b-none data-[state=active]:bg-card data-[state=active]:text-white data-[state=active]:font-semibold  data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-gray-300 data-[state=inactive]:text-gray-100 px-4 border-gray-400"
                        >
                            Domain
                        </TabsTrigger>
                    )}
                    <TabsTrigger
                        value="domain-ontology"
                        className="ml-1 rounded-b-none data-[state=active]:bg-card data-[state=active]:text-white data-[state=active]:font-semibold  data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-gray-300 data-[state=inactive]:text-gray-100  px-4 border-gray-400"
                    >
                        Presentation
                    </TabsTrigger>
                    <TabsTrigger
                        value="concepts"
                        className="ml-1 rounded-b-none data-[state=active]:bg-card data-[state=active]:text-white data-[state=active]:font-semibold  data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-gray-300 data-[state=inactive]:text-gray-100  px-4 border-gray-400"
                    >
                        Concepts
                    </TabsTrigger>
                    <TabsTrigger
                        value="relationships"
                        className="ml-1 rounded-b-none data-[state=active]:bg-card data-[state=active]:text-white data-[state=active]:font-semibold  data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-gray-300 data-[state=inactive]:text-gray-100  px-4 border-gray-400"
                    >
                        Relships
                    </TabsTrigger>
                    <TabsTrigger
                        value="diagram"
                        className="ml-1 rounded-b-none data-[state=active]:bg-card data-[state=active]:text-white data-[state=active]:font-semibold  data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-gray-300 data-[state=inactive]:text-gray-100  px-4 border-gray-400"
                    >
                        Map
                    </TabsTrigger>
                </TabsList>

                {pathname === '/model-builder' && (
                    <TabsContent value="domain-summary" className="m-0 px-1 py-2 rounded bg-card text-gray-200 text-xs">
                        <div className="m-1 py-1 rounded">
                            <div className="">
                                <div className="max-h-[calc(100vh-40rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                    <div className="flex flex-wrap">
                                        <div className="px-2 col text-left mb-4 w-full">
                                            <div className="border border-gray-600 p-2">
                                                <h5 className="text-gray-400 font-bold">Name</h5>
                                                <input
                                                    type="text"
                                                    defaultValue={ontologyData?.name}
                                                    className="font-bold whitespace-nowrap bg-background p-1 border border-gray-500 rounded w-full"
                                                />
                                                <h5 className="text-gray-400 p-1 font-bold">Description</h5>
                                                <textarea
                                                    defaultValue={ontologyData?.description}
                                                    className="bg-background p-1 border border-gray-500 rounded w-full resize-vertical"
                                                    rows={15}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                )}
                <TabsContent value="domain-ontology" className="rounded w-full mt-0 ">
                    <Card className="pt-1">
                        <CardContent className="max-h-[calc(100vh-4rem)] overflow-hidden">
                            <div className=" px-1">
                                <h3 className="flex p-1 font-bold  text-gray-200 inline-block">
                                    Ontology name: <span className="mx-1 px-1 inline-block">{ontologyData?.name}</span>
                                </h3>
                                {/* <details>
                                    <summary className="mx-1 text-gray-400 w-full cursor-pointer">Description...</summary>
                                    <div className="mx-1 p-1 inline-block">{ontologyData?.description}</div>
                                </details> */}
                            </div>
                            <div className="prose prose-sm bg-gray-800 mt-2 p-1 divide-y-3 divide-gray-900 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                <h4 className="px-1 bg-gray-700">Ontology Presentation</h4>
                                <div className="p-1 text-sm text-gray-400 bg-background rounded">
                                    <MarkdownPreview mdPreview={ontologyData?.presentation ?? ''} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="concepts" className=" mt-0 rounded bg-background">
                    <Card className="pt-1">
                        <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                            {ontologyData && <ConceptTable data={ontologyData.concepts} />}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="relationships" className="mt-0 rounded bg-background">
                    <Card className="pt-1">
                        <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                            {ontologyData && <RelshipTable data={ontologyData.relationships} />}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="diagram" className="m-0 px-1 rounded bg-card h-[calc(100vh-10rem)] overflow-hidden">
                    <Card className="w-full h-full">
                        <CardContent className="">
                            <div className="flex justify-between items-center m-1 py-1">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => generateMermaidDiagram()}
                                        className="px-1 bg-blue-700 text-white text-xs rounded hover:bg-blue-500"
                                    >
                                        Regenerate Diagram
                                    </button>

                                    <button
                                        onClick={() => setZoomMode(prev => !prev)}
                                        className={`px-1 text-xs rounded hover:bg-gray-400 ${isZoomMode
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
                            <div
                                ref={containerRef}
                                className="h-[calc(100vh-13rem)] overflow-auto bg-background rounded border relative"
                                style={{
                                    maxWidth: '100%',
                                    overflowX: 'auto',
                                }}
                            >
                                <div className="text-xs text-gray-400 ml-2">
                                    {isZoomMode ? 'Use wheel to zoom' : 'Hold Shift+wheel for horizontal scrolling'}
                                </div>
                                <div className="min-w-max p-2 w-full">
                                    {renderMermaidDiagram()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>

    );
};