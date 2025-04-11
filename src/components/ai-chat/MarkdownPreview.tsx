import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import mermaid from 'mermaid';

interface MarkdownPreviewProps {
    mdPreview: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ mdPreview }) => {
    useEffect(() => {
        mermaid.run(); // Re-run Mermaid after rendering
    }, [mdPreview]); // Trigger Mermaid rendering when mdPreview changes

    return (
        <div className="prose prose-invert max-w-none custom-markdown markdown-preview bg-gray-800 p-4 rounded-md overflow-auto max-h-[80vh]">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]} // Enables GitHub-flavored Markdown
                rehypePlugins={[rehypeHighlight]} // Enables syntax highlighting
                components={{
                    code: ({ className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        // Check if this is a mermaid code block
                        if (match && match[1] === 'mermaid') {
                            return (
                                <div className="mermaid my-4">
                                    {String(children).replace(/\n$/, '')}
                                </div>
                            );
                        }

                        return (
                            <code
                                className={className || ''}
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {mdPreview}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownPreview;