import React, { useState, useEffect, useRef, useCallback } from 'react';
// import mermaid from 'mermaid';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from 'react-markdown';

import { ObjectTable } from "@/components/model-builder/object-table";
import { RelshipTable } from "@/components/model-builder/relship-table";
import { Model } from '@/features/model-universe/modelSlice';

const debug = false;

export const ObjectCard = ({ model }: { model: Model }) => {
    const [mermaidDiagram, setMermaidDiagram] = useState('');
    const [renderedSvg, setRenderedSvg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState('objects');
    const [zoom, setZoom] = useState(1);
    const [isZoomMode, setZoomMode] = useState(false);
    const mermaidRef = useRef<any>(null);

    // Initialize Mermaid once
    useEffect(() => {
        if (typeof window === 'undefined') return;

        (async () => {
            try {
                const mm = await import('mermaid');
                mermaidRef.current = mm.default || mm;
                mermaidRef.current.initialize({
                    startOnLoad: false,
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
            } catch (error) {
                console.error('Error initializing Mermaid:', error);
            }
        })();
    }, []);

    const generateMermaidDiagram = useCallback(() => {
        if (!model || !model.objects || model.objects.length === 0) {
            setMermaidDiagram('');
            setRenderedSvg('');
            return;
        }

        try {
            let diagram = 'graph TD;\n';
            const validNodes = new Set();
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

            model.objects.forEach((object, index) => {
                if (object && object.name && object.name.trim()) {
                    const nodeId = object.name
                        .replace(/[^a-zA-Z0-9]/g, '_')
                        .replace(/_+/g, '_')
                        .replace(/^_|_$/g, '') || `object_${index}`;

                    diagram += `    style ${nodeId} fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff;\n`;
                }
            });

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

            setMermaidDiagram(diagram);
        } catch (error) {
            console.error('Error generating Mermaid diagram:', error);
            setMermaidDiagram('');
            setRenderedSvg('');
        }
    }, [model]);

    useEffect(() => {
        if (activeTab === 'diagram' || model) {
            generateMermaidDiagram();
        }
    }, [model, activeTab, generateMermaidDiagram]);

    useEffect(() => {
        const renderDiagram = async () => {
            if (mermaidDiagram && activeTab === 'diagram') {
                setIsLoading(true);
                try {
                    const diagramId = `mermaid-diagram-${Date.now()}`;
                    const mm = mermaidRef.current;
                    if (!mm) {
                        console.warn('Mermaid not yet loaded; delaying render');
                        setIsLoading(false);
                        return;
                    }
                    const { svg } = await mm.render(diagramId, mermaidDiagram);
                    setRenderedSvg(svg);
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
            // remove forced min width. make this an inline-block so it can be scrolled horizontally inside the container
            return (
                <div
                    className="inline-block min-w-0"
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
            {/* make the outer wrapper full width so the parent flex controls final sizing */}
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

                    {/* Add min-w-0 to each TabsContent so they can shrink inside flex containers */}
                    <TabsContent value="objects" className="rounded w-full mt-0 min-w-0">
                        <Card className="pt-1">
                            <CardContent className="max-h-[calc(100vh-14rem)] overflow-hidden">
                                {model && <ObjectTable modelId={model.id} data={model.objects.map(obj => ({ ...obj, typeId: obj.typeRef, typeName: obj.typeName || obj.proposedType || obj.typeRef || '' }))} />}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="relationships" className="rounded w-full mt-0 min-w-0">
                        <Card className="pt-1">
                            <CardContent className="max-h-[calc(100vh-14rem)] overflow-hidden">
                                {model && <RelshipTable modelId={model.id} data={model.relships.map(rel => ({ ...rel, description: '' }))} />}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="diagram" className="rounded w-full mt-0 min-w-0">
                        <Card className="w-full h-full">
                            <CardContent className="p-0">
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

                                {/* Scrollable container: allow horizontal scroll but don't let the element force parent width */}
                                <div
                                    ref={containerRef}
                                    className="h-[calc(100vh-13rem)] overflow-auto bg-background rounded border relative min-w-0"
                                    style={{
                                        maxWidth: '100%',
                                    }}
                                >
                                    <div className="text-xs text-gray-400 ml-2">
                                        {isZoomMode ? 'Use wheel to zoom' : 'Hold Shift+wheel for horizontal scrolling'}
                                    </div>

                                    {/* inner wrapper should NOT force min-width; keep it flexible so the parent flex can shrink.
                                        We render the SVG as an inline-block so it can be scrolled horizontally if it's wide. */}
                                    <div className="w-full min-w-0 p-2">
                                        {renderMermaidDiagram()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};