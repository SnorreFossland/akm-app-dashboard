import React, { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from 'react-markdown';

import { ObjectTable } from "@/components/model-builder/object-table";
import { RelshipTable } from "@/components/model-builder/relship-table";
import { Model } from '@/features/model-universe/modelSlice';

const debug = false;

export const ObjectCard = ({ model }: { model: Model }) => {
    const diagramRef = useRef<HTMLDivElement>(null);
    const [mermaidDiagram, setMermaidDiagram] = useState('');
    const [renderedSvg, setRenderedSvg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState('objects');
    const [zoom, setZoom] = useState(1);
    const [isZoomMode, setZoomMode] = useState(false);

    // console.log('24 model:', model);

    // Initialize Mermaid once
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false, // Change to false
            theme: 'base',
            themeVariables: {
                primaryColor: '#97e499ff',
                edgeLabelBackground: '#21313c15',
                secondaryColor: '#8888ff',
                tertiaryColor: '#dddddd',
                primaryTextColor: '#ffffff',
                secondaryTextColor: '#ccffcc',
                tertiaryTextColor: '#0000ff',
                lineColor: '#dddddd',
                background: '#ffffff',
                nodeBorderRadius: '5px',
            },
            securityLevel: 'loose',
        });
    }, []);

    // Memoize the diagram generation to prevent infinite loops
    const generateMermaidDiagram = useCallback(() => {
        if (!model || !model.objects || model.objects.length === 0) {
            setMermaidDiagram('');
            setRenderedSvg('');
            return;
        }

        try {
            let diagram = 'graph TD;\n';
            const validNodes = new Set();
            // Add objects as nodes with better sanitization
            model.objects.forEach((object, index) => {
                if (object && object.name && object.name.trim()) {
                    const nodeId = object.name
                        .replace(/[^a-zA-Z0-9]/g, '_')
                        .replace(/_+/g, '_')
                        .replace(/^_|_$/g, '') || `object_${index}`;
                    const nodeName = object.name.replace(/"/g, "'");
                    diagram += `    ${nodeId}["${nodeName}"];\n`;
                    validNodes.add(object.name);
                }
            });

            // Add explicit styling for all nodes
            model.objects.forEach((object, index) => {
                if (object && object.name && object.name.trim()) {
                    const nodeId = object.name
                        .replace(/[^a-zA-Z0-9]/g, '_')
                        .replace(/_+/g, '_')
                        .replace(/^_|_$/g, '') || `object_${index}`;

                    // Add CSS styling for each node
                    diagram += `    style ${nodeId} fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff;\n`;
                }
            });

            // Add relationships as edges only for valid nodes
            if (model.relships && model.relships.length > 0) {
                model.relships.forEach((rel, index) => {
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

                        const relationName = rel.name.replace(/"/g, "'");
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
    }, [model]);

    // Generate diagram when model changes or when switching to diagram tab
    useEffect(() => {
        if (activeTab === 'diagram' || model) {
            generateMermaidDiagram();
        }
    }, [model, activeTab, generateMermaidDiagram]);

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
        <div className="w-full">
            <div className="w-full h-[calc(100vh-10rem)] overflow-hidden bg-gray-800 rounded-md">
                    <Tabs defaultValue="objects" value={activeTab} onValueChange={setActiveTab} className="flex flex-col mt-1 h-full">
                    <TabsList className="bg-transparent">
                        <TabsTrigger
                            value="objects"
                            className="rounded-b-none mt-0 data-[state=active]:bg-card data-[state=active]:text-white data-[state=active]:font-semibold  data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-gray-300 data-[state=inactive]:text-gray-100 py-2 px-4 border-gray-400 relative z-20"
                        >
                            Object List
                        </TabsTrigger>
                        <TabsTrigger
                            value="relationships"
                            className="rounded-b-none data-[state=active]:bg-card data-[state=active]:text-white data-[state=active]:font-semibold  data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-gray-300 data-[state=inactive]:text-gray-100 py-2 px-4 border-gray-400 relative z-20"
                        >
                            Relationship List
                        </TabsTrigger>
                        <TabsTrigger value="diagram" className="rounded-b-none data-[state=active]:bg-card data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-gray-300 data-[state=inactive]:text-gray-100 py-2 px-4 border-gray-400 relative z-20">
                            Preview Diagram
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="objects" className="rounded  w-full mt-0 ">
                        <Card className="pt-1">
                            <CardContent className="max-h-[calc(100vh-14rem)] overflow-hidden">
                                {/* <CardContent className="max-h-[calc(100vh-9rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800"> */}
                                {model && <ObjectTable data={model.objects.map(obj => ({ ...obj, typeId: obj.typeRef, typeName: obj.typeName || obj.proposedType || obj.typeRef || '' }))} />}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="relationships" className="rounded  w-full mt-0 ">
                        <Card className="pt-1">
                            <CardContent className="max-h-[calc(100vh-14rem)] overflow-hidden">
                                {model && <RelshipTable data={model.relships.map(rel => ({ ...rel, description: '' }))} />}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="diagram" className="rounded  w-full mt-0 ">
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
        </div >
    );
};