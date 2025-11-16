import React, { useState, useEffect, useRef, useCallback } from 'react';
// import mermaid from 'mermaid';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from 'react-markdown';

import { ObjectTable } from "@/components/model-builder/object-table";
import { RelshipTable } from "@/components/model-builder/relship-table";
import { Model } from '@/features/model-universe/modelSlice';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { setFocusObjectIds, setFocusRelshipIds } from '@/features/model-universe/modelSlice';

const debug = false;
const EMPTY_STRING_ARRAY: string[] = [];

const normalizeMermaidSvg = (svg: string) => {
    if (!svg) return svg;

    const injectedStyles = `\n  <style>\n    .edgePath path {\n      stroke: #38bdf8 !important;\n      stroke-width: 2px !important;\n    }\n    .edgeLabel, .edgeLabel tspan {\n      fill: #f8fafc !important;\n      color: #f8fafc !important;\n      font-weight: 600;\n    }\n    .edgeLabel rect {\n      fill: rgba(15, 23, 42, 0.85) !important;\n      stroke: #38bdf8 !important;\n      stroke-width: 0.75px !important;\n      rx: 6px;\n      ry: 6px;\n    }\n    .node rect, .node polygon, .node circle, .node ellipse {\n      stroke: #3b82f6 !important;\n      stroke-width: 2px !important;\n      fill: rgba(15, 23, 42, 0.92) !important;\n    }\n    .node text {\n      fill: #f8fafc !important;\n      font-weight: 600;\n    }\n  </style>\n`;

    return svg.replace(/<svg([^>]*)>/, (_match, attrs) => {
        const cleanedAttrs = attrs
            .replace(/\swidth="[^"]*"/g, '')
            .replace(/\sheight="[^"]*"/g, '')
            .replace(/\sstyle="[^"]*"/g, '')
            .replace(/\spreserveAspectRatio="[^"]*"/g, '');

        return `<svg${cleanedAttrs} preserveAspectRatio="xMidYMid meet" style="display:block;height:auto;max-width:none;">${injectedStyles}`;
    });
};

interface ObjectCardProps {
    model: Model;
    showListTabs?: boolean;
    focusObjectIds?: string[];
    focusRelshipIds?: string[];
    filterToSelection?: boolean;
}

