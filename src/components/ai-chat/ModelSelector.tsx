'use client';

// Define available models
const AI_MODELS = [
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'deepseek-coder', name: 'Deepseek Coder' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus' },
    { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet' },
    { id: 'mistral-large', name: 'Mistral Large' },
    { id: 'mistral-medium', name: 'Mistral Medium' },
    { id: 'gemini-pro', name: 'Gemini Pro' },
    { id: 'gemini-ultra', name: 'Gemini Ultra' },
];

interface ModelSelectorProps {
    selectedModel: string;
    onModelChange: (modelId: string) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
    return (
        <div className="flex items-center">
            <label htmlFor="model-select" className="mr-2 text-sm">Model:</label>
            <select
                id="model-select"
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {AI_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                        {model.name}
                    </option>
                ))}
            </select>
        </div>
    );
}