'use client';

import React, { useEffect, useLayoutEffect } from 'react';
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

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ mdPreview, variant = 'default' }) => {
    // existing re-init on markdown change
    useLayoutEffect(() => {
        mermaid.initialize({ startOnLoad: false });
        mermaid.init(undefined, '.mermaid');
    }, [mdPreview]);

    // re-init diagrams when window regains focus
    useEffect(() => {
        const handleWindowFocus = () => {
            mermaid.init(undefined, '.mermaid');
        };
        window.addEventListener('focus', handleWindowFocus);
        return () => {
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, []);

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

    const sanitizedContent = sanitizeMarkdown(mdPreview);

    return (
        <div className={`${baseClasses} ${variantClasses}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    code: ({ node, inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        // Check if this is a mermaid code block
                        if (match && match[1] === 'mermaid') {
                            return (
                                <div className="mermaid my-3 break-all">
                                    {String(children).replace(/\n$/, '')}
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
        </div>
    );
};

export default MarkdownPreview;
