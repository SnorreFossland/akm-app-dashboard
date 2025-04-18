
// ModelSelector.tsx
// This component allows users to select an AI model from a dropdown list.
// It is a client component, as it uses state and effects.
// It is also responsible for validating the selected model against a predefined list of available models.
// The component takes two props: selectedModel (the currently selected model) and onModelChange (a callback function to handle model changes).
// The component uses TypeScript for type safety and defines the ModelSelectorProps interface for its props.
// It also includes a fallback mechanism to default to 'deepseek-chat' if the selected model is not valid.
// This component is part of a larger AI chat application and is designed to be used in conjunction with other components.
// src/components/ai-chat/ModelSelector.tsx
// Author: Snorre Fossland
'use client';

// Define available models
const AI_MODELS = [
    { id: 'mistral-small-latest', name: 'Mistral Small Latest' },
    { id: 'deepseek-chat', name: 'Deepseek-Chat' },
    { id: 'mistral-chat', name: 'Mistral Chat' },
    { id: 'mistral-7b', name: 'Mistral 7B' },
    { id: 'gpt-4-16k', name: 'GPT-4 16k' },
    { id: 'gpt-4-32k', name: 'GPT-4 32k' },
    // { id: 'gpt-4.5', name: 'GPT-4.5' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'mistral-large', name: 'Mistral Large' },
    // { id: 'claude-3-opus', name: 'Claude 3 Opus' },
    // { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet' },
    // { id: 'gemini-pro', name: 'Gemini Pro' },
    // { id: 'gemini-ultra', name: 'Gemini Ultra' },
    { id: 'dummy', name: 'Dummy' },
];

const validModels = AI_MODELS.map((model) => model.id);

interface ModelSelectorProps {
    selectedModel: string;
    onModelChange: (modelId: string) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
    const model = validModels.includes(selectedModel) ? selectedModel : 'mistral-small-latest'; // Fallback to 'gpt-4'

    return (
        <div className="flex items-center">
            <label htmlFor="model-select" className="mr-2 text-sm">Model:</label>
            <select
                id="model-select"
                value={model}
                onChange={(e) => onModelChange(e.target.value)}
                className="bg-background border border-gray-700 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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