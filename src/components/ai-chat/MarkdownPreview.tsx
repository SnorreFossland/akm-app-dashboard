'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';

interface MarkdownPreviewProps {
    mdPreview: string;
    variant?: 'default' | 'compact';
}

// Sanitize markdown content to prevent invalid HTML tags
function sanitizeMarkdown(content: string): string {
    if (!content) return '';

    // Remove or escape common problematic patterns
    return content
        // Remove XML/HTML-like tags that aren't valid HTML (like <rowid>)
        .replace(/<([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tagName) => {
            // List of valid HTML tags we want to keep
            const validTags = ['a', 'abbr', 'b', 'blockquote', 'br', 'code', 'dd', 'del', 'div', 'dl', 'dt', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'ins', 'kbd', 'li', 'ol', 'p', 'pre', 'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul'];

            if (!validTags.includes(tagName.toLowerCase())) {
                // Escape invalid tags
                return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
            return match;
        });
}

function ensureMermaidCodeFences(content: string): string {
    if (!content) return '';

    const mermaidKeywords = [
        'mermaid',
        'gantt',
        'sequence',
        'sequencediagram',
        'graph',
        'classdiagram',
        'erdiagram',
        'journey',
        'state',
        'statediagram',
        'pie',
        'mindmap',
        'timeline',
        'flowchart'
    ];

    const lines = content.split(/\r?\n/);
    const result: string[] = [];
    let i = 0;
    let insideFence = false;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed.startsWith('```')) {
            insideFence = !insideFence;
            result.push(line);
            i += 1;
            continue;
        }

        const lower = trimmed.toLowerCase();
        const isMermaidStart = !insideFence && mermaidKeywords.some((keyword) => lower === keyword || lower.startsWith(`${keyword} `));

        if (isMermaidStart) {
            const blockLines: string[] = [];
            
            // Collect block lines until an empty line or EOF
            while (i < lines.length && lines[i].trim() !== '') {
                blockLines.push(lines[i]);
                i += 1;
            }

            if (result.length > 0 && result[result.length - 1].trim() !== '') {
                result.push('');
            }
            const spacer = '\n';
            result.push('```mermaid');
            result.push(...blockLines);
            result.push('```');
            result.push(spacer);

            // preserve blank line separator
            while (i < lines.length && lines[i].trim() === '') {
                result.push(lines[i]);
                i += 1;
            }
            continue;
        }

        result.push(line);
        i += 1;
    }

    return result.join('\n');
}

