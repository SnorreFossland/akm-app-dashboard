'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import ModelSelector from '@/components/ai-chat/ModelSelector';
import { HelpCircle, X } from 'lucide-react';
import { SystemPrompt, SystemBehaviorGuidelines, UserPrompt } from '@/app/ontology-builder/prompts';

type GenerateResponse = { [key: string]: any };

interface OntologyConcept { name: string; description: string }
interface OntologyRelship { name: string; nameFrom: string; nameTo: string; description?: string }
interface OntologyData { name: string; description: string; presentation?: string; concepts: OntologyConcept[]; relationships: OntologyRelship[] }

interface AiGwOntologyBuilderProps {
    startupGuide?: React.ReactNode;
    guide?: React.ReactNode;
    setSuggestedOntologyData?: (data: OntologyData | null) => void;
    onImplementSuggestedOntology?: () => void;
}

export default function AiGwOntologyBuilder({ startupGuide, guide, setSuggestedOntologyData, onImplementSuggestedOntology }: AiGwOntologyBuilderProps) {
    const [prompt, setPrompt] = useState<string>('Create an ontology for [your domain here]');
    const [model, setModel] = useState<string>('gpt-4o-mini');
    const [maxTokens, setMaxTokens] = useState<number>(800);
    const [loading, setLoading] = useState<boolean>(false);
    const [result, setResult] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [building, setBuilding] = useState<boolean>(false);
    const [buildError, setBuildError] = useState<string | null>(null);
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const responsePanelRef = useRef<HTMLDivElement>(null);
    const buttonAccent = useMemo(() => 'px-2 py-1 bg-blue-900/50 hover:bg-blue-800 text-blue-300 text-xs rounded-md whitespace-nowrap', []);
    const [showGuide, setShowGuide] = useState(false);
    const [responseMaxHeight, setResponseMaxHeight] = useState<number | undefined>(undefined);
    const formRef = useRef<HTMLFormElement>(null);
    const [inputBarHeight, setInputBarHeight] = useState(0);
    const INPUT_BAR_OFFSET = 0; // offset in px; we also account for env(safe-area-inset-bottom) below
    const EXTRA_BOTTOM_GAP = 20; // extra px to ensure the bar is visually separated from the window edge

    // Dynamically reserve exactly the input bar height at the bottom of the scroll area
    useEffect(() => {
        if (!formRef.current) return;
        const el = formRef.current;
        const update = () => setInputBarHeight(el.offsetHeight || 0);
        update();

        // Observe size changes of the input bar
        const ro = new ResizeObserver(update);
        ro.observe(el);

        // Recalculate on window resize too
        window.addEventListener('resize', update);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', update);
        };
    }, []);

    // Keep the output area scrollable within the viewport height
    useEffect(() => {
        const recalc = () => {
            if (!responsePanelRef.current) return;
            const rect = responsePanelRef.current.getBoundingClientRect();
            const avail = window.innerHeight - rect.top - inputBarHeight - Math.max(0, -INPUT_BAR_OFFSET);
            setResponseMaxHeight(Math.max(120, avail));
        };
        recalc();

        const ro = new ResizeObserver(recalc);
        if (containerRef.current) ro.observe(containerRef.current);
        if (responsePanelRef.current) ro.observe(responsePanelRef.current);

        window.addEventListener('resize', recalc);
        window.addEventListener('scroll', recalc, true);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', recalc);
            window.removeEventListener('scroll', recalc, true);
        };
    }, [inputBarHeight, showGuide]);

    async function handleGenerate(e?: React.FormEvent) {
        e?.preventDefault();
        setLoading(true);
        setError(null);
        setResult('');

        try {
            // Nice readable console output for debugging the generation input
            console.groupCollapsed('[AiGwOntologyBuilder] Generating ontology');
            console.log('Model:', model);
            console.log('Max tokens:', maxTokens);
            console.log('Prompt:', prompt);
            console.groupEnd();
            // Add the user's prompt to the dialog
            setMessages(prev => [...prev, { role: 'user', content: prompt }]);

            const resp = await fetch('/api/vercel-ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, model, max_tokens: maxTokens }),
            });

            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`Server returned ${resp.status}: ${text}`);
            }

            const json: GenerateResponse = await resp.json();

            let outputText = '';
            if (json.output && Array.isArray(json.output)) {
                outputText = json.output.map((o: any) => (o.content ?? o.text ?? JSON.stringify(o))).join('\n\n');
            } else if (json.choices && Array.isArray(json.choices)) {
                outputText = json.choices.map((c: any) => c.text ?? c.message?.content ?? JSON.stringify(c)).join('\n\n');
            } else if (typeof json.text === 'string') {
                outputText = json.text;
            } else {
                outputText = JSON.stringify(json, null, 2);
            }

            setResult(outputText);
            // Append assistant reply to dialog
            setMessages(prev => [...prev, { role: 'assistant', content: outputText }]);
        } catch (err: any) {
            console.error(err);
            setError(err?.message ?? String(err));
        } finally {
            setLoading(false);
        }
    }

    // Map chat model to genmodel's supported aiModelName
    function mapModelForGenmodel(m: string): string {
        const lower = m.toLowerCase();
        if (lower.startsWith('deepseek')) return lower as any; // deepseek-chat, deepseek-r1
        if (lower.includes('mistral')) return 'mistral-small-latest';
        if (lower === 'dummy') return 'dummy';
        return 'gpt-4o'; // safe default supported by genmodel route
    }

    async function handleOntologyBuilderFromResult(text: string) {
        if (!text || !setSuggestedOntologyData) return;
        setBuilding(true);
        setBuildError(null);


        try {
            // Log the payload being sent to the genmodel endpoint for easier debugging
            console.groupCollapsed('153 [AiGwOntologyBuilder] Sending to /api/genmodel');
            console.log('aiModelName:', mapModelForGenmodel(model));
            console.log('schemaName: OntologySchema');
            console.log('systemPrompt:', SystemPrompt);
            console.log('systemBehaviorGuidelines:', SystemBehaviorGuidelines);
            console.log('userPrompt:', UserPrompt);
            console.log('userInput:', text);
            console.groupEnd();

            const res = await fetch('/api/genmodel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    aiModelName: mapModelForGenmodel(model),
                    schemaName: 'OntologySchema',
                    systemPrompt: SystemPrompt,
                    systemBehaviorGuidelines: SystemBehaviorGuidelines,
                    userPrompt: UserPrompt,
                    userInput: text,
                    contextItems: '',
                    contextOntology: '',
                    contextMetamodel: ''
                })
            });

            if (!res.ok) {
                const t = await res.text();
                throw new Error(`genmodel ${res.status}: ${t}`);
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error('No reader available');
            const decoder = new TextDecoder();
            let buf = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
            }
            const parsed = JSON.parse(buf);
            const onto = parsed?.ontologyData;
            if (onto && Array.isArray(onto.concepts) && Array.isArray(onto.relationships)) {
                setSuggestedOntologyData(onto);
            } else {
                throw new Error('No ontologyData in response');
            }
        } catch (e: any) {
            console.error('Ontology build failed:', e);
            setBuildError(e?.message ?? String(e));
        } finally {
            setBuilding(false);
        }
    }

    // Auto-build suggested ontology whenever a new result arrives
    // useEffect(() => {
    //     if (result && setSuggestedOntologyData) {
    //         handleOntologyBuilderFromResult(result);
    //     }
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [result]);

    function handleCopy() {
        const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
        const textToCopy = lastAssistant?.content || result;
        if (!textToCopy) return;
        navigator.clipboard?.writeText(textToCopy);
    }

    return (
        <div ref={containerRef} className="relative flex w-full h-full min-h-0">
            {/* Optional Guide Sidebar */}
            {showGuide && (
                <div className="flex flex-col items-center justify-between mt-1 mb-2 me-2 px-1 border border-yellow-800 rounded-lg w-80 h-full flex-shrink-0">
                    <div className="flex items-center justify-between w-full px-1">
                        <div className="text-lg font-semibold text-orange-500/60">Guide</div>
                        <button
                            onClick={() => setShowGuide(false)}
                            className="text-gray-400 hover:text-white"
                            title="Close Guide"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex-1 max-h-[calc(100vh-22rem)] overflow-y-auto p-1 bg-yellow-900/60 w-full">
                        {guide}
                    </div>
                </div>
            )}

            {/* Main Column */}
            <div
                className="flex flex-col w-full h-full min-h-0 gap-2"
                // Reserve the measured input bar height plus the platform safe-area inset so the bar isn't overlapped
                style={{ paddingBottom: `calc(${Math.max(0, inputBarHeight + INPUT_BAR_OFFSET)}px + env(safe-area-inset-bottom))` }}
            >
                <div className="flex items-center gap-2">
                    {!showGuide && (
                        <button
                            onClick={() => setShowGuide(true)}
                            className="text-gray-400 hover:text-blue-400 hover:bg-gray-800 pt-1 rounded-md"
                            title="Show Guide"
                            type="button"
                        >
                            <HelpCircle className="bg-yellow-700 text-white rounded h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Top/output area with simple user–assistant dialog */}
                <div ref={responsePanelRef} className="flex-1 min-h-0 rounded-lg bg-gray-800/20 p-2">
                    <div id="ai-gw-ob-dialog" className="overflow-y-auto" style={{ maxHeight: responseMaxHeight }}>
                        {messages.length > 0 ? (
                            <div className="p-1">
                                {(() => {
                                    const lastAssistantIdx = (() => {
                                        for (let i = messages.length - 1; i >= 0; i--) {
                                            if (messages[i].role === 'assistant') return i;
                                        }
                                        return -1;
                                    })();
                                    return messages.map((m, idx) => (
                                        <div
                                            key={idx}
                                            className={
                                                `mb-3 p-3 rounded-lg border ` +
                                                (m.role === 'user'
                                                    ? 'bg-card border-blue-900 ms-auto max-w-[80%]'
                                                    : 'bg-secondary border-secondary me-auto w-full')
                                            }
                                        >
                                            <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                                                <span>{m.role === 'user' ? 'You' : `Assistant (${model})`}</span>
                                            </div>
                                            {m.role === 'assistant' ? (
                                                <MarkdownPreview mdPreview={m.content} />
                                            ) : (
                                                <div className="whitespace-pre-wrap break-words">
                                                    {m.content}
                                                </div>
                                            )}
                                            {m.role === 'assistant' && idx === lastAssistantIdx && (
                                                <div className="flex items-center gap-2 mt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOntologyBuilderFromResult(m.content)}
                                                        disabled={building}
                                                        className={buttonAccent}
                                                    >
                                                        {building ? 'Building…' : 'Update Suggested Ontology'}
                                                    </button>
                                                    {onImplementSuggestedOntology && (
                                                        <button
                                                            type="button"
                                                            onClick={onImplementSuggestedOntology}
                                                            className={buttonAccent}
                                                        >
                                                            Implement Changes
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ));
                                })()}
                            </div>
                        ) : result ? (
                            <MarkdownPreview mdPreview={result} />
                        ) : startupGuide ? (
                            <div className="flex flex-col items-center justify-center w-full p-4 gap-4 text-gray-400 text-sm flex-1">
                                {startupGuide}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground p-4">
                                Describe the domain and press Ask Assistant to create an ontology.
                            </div>
                        )}
                    </div>
                </div>

            </div>
            {/* Absolute bottom bar spanning the full width, independent of guide */}
            <form
                ref={formRef}
                onSubmit={handleGenerate}
                className="absolute inset-x-0 z-10 pt-1 px-2 bg-popover/95 backdrop-blur border-t border-secondary rounded-t-lg"
                // Place the bar above the OS/browser safe area (e.g. iPhone notch / macOS safe inset)
                style={{ bottom: `calc(${INPUT_BAR_OFFSET}px + env(safe-area-inset-bottom) + ${EXTRA_BOTTOM_GAP}px)` }}
            >
                {/* Controls row */}
                <div className="flex flex-wrap items-center gap-3 mb-2">
                    <ModelSelector
                        selectedModel={model as any}
                        onModelChange={(m) => setModel(m)}
                    />
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">Max tokens</label>
                        <input
                            type="number"
                            value={maxTokens}
                            onChange={(e) => setMaxTokens(Number(e.target.value))}
                            className="py-1 px-2 text-sm text-muted-foreground bg-secondary/50 border border-secondary rounded-md w-24"
                            min={1}
                            max={4000}
                        />
                    </div>

                    {error && <div className="text-xs text-red-400">{error}</div>}
                    {building && <div className="text-xs text-blue-400">Building suggested ontology…</div>}
                    {buildError && <div className="text-xs text-red-400">{buildError}</div>}
                </div>

                {/* Prompt input */}
                <TextareaAutosize
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    minRows={3}
                    maxRows={10}
                    className="w-full resize-none bg-transparent text-sm text-primary placeholder:text-muted-foreground focus:outline-none"
                    placeholder="Describe the ontology you want to generate..."
                />

                {/* Action buttons */}
                <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">


                        {setSuggestedOntologyData && (
                            <button
                                type="button"
                                onClick={() => handleOntologyBuilderFromResult((messages.slice().reverse().find(m => m.role === 'assistant')?.content) || result || prompt)}
                                disabled={building}
                                className={buttonAccent}
                            >
                                {building ? 'Building…' : 'Update Suggested Ontology'}
                            </button>
                        )}
                        {onImplementSuggestedOntology && (
                            <button
                                type="button"
                                onClick={onImplementSuggestedOntology}
                                className={buttonAccent}
                            >
                                Implement Changes
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => { setPrompt(''); setResult(''); setError(null); setMessages([]); }}
                            className={buttonAccent}
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!result && !messages.some(m => m.role === 'assistant')}
                            className={
                                buttonAccent + ((result || messages.some(m => m.role === 'assistant')) ? '' : ' opacity-60')
                            }
                        >
                            Copy Assistant
                        </button>
                        <button
                            type="submit"
                            className="flex items-center bg-gray-800 rounded-full px-2 mb-1 text-blue-300 hover:text-blue-800"
                            disabled={loading}
                            title="Send your question"
                        >
                            {loading ? 'Working…' : 'Ask Assistant'}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                                className="w-8 h-8"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 17V7m0 0l-5 5m5-5l5 5" />
                            </svg>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