export const ObjectCard = ({
    model,
    showListTabs = true,
    focusObjectIds,
    focusRelshipIds,
    filterToSelection = false,
}: ObjectCardProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const storeFocusObjectIds = useSelector((state: RootState) => state.modelUniverse.phFocus.focusObjectIds ?? EMPTY_STRING_ARRAY);
    const storeFocusRelshipIds = useSelector((state: RootState) => state.modelUniverse.phFocus.focusRelshipIds ?? EMPTY_STRING_ARRAY);

    const effectiveFocusObjectIds = focusObjectIds ?? storeFocusObjectIds;
    const effectiveFocusRelshipIds = focusRelshipIds ?? storeFocusRelshipIds;
    const [mermaidDiagram, setMermaidDiagram] = useState('');
    const [renderedSvg, setRenderedSvg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState(showListTabs ? 'objects' : 'diagram');
    const [zoom, setZoom] = useState(1);
    const [isZoomMode, setZoomMode] = useState(false);
    const mermaidRef = useRef<any>(null);
    const [mermaidReady, setMermaidReady] = useState(false);
    const baseDiagramSizeRef = useRef<{ width: number; height: number } | null>(null);

    const focusObjectsSet = React.useMemo(() => new Set((effectiveFocusObjectIds || []).filter(Boolean)), [effectiveFocusObjectIds]);
    const focusRelshipsSet = React.useMemo(() => new Set((effectiveFocusRelshipIds || []).filter(Boolean)), [effectiveFocusRelshipIds]);

    const handleObjectSelectionChange = React.useCallback((ids: string[]) => {
        dispatch(setFocusObjectIds(ids || []));
    }, [dispatch]);

    const handleRelshipSelectionChange = React.useCallback((ids: string[]) => {
        dispatch(setFocusRelshipIds(ids || []));
    }, [dispatch]);

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
                setMermaidReady(true);
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
            const includeSelection = filterToSelection && (focusObjectsSet.size > 0 || focusRelshipsSet.size > 0);
            const objectIdsToShow = includeSelection ? new Set<string>() : null;
            if (includeSelection && focusObjectsSet.size > 0) {
                focusObjectsSet.forEach((id) => objectIdsToShow?.add(id));
            }

            const sanitizeNodeId = (input: string, fallback: number | string) => {
                const cleaned = input
                    .replace(/[^a-zA-Z0-9]/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '');
                return cleaned || `object_${fallback}`;
            };

            if (includeSelection && model.relships && model.relships.length > 0) {
                model.relships.forEach((rel) => {
                    if (!rel) return;
                    const isSelectedRel = focusRelshipsSet.has(rel.id);
                    const connectsFocusObject = focusObjectsSet.has(rel.fromobjectRef) || focusObjectsSet.has(rel.toobjectRef);
                    if (isSelectedRel || connectsFocusObject) {
                        objectIdsToShow?.add(rel.fromobjectRef);
                        objectIdsToShow?.add(rel.toobjectRef);
                    }
                });
            }

            let diagram = 'graph TD;\n';
            const validNodes = new Set<string>();
            const objectToNodeId = new Map<string, string>();
            const objectsForDiagram = includeSelection && objectIdsToShow
                ? model.objects.filter((object) => object && object.id && objectIdsToShow.has(object.id))
                : model.objects;

            objectsForDiagram.forEach((object, index) => {
                if (object && object.name && object.name.trim()) {
                    const nodeId = sanitizeNodeId(object.name, object.id || index);
                    objectToNodeId.set(object.id || `${index}`, nodeId);
                    const nodeName = object.name.replace(/"/g, "'");
                    const rawType = (object as any).typeName || (object as any).proposedType || '';
                    const typeLine = rawType ? `<br/>(${String(rawType).replace(/"/g, "'")})` : '';
                    diagram += `    ${nodeId}["${nodeName}${typeLine}"];\n`;
                    validNodes.add(nodeId);
                }
            });

            objectsForDiagram.forEach((object, index) => {
                if (object && object.name && object.name.trim()) {
                    const nodeId = sanitizeNodeId(object.name, object.id || index);
                    const highlight = focusObjectsSet.has(object.id);
                    diagram += `    style ${nodeId} fill:${highlight ? '#fb923c' : '#4CAF50'},stroke:${highlight ? '#b91c1c' : '#2E7D32'},stroke-width:2px,color:#fff;\n`;
                }
            });

            if (model.relships && model.relships.length > 0) {
                model.relships.forEach((rel, index) => {
                    if (!rel || !rel.nameFrom || !rel.nameTo || !rel.name) return;
                    const nodeIdFrom = objectToNodeId.get(rel.fromobjectRef) || sanitizeNodeId(rel.nameFrom, rel.fromobjectRef || `from_${index}`);
                    const nodeIdTo = objectToNodeId.get(rel.toobjectRef) || sanitizeNodeId(rel.nameTo, rel.toobjectRef || `to_${index}`);
                    const fromIncluded = validNodes.has(nodeIdFrom);
                    const toIncluded = validNodes.has(nodeIdTo);
                    if (!fromIncluded || !toIncluded) return;
                    const relationName = rel.name.replace(/"/g, "'");
                    diagram += `    ${nodeIdFrom} -->|"${relationName}"| ${nodeIdTo};\n`;
                });
            }

            setMermaidDiagram(diagram);
        } catch (error) {
            console.error('Error generating Mermaid diagram:', error);
            setMermaidDiagram('');
            setRenderedSvg('');
        }
    }, [model, focusObjectsSet, focusRelshipsSet, filterToSelection]);

    useEffect(() => {
        if (activeTab === 'diagram' || model) {
            generateMermaidDiagram();
        }
    }, [model, activeTab, generateMermaidDiagram]);

    useEffect(() => {
        setActiveTab(showListTabs ? 'objects' : 'diagram');
    }, [showListTabs]);

    useEffect(() => {
        const renderDiagram = async () => {
            if (!mermaidReady) {
                return;
            }
            if (mermaidDiagram && activeTab === 'diagram') {
                setIsLoading(true);
                try {
                    const diagramId = `mermaid-diagram-${Date.now()}`;
                    const mm = mermaidRef.current;
                    if (!mm) {
                        setIsLoading(false);
                        return;
                    }
                    const { svg } = await mm.render(diagramId, mermaidDiagram);
                    const themedSvg = svg
                        .replace(/fill:\s*#4CAF50/gi, 'fill:#0f172a')
                        .replace(/stroke:\s*#4CAF50/gi, 'stroke:#3b82f6');
                    baseDiagramSizeRef.current = null;
                    setRenderedSvg(normalizeMermaidSvg(themedSvg));
                    setZoom(1);
                } catch (error) {
                    console.error('Error rendering Mermaid diagram:', error);
                    setRenderedSvg(`<div class="p-4 text-center text-red-400">Error rendering diagram: ${error}</div>`);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        renderDiagram();
    }, [mermaidDiagram, activeTab, mermaidReady]);

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

    useEffect(() => {
        if (!isZoomMode) setZoom(1);
    }, [isZoomMode]);

    useEffect(() => {
        if (!renderedSvg) return;

        const raf = requestAnimationFrame(() => {
            const container = containerRef.current;
            if (!container) return;

            const svgElement = container.querySelector('svg');
            if (!svgElement) return;

            let baseSize = baseDiagramSizeRef.current;

            if (!baseSize) {
                try {
                    const bbox = svgElement.getBBox();
                    if (bbox?.width && bbox?.height) {
                        baseSize = { width: bbox.width, height: bbox.height };
                    }
                } catch {
                    /* noop */
                }

                if (!baseSize) {
                    const widthAttr = parseFloat(svgElement.getAttribute('width') || '0');
                    const heightAttr = parseFloat(svgElement.getAttribute('height') || '0');
                    if (widthAttr && heightAttr) {
                        baseSize = { width: widthAttr, height: heightAttr };
                    } else {
                        baseSize = {
                            width: svgElement.clientWidth || container.clientWidth,
                            height: svgElement.clientHeight || container.clientHeight,
                        };
                    }
                }

                if (baseSize) {
                    const containerWidth = container.clientWidth || baseSize.width;
                    const paddingAllowance = 32; // mirror padding on wrapper
                    const maxWidth = Math.max(containerWidth - paddingAllowance, 1);
                    const fitScale = baseSize.width > maxWidth ? maxWidth / baseSize.width : 1;
                    baseDiagramSizeRef.current = {
                        width: Math.max(baseSize.width * fitScale, 1),
                        height: Math.max(baseSize.height * fitScale, 1),
                    };
                    baseSize = baseDiagramSizeRef.current;
                }
            }

            if (baseSize) {
                const baseWidth = Math.max(baseSize.width, 1);
                const baseHeight = Math.max(baseSize.height, 1);
                const scaledWidth = Math.max(baseWidth * zoom, baseWidth);
                const scaledHeight = Math.max(baseHeight * zoom, baseHeight);

                const wrapper = svgElement.parentElement as HTMLElement | null;
                if (wrapper) {
                    wrapper.style.position = 'relative';
                    wrapper.style.width = `${baseWidth}px`;
                    wrapper.style.height = `${baseHeight}px`;
                    wrapper.style.maxWidth = '100%';
                    wrapper.style.maxHeight = 'none';
                    wrapper.style.display = 'block';
                }

                let placeholder: HTMLElement | null = null;
                if (wrapper) {
                    placeholder = wrapper.querySelector<HTMLElement>('[data-diagram-placeholder="true"]');
                    if (!placeholder) {
                        placeholder = document.createElement('div');
                        placeholder.dataset.diagramPlaceholder = 'true';
                        placeholder.style.position = 'absolute';
                        placeholder.style.top = '0';
                        placeholder.style.left = '0';
                        placeholder.style.pointerEvents = 'none';
                        placeholder.style.zIndex = '0';
                        wrapper.appendChild(placeholder);
                    }
                    placeholder.style.width = `${scaledWidth}px`;
                    placeholder.style.height = `${scaledHeight}px`;
                }

                svgElement.style.position = 'absolute';
                svgElement.style.top = '0';
                svgElement.style.left = '0';
                svgElement.style.width = `${scaledWidth}px`;
                svgElement.style.height = `${scaledHeight}px`;
                svgElement.style.maxWidth = 'none';
                svgElement.style.maxHeight = 'none';
                svgElement.style.transform = '';
                svgElement.style.transformOrigin = '';
                svgElement.style.zIndex = '1';
            }
        });

        return () => cancelAnimationFrame(raf);
    }, [renderedSvg, zoom]);

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
                    className="block"
                    style={{
                        margin: 0,
                        padding: '8px'
                    }}
                    onAuxClick={handleAuxClick}
                    dangerouslySetInnerHTML={{ __html: renderedSvg }}
                />
            );
        }

        return <div className="p-4 text-center text-gray-400">No diagram data available</div>;
    };

    const diagramPanel = (
        <div className="rounded w-full mt-0 min-w-0 overflow-hidden">
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
                                disabled={!isZoomMode}
                            />
                        </div>
                    </div>

                    {/* Scrollable container: allow horizontal scroll but don't let the element force parent width */}
                    <div
                        ref={containerRef}
                        className="w-full h-[calc(100vh-13rem)] overflow-auto bg-background rounded border relative min-w-0"
                        style={{
                            maxWidth: '100%',
                        }}
                    >
                        <div className="text-xs text-gray-400 ml-2 diagram-hint">
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
        </div>
    );

    if (!showListTabs) {
        return (
            <div className="w-full">
                {/* make the outer wrapper full width so the parent flex controls final sizing */}
                <div className="w-full h-[calc(100vh-10rem)] overflow-hidden bg-gray-800 rounded-md">
                    {diagramPanel}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* make the outer wrapper full width so the parent flex controls final sizing */}
            <div className="w-full h-[calc(100vh-10rem)] overflow-hidden bg-gray-800 rounded-md">
                <Tabs defaultValue="objects" value={activeTab} onValueChange={setActiveTab} className="flex flex-col mt-1 h-full">
                    <TabsList className="bg-transparent">
                        {showListTabs && (
                            <>
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
                            </>
                        )}
                        <TabsTrigger value="diagram" className="rounded-b-none data-[state=active]:bg-card data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-gray-300 data-[state=inactive]:text-gray-100 py-2 px-4 border-gray-400 relative z-20">
                            Preview Diagram
                        </TabsTrigger>
                    </TabsList>

                    {/* Add min-w-0 to each TabsContent so they can shrink inside flex containers */}
                    {showListTabs && (
                        <>
                            <TabsContent value="objects" className="rounded w-full mt-0 min-w-0">
                                <Card className="pt-1">
                                    <CardContent className="max-h-[calc(100vh-14rem)] overflow-hidden">
                                        {model && <ObjectTable modelId={model.id} data={model.objects.map(obj => ({ ...obj, typeId: obj.typeRef, typeName: obj.typeName || obj.proposedType || obj.typeRef || '' }))} onSelectionChange={handleObjectSelectionChange} />}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="relationships" className="rounded w-full mt-0 min-w-0">
                                <Card className="pt-1">
                                    <CardContent className="max-h-[calc(100vh-14rem)] overflow-hidden">
                                        {model && <RelshipTable modelId={model.id} data={model.relships.map(rel => ({ ...rel, description: '' }))} onSelectionChange={handleRelshipSelectionChange} />}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </>
                    )}

                    <TabsContent value="diagram" className="rounded w-full mt-0 min-w-0 overflow-hidden">
                        {diagramPanel}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};
