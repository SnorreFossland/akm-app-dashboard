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
    { id: 'deepseek-chat', name: 'Deepseek-Chat' },
    { id: 'mistral-small-latest', name: 'Mistral Small Latest' },
    { id: 'mistral', name: 'Mistral' },
    { id: 'deepseek-coder', name: 'Deepseek Coder' },
    { id: 'deepseek-r1', name: 'Deepseek R1' },
    { id: 'gpt-4o-mini-2024-08-06', name: 'GPT-4o mini 2024-08-06' },
    { id: 'gpt-4o-mini-2024-07-18', name: 'GPT-4o mini 2024-07-18' },
    { id: 'gpt-4o-mini-2024-06-20', name: 'GPT-4o mini 2024-06-20' },
    { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
    { id: 'gpt-4o-2024-08-06', name: 'GPT-4o 2024-08-06' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    // { id: 'qwen3', name: 'Qwen3' },
    // { id: 'mistral-7b', name: 'Mistral 7B' },
    // { id: 'gpt-4-16k', name: 'GPT-4 16k' },
    // { id: 'gpt-4-32k', name: 'GPT-4 32k' },
    // { id: 'gpt-4.5', name: 'GPT-4.5' },
    // { id: 'gpt-4', name: 'GPT-4' },
    // { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'mistral-mistral-small-24b-instruct-2501', name: 'Mistral 24b' },
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
    const model = validModels.includes(selectedModel) ? selectedModel : 'deepseek-chat'; // Fallback to Deepseek model

    return (
        <div className="flex items-center">
            <select
                id="model-select"
                value={model}
                onChange={(e) => onModelChange(e.target.value)}
                className=" py-1 text-sm text-muted-foreground bg-secondary/50 border border-secondary rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select AI Model"
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

// Add dummy option to the model list
// const models = [
//     { value: 'dummy', label: 'Dummy Model (Testing)', category: 'test' },
//     { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', category: 'openai' },
//     { value: 'gpt-4', label: 'GPT-4', category: 'openai' },
//     { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', category: 'openai' },
//     { value: 'deepseek-chat', label: 'Deepseek Chat', category: 'deepseek' },
//     { value: 'deepseek-coder', label: 'Deepseek Coder', category: 'deepseek' },
//     { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', category: 'anthropic' },
//     { value: 'claude-3-haiku', label: 'Claude 3 Haiku', category: 'anthropic' },
// ];