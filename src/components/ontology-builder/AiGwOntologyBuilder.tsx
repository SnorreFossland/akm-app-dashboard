'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import ModelSelector from '@/components/ai-chat/ModelSelector';
import { HelpCircle, X } from 'lucide-react';

type GenerateResponse = { [key: string]: any };

interface AiGwOntologyBuilderProps {
    startupGuide?: React.ReactNode;
    guide?: React.ReactNode;
}

export default function AiGwOntologyBuilder({ startupGuide, guide }: AiGwOntologyBuilderProps) {
    const [prompt, setPrompt] = useState<string>('Create an ontology for [your domain here]');
    const [model, setModel] = useState<string>('gpt-4o-mini');
    const [maxTokens, setMaxTokens] = useState<number>(800);
    const [loading, setLoading] = useState<boolean>(false);
    const [result, setResult] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const responsePanelRef = useRef<HTMLDivElement>(null);
    const buttonAccent = useMemo(() => 'px-2 py-1 bg-blue-900/50 hover:bg-blue-800 text-blue-300 text-xs rounded-md whitespace-nowrap', []);
    const [showGuide, setShowGuide] = useState(false);
    const [responseMaxHeight, setResponseMaxHeight] = useState<number | undefined>(undefined);
    const formRef = useRef<HTMLFormElement>(null);
    const [inputBarHeight, setInputBarHeight] = useState(0);
    const INPUT_BAR_OFFSET = -2; // pull the bar 2px further down

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
        } catch (err: any) {
            console.error(err);
            setError(err?.message ?? String(err));
        } finally {
            setLoading(false);
        }
    }

    function handleCopy() {
        if (!result) return;
        navigator.clipboard?.writeText(result);
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
            <div className="flex flex-col w-full h-full min-h-0 gap-2" style={{ paddingBottom: Math.max(0, inputBarHeight + INPUT_BAR_OFFSET) }}>
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

                {/* Top/output area */}
                <div ref={responsePanelRef} className="flex-1 min-h-0 rounded-lg bg-gray-800/20 p-2">
                    <div className="overflow-y-auto" style={{ maxHeight: responseMaxHeight }}>
                        {result ? (
                            <MarkdownPreview mdPreview={result} />
                        ) : startupGuide ? (
                            <div className="flex flex-col items-center justify-center w-full p-4 gap-4 text-gray-400 text-sm flex-1">
                                {startupGuide}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground p-4">
                                Describe the domain and press Generate to create an ontology.
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
                style={{ bottom: INPUT_BAR_OFFSET }}
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

                    {error && (
                        <div className="text-xs text-red-400">{error}</div>
                    )}
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
                        <button type="submit" disabled={loading} className={buttonAccent}>
                            {loading ? 'Generating…' : 'Generate Ontology'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setPrompt(''); setResult(''); setError(null); }}
                            className={buttonAccent}
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!result}
                            className={buttonAccent + (result ? '' : ' opacity-60')}
                        >
                            Copy Result
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