function preprocessMermaidDefinition(definition: string): string {
    if (!definition) return '';

    const cleaned = definition
        .replace(/---(?=\|)/g, '--')
        .replace(/(\s*(?:--|==|\-\.)(?:>|\.>|->|\.->|=?>)?\s*\|[^|]+\|)\s*(?:\r?\n)+\s*(?=\s*\S)/g, '$1 ')
        .replace(/\(([^)]*?)\)/g, '$1')
        .replace(/\[([^\]]*?)\]/g, (_match, label) => {
            const sanitizedLabel = label.replace(/[()]/g, '');
            return `[${sanitizedLabel}]`;
        })
        .replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;');

    return cleaned;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ mdPreview, variant = 'default' }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const modalDiagramRef = useRef<HTMLDivElement | null>(null);
    const [modalContent, setModalContent] = useState<string | null>(null);

    // Configure mermaid once on mount
    useEffect(() => {
        try {
            mermaid.initialize({
                startOnLoad: false,
                securityLevel: 'loose',
                deterministicIds: true,
            });
        } catch (error) {
            console.error('Mermaid initialization failed:', error);
        }
    }, []);

    const renderMermaidWithTheme = useCallback(async (definition: string, container: HTMLElement) => {
        try {
            const renderId = `mermaid-${Date.now()}`;
            const { svg, bindFunctions } = await mermaid.render(renderId, definition);

            if (!container) return;

           const parser = new DOMParser();
           const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
           const svgElement = svgDoc.documentElement;

            svgElement.setAttribute('style', `${svgElement.getAttribute('style') || ''};background-color: transparent;`);
            svgElement.setAttribute('width', '100%');
            svgElement.setAttribute('height', 'auto');
            svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');

            const textNodes = svgElement.querySelectorAll('text, tspan');
            textNodes.forEach((node) => {
                node.setAttribute('fill', '#f3f4f6');
                const existingStyle = node.getAttribute('style') || '';
                node.setAttribute('style', `${existingStyle} fill: #f3f4f6 !important;`);
            });

            const shapeNodes = svgElement.querySelectorAll('rect, polygon, path, ellipse, line, polyline');
            shapeNodes.forEach((node) => {
                const fill = node.getAttribute('fill');
                if (fill && ['#ffffff', '#fff', '#f9f9f9', '#fafafa', '#fefefe'].includes(fill.toLowerCase())) {
                    node.setAttribute('fill', '#111827');
                }

                const stroke = node.getAttribute('stroke');
                if (!stroke || ['#000000', '#000', '#111827', '#1f2937', '#333333'].includes(stroke.toLowerCase())) {
                    node.setAttribute('stroke', '#9ca3af');
                }
            });

            const styleElement = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleElement.textContent = `
                .taskTextOutsideRight,
                .taskTextOutsideLeft,
                .sectionTitle,
                .taskText,
                .todayText,
                text,
                tspan {
                    fill: #f3f4f6 !important;
                    font-size: 16px !important;
                }
            `;
            svgElement.insertBefore(styleElement, svgElement.firstChild);

            container.innerHTML = new XMLSerializer().serializeToString(svgElement);
            container.classList.add('cursor-zoom-in', 'hover:bg-gray-800/40', 'rounded', 'bg-gray-900/60', 'p-2', '[&>svg]:max-w-full');
            container.setAttribute('data-mermaid-definition', definition);

            if (typeof bindFunctions === 'function') {
                bindFunctions(container);
            }
        } catch (error) {
            console.error('Mermaid render failed:', error);
            console.error('Offending definition:', definition);
            const message = error instanceof Error ? error.message : 'Unable to render Mermaid diagram.';
            container.innerHTML = `\n                <div class="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">\n                    <strong class="block text-red-300 mb-1">Mermaid render error</strong>\n                    <pre class="whitespace-pre-wrap text-red-200">${message}</pre>\n                </div>\n            `;
            container.classList.remove('cursor-zoom-in', 'hover:bg-gray-800/40');
        }
    }, []);

    const renderMermaidDiagrams = useCallback(async () => {
        if (!containerRef.current) return;

        const mermaidBlocks = Array.from(
            containerRef.current.querySelectorAll<HTMLElement>('.mermaid')
        );

        if (mermaidBlocks.length === 0) return;

        await Promise.all(
            mermaidBlocks.map(async (block) => {
                const definition = block.textContent?.trim();
                if (!definition) return;

                if (!containerRef.current?.contains(block)) return;

                const sanitizedDefinition = preprocessMermaidDefinition(definition);

                await renderMermaidWithTheme(sanitizedDefinition, block);
                block.addEventListener('click', () => {
                    setModalContent(sanitizedDefinition);
                });
            })
        );
    }, [renderMermaidWithTheme]);

    useEffect(() => {
        renderMermaidDiagrams();
    }, [mdPreview, renderMermaidDiagrams]);

    useEffect(() => {
        if (!modalContent || !modalDiagramRef.current) return;

        (async () => {
            if (!modalDiagramRef.current) return;
            await renderMermaidWithTheme(modalContent, modalDiagramRef.current);
        })();
    }, [modalContent, renderMermaidWithTheme]);

    useEffect(() => {
        const handleWindowFocus = () => {
            renderMermaidDiagrams();
        };
        window.addEventListener('focus', handleWindowFocus);
        return () => {
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [renderMermaidDiagrams]);

    if (!mdPreview) {
        return <div className="text-gray-400 p-2 text-xs leading-tight">No content to display</div>;
    }

    // Clean up extra newlines before tables and remove trailing spaces
    const cleanedMdPreview = mdPreview.replace(/(\r\n|\n|\r){2,}/g, '\n\n');

    const baseClasses =
        'markdown-preview prose prose-invert custom-markdown bg-transparent text-primary rounded-md overflow-auto whitespace-pre-wrap break-words break-all';
    const variantClasses =
        variant === 'compact'
            ? [
                'condensed-prose',
                'prose-base leading-[1.35] tracking-normal',
                'p-2 max-w-full',
                '[&_p]:mt-[0.4rem] [&_p]:mb-[0.4rem] [&_p]:text-[16px] [&_p]:leading-[1.42]',
                '[&_li]:mt-[0.3rem] [&_li]:mb-[0.3rem] [&_li]:text-[16px] [&_li]:leading-[1.4]',
                '[&_ul]:ml-3 [&_ol]:ml-3',
                '[&_h1]:text-2xl [&_h1]:mt-[0.2rem] [&_h1]:mb-[0.1rem]',
                '[&_h2]:text-xl [&_h2]:mt-[0.2rem] [&_h2]:mb-[0.1rem]',
                '[&_h3]:text-lg [&_h3]:mt-[0.1rem] [&_h3]:mb-[0.1rem]',
                '[&_table]:text-[16px] [&_table]:leading-[1.38] [&_table]:my-[0.2rem]',
                '[&_th]:px-3.5 [&_th]:py-[0.4rem] [&_td]:px-3.5 [&_td]:py-[0.35rem]',
                '[&_code]:text-[14px] [&_code]:leading-[1.3]',
                '[&_blockquote]:text-[16px] [&_blockquote]:py-[0.5rem] [&_blockquote]:pl-4.5'
            ].join(' ')
            : 'condensed-prose p-4 max-w-[600px] mx-auto leading-tight';

    const sanitizedContent = ensureMermaidCodeFences(sanitizeMarkdown(mdPreview));

    return (
        <div ref={containerRef} className={`${baseClasses} ${variantClasses}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    code: ({ node, inline, className, children, ...props }: any) => {
                        const match = /language-([\w-]+)/.exec(className || '');
                        const language = match?.[1]?.toLowerCase();
                        const mermaidLanguages = new Set([
                            'mermaid',
                            'gantt',
                            'sequence',
                            'sequencediagram',
                            'classdiagram',
                            'erdiagram',
                            'journey',
                            'state',
                            'statediagram',
                            'pie',
                            'mindmap',
                            'timeline',
                            'flowchart'
                        ]);

                        const isMermaidDiagram = language ? mermaidLanguages.has(language) : false;

                        if (isMermaidDiagram) {
                            let definition = String(children).replace(/\n$/, '');
                            const diagramKeyword = language === 'mermaid' ? '' : language;

                            if (diagramKeyword && !definition.trimStart().toLowerCase().startsWith(diagramKeyword)) {
                                definition = `${diagramKeyword}\n${definition}`;
                            }

                            return (
                                <div className="mermaid my-3 break-all" data-diagram-type={language}>
                                    {definition}
                                </div>
                            );
                        }
                        // Handle other code blocks with proper formatting
                        return !inline && match ? (
                            <SyntaxHighlighter
                                {...props}
                                style={atomDark}
                                language={match[1]}
                                PreTag="div"
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code className={`${className || ''} break-all`} {...props}>
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {sanitizedContent}
            </ReactMarkdown>
            {modalContent && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
                    onClick={() => setModalContent(null)}
                >
                    <div
                        className="relative w-full max-w-5xl max-h-[90vh] overflow-auto rounded-lg border border-gray-700 bg-gray-900 p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute right-4 top-4 text-gray-400 hover:text-white"
                            onClick={() => setModalContent(null)}
                        >
                            ×
                        </button>
                        <div ref={modalDiagramRef} className="mermaid text-xl" data-modal-diagram />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarkdownPreview;
