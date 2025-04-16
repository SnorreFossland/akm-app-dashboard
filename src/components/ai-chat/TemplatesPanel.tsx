'use client';
import { useRef, useEffect, useState } from 'react';
import { PROMPT_TEMPLATES, PromptTemplate } from './promptTemplates';
import TextareaAutosize from 'react-textarea-autosize';


interface TemplatesPanelProps {
    onApplyTemplate: (content: string) => void;
    selectedModel: string; // Add selectedModel to props
}
interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function TemplatesPanel({ onApplyTemplate, selectedModel }: TemplatesPanelProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [customTemplate, setCustomTemplate] = useState('');
    const [editableContent, setEditableContent] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All'); // State for selected category
    const [isRefining, setIsRefining] = useState(false); // Loading state for refining
    const [messages, setMessages] = useState<Array<{ role: string, content: string }>>([]);
    // Add state to track placeholders
    const [placeholders, setPlaceholders] = useState<{ start: number, end: number, text: string }[]>([]);
    const [importedFile, setImportedFile] = useState<string>('');
    const [importedFileName, setImportedFileName] = useState<string>('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isMounted = useRef(true);

    // Generate categories list dynamically from templates
    const CATEGORIES = ["All", ...Array.from(
        new Set(PROMPT_TEMPLATES.map(template => template.category))
    ).sort()];
    const filteredTemplates = selectedCategory === 'All'
        ? PROMPT_TEMPLATES
        : PROMPT_TEMPLATES.filter(template => template.category === selectedCategory);


    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);
    // Find all placeholders when content changes, but exclude those within mermaid diagrams
    useEffect(() => {
        if (!editableContent) return;

        // First identify all mermaid diagram blocks
        const mermaidBlockRegex = /```mermaid[\s\S]*?```/g;
        const mermaidBlocks: { start: number, end: number }[] = [];
        let mermaidMatch;

        while ((mermaidMatch = mermaidBlockRegex.exec(editableContent)) !== null) {
            mermaidBlocks.push({
                start: mermaidMatch.index,
                end: mermaidMatch.index + mermaidMatch[0].length
            });
        }

        // Then find placeholders but exclude those in mermaid blocks
        const regex = /\[(.*?)\]/g;
        const newPlaceholders = [];
        let match: RegExpExecArray | null;

        while ((match = regex.exec(editableContent)) !== null) {
            // Check if this placeholder is inside any mermaid block
            const isInMermaidBlock = mermaidBlocks.some(
                block => match!.index >= block.start && match!.index < block.end
            );

            // Only add placeholders that are not in mermaid blocks
            if (!isInMermaidBlock) {
                newPlaceholders.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0]
                });
            }
        }

        setPlaceholders(newPlaceholders);
    }, [editableContent]);

    // Add function to handle file import
    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (limit to 1MB)
        if (file.size > 1024 * 1024) {
            alert('File size must be less than 1MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setImportedFile(content);
            setImportedFileName(file.name);
        };
        reader.readAsText(file);
    };

    // Function to remove imported file
    const removeImportedFile = () => {
        setImportedFile('');
        setImportedFileName('');
    };
    // Function to select a placeholder
    const selectPlaceholder = (index: number) => {
        if (!textareaRef.current || index >= placeholders.length) return;

        const placeholder = placeholders[index];
        const textarea = textareaRef.current;

        // Focus and select the placeholder text
        textarea.focus();
        textarea.setSelectionRange(placeholder.start, placeholder.end);

        // Calculate the position of the selection
        const text = textarea.value;
        const lines = text.substr(0, placeholder.start).split('\n');
        const lineHeight = 20; // Approximate line height in pixels
        const linePosition = lines.length * lineHeight;

        // Set scroll position to ensure placeholder is visible in the middle of the textarea
        const textareaHeight = textarea.clientHeight;
        textarea.scrollTop = Math.max(0, linePosition - (textareaHeight / 2));
    };
    // Function to handle tab key to jump between placeholders
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab' && placeholders.length > 0) {
            e.preventDefault();

            const textarea = textareaRef.current;
            if (!textarea) return;

            const cursorPosition = textarea.selectionStart;

            // Find the current or next placeholder
            let nextIndex = 0;
            for (let i = 0; i < placeholders.length; i++) {
                if (cursorPosition < placeholders[i].start) {
                    nextIndex = i;
                    break;
                }
                if (i === placeholders.length - 1) {
                    nextIndex = 0; // Loop back to first placeholder
                } else {
                    nextIndex = i + 1;
                }
            }

            selectPlaceholder(nextIndex);
        }
    };

    const handleTemplateSelect = (index: number) => {
        setSelectedTemplate(index);

        if (index === PROMPT_TEMPLATES.length - 1) {
            setEditableContent(customTemplate);
        } else {
            setEditableContent(`${filteredTemplates[index].content}\n##**${filteredTemplates[index].title}**:\n`);

            // Find and select first placeholder on next tick
            setTimeout(() => {
                if (placeholders.length > 0) {
                    selectPlaceholder(0);
                }
            }, 50);
        }
    };

    const handleInsertTemplate = () => {
        console.log('Inserting content:', editableContent);
        let finalContent = `You are an expert consultant specializing in the following domain. 
Leverage your extensive knowledge to help comprehensively define and scope the domain in question clearly and precisely.
If placeholders are present, please replace them with the most relevant information.

#${editableContent.trim()} 

Please format your response clearly using Markdown syntax for readability, employing headings, bullet points, emphasis, and numbered lists as appropriate.

For Mermaid diagrams, use today's date (${new Date().toISOString().split('T')[0]}) as the start date and follow this exact format:

\`\`\`mermaid
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    axisFormat %Y-%m-%d
    Start : milestone, ${new Date().toISOString().split('T')[0]}, 1d
    section Phase 1
    Task 1 : 10d
    Task 2 : 20d
    Task 3 : 20d
\`\`\`

IMPORTANT: In Mermaid Gantt charts, do not use colons in task names. The only colon should be between the task and its date/dependency.

If you include code snippets, wrap them in triple backticks and specify the language, e.g., \`\`\`javascript.
For any diagrams, ensure you use proper markdown syntax with three backticks (not two).
Also ensure to use the correct syntax for the diagram type you are using (e.g., mermaid, flowchart, etc.).`

        //Add imported file context if it exists
        if (importedFile) {
            finalContent += `\n\n## CONTEXT FROM FILE: ${importedFileName}\n\`\`\`\n${importedFile}\n\`\`\`\n\nUse the above file content as additional context for your response.`;
        }

        finalContent += "\n\nDo not wrap your entire response in triple backticks.";

        onApplyTemplate(finalContent);
    };

    const handleRefinePrompt = async () => {
        setIsRefining(true); // Set loading state
        const systemPrompt: Message = {
            role: 'assistant',
            content: `You are a prompt refinement expert. Your task is to take the user's input and transform it into the most effective and complete prompt possible for an AI system. 
The generated prompt must be about what the user wants to achieve, create or write, and it should be clear, concise, and actionable.
Your output must strictly be a refined prompt, not a response or result to the user's input.

# Instructions:

1. Analyze the user's input to understand the context, objectives, and requirements.
2. Identify any missing details or placeholders and replace them with relevant suggestions or examples.
3. Ensure the refined prompt is clear, concise, and actionable.
4. include specific instructions or guidelines for the AI to follow.
5. Include a name and description of the core topic of the prompt.
6. Use Markdown formatting for the output.
7. User Mermaid syntax for any diagrams or visual representations.

# Example:
**User Input:** "Help me write a blog post about AI."
**Refined Prompt:** "Write a detailed blog post about the advancements in artificial intelligence, focusing on recent breakthroughs, applications in various industries, and potential future trends. 
Include subject, description and examples and references to credible sources."

Now, refine the following user input into an exceptional prompt:
`
        };
        const userMessage: Message = { role: 'user', content: editableContent };
        const model = selectedModel || 'gpt-4'; // Default to 'gpt-4' if no model is selected

        try {
            if (!editableContent || typeof editableContent !== 'string') {
                throw new Error('Invalid editableContent');
            }

            console.log("Generating prompt with content:", editableContent);

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [systemPrompt, userMessage],
                    model: model
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (errorData.error && errorData.error.code === 'model_not_found') {
                    alert('The selected AI model is not available. Please choose a different model.');
                }
                throw new Error(errorData.error || 'Network response was not ok');
            }

            const data = await response.json();

            console.log("Response from server:", data.message);

            if (data && data.message) {
                if (isMounted.current) {
                    setEditableContent(data.message);
                }
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error("Error generating prompt:", error);
        } finally {
            if (isMounted.current) {
                setIsRefining(false); // Reset loading state
            }
        }
    };

    return (
        <div className="p-3 h-[92vh] flex flex-col gap-4 overflow-hidden bg-secondary text-gray-100 shadow-lg">
            <h2 className="text-secondary-foreground text-lg font-bold">Prompt Templates </h2>
            <div className="bg-secondary text-secondary-foreground px-2 rounded-md mb-4">
                <label htmlFor="category" className="block text-sm font-medium mb-2">Filter by Category:</label>
                <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border border-gray-600 rounded-md bg-secondary text-secondary-foreground"
                >
                    {CATEGORIES.map((category, index) => (
                        <option key={index} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex h-[40vh] min-h-[10px] max-h-[120vh] overflow-y-auto" id="templates-container">
                {/* Business Templates Column */}
                <div className="w-1/2 pr-2 bg-secondary text-secondary-foreground">
                    <h3 className="text-sm font-semibold text-center">Business</h3>
                    <div className="flex flex-col gap-2">
                        {filteredTemplates
                            .filter(template => template.usage === "Business")
                            .map((template, index) => {
                                const actualIndex = filteredTemplates.findIndex(t => t === template);
                                return (
                                    <button
                                        key={actualIndex}
                                        onClick={() => handleTemplateSelect(actualIndex)}
                                        className={`w-full text-left p-1 rounded-md bg-popover text-secondary-foreground ${selectedTemplate === actualIndex
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-100'
                                            }`}
                                    >
                                        {template.title}
                                    </button>
                                );
                            })}
                    </div>
                </div>

                {/* Personal Templates Column */}
                <div className="w-1/2 pl-2 bg-secondary text-secondary-foreground ">
                    <h3 className="text-sm font-semibold text-center">Personal</h3>
                    <div className="flex flex-col gap-2">
                        {filteredTemplates
                            .filter(template => template.usage === "Personal")
                            .map((template, index) => {
                                const actualIndex = filteredTemplates.findIndex(t => t === template);
                                return (
                                    <button
                                        key={actualIndex}
                                        onClick={() => handleTemplateSelect(actualIndex)}
                                        className={`w-full text-left p-1 rounded-md bg-popover text-secondary-foreground ${selectedTemplate === actualIndex
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-100'
                                            }`}
                                    >
                                        {template.title}
                                    </button>
                                );
                            })}
                    </div>
                </div>
            </div>
            {/* Horizontal Draggable Bar */}
            <div
                className="h-2 bg-gray-700 cursor-row-resize relative"
                onMouseDown={(e) => {
                    const startY = e.clientY;
                    const startHeight = document.querySelector('.overflow-y-auto')?.clientHeight || 0;

                    const handleMouseMove = (moveEvent: MouseEvent) => {
                        const deltaY = moveEvent.clientY - startY;
                        const newHeight = Math.max(100, startHeight + deltaY);
                        const container = document.querySelector('.overflow-y-auto') as HTMLElement;
                        if (container) {
                            container.style.height = `${newHeight}px`;
                        }
                    };

                    const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                    };

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                }}
            >
                <div className="absolute left-1/2 -translate-x-1/2 w-12 h-2 bg-gray-500"></div>
            </div>
            {/* Custom Template Section */}

            <div className="flex-1">
                <h3 className="text-md font-semibold ml-1 bg-secondary text-secondary-foreground">
                    {selectedTemplate === null
                        ? 'Select a template above'
                        : selectedTemplate === PROMPT_TEMPLATES.length - 1
                            ? 'Custom Template'
                            : 'Prompt for: ' + filteredTemplates[selectedTemplate]?.title}
                </h3>
                {/* Add placeholder jump buttons */}
                {placeholders.length > 0 && (
                    <div className="flex gap-2 mt-2 mb-2 flex-wrap">
                        <span className="text-sm text-gray-400">Jump to ... </span>
                        {placeholders.map((placeholder, idx) => (
                            <button
                                key={idx}
                                onClick={() => selectPlaceholder(idx)}
                                className="px-2 py-1 bg-blue-700 text-xs rounded-md hover:bg-blue-600"
                            >
                                {placeholder.text.length > 100
                                    ? `${placeholder.text.substring(0, 99)}...`
                                    : placeholder.text}
                            </button>
                        ))}
                    </div>
                )}
                <TextareaAutosize
                    ref={textareaRef}
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    minRows={7}
                    maxRows={20}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-gray-100 bg-popover text-secondary-foreground"
                    placeholder="You can edit the content here before inserting..."
                    id="editable-content-textarea"
                />

                {/* File Import Section */}
                <div className="mt-3 mb-3 p-2 border border-gray-600 rounded-md bg-gray-800">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Import Context File</h4>
                    <div className="flex flex-col gap-2">
                        {importedFile ? (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300 truncate">
                                    {importedFileName} ({(importedFile.length / 1024).toFixed(1)} KB)
                                </span>
                                <button
                                    onClick={removeImportedFile}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <label className="flex items-center justify-center px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 cursor-pointer">
                                <span>Select a file</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileImport}
                                    accept=".txt,.md,.json,.csv,.js,.jsx,.ts,.tsx,.html,.css"
                                />
                            </label>
                        )}
                    </div>
                </div>

                <div className="flex gap-4 mx-2">
                    <button
                        onClick={handleRefinePrompt}
                        className={`bg-card text-gray-100 px-4 py-2 rounded-md hover:bg-gray-700 ${isRefining ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isRefining}
                    >
                        {isRefining ? 'Generating...' : 'Refine Prompt'}
                    </button>
                    <button
                        onClick={handleInsertTemplate}
                        className="bg-blue-600 text-gray-100 px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Insert into Chat →
                    </button>
                </div>
            </div>

        </div>
    );
}


