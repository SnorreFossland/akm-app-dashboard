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

type Provider = 'openai' | 'mistral' | 'deepseek' | 'dummy' | 'experimental';

interface AiModel {
    id: string;
    name: string;
    provider: Provider;
    enabled?: boolean;      // can toggle availability without removing
    experimental?: boolean; // for UI badge or disable
}

const AI_MODELS = [
    { id: 'gpt-5-mini', name: 'GPT-5 Mini', provider: 'openai', enabled: true },
    { id: 'mistral', name: 'Mistral (Legacy)', provider: 'mistral', enabled: true },
    { id: 'gpt-5', name: 'GPT-5', provider: 'openai', enabled: true },
    { id: 'deepseek-chat', name: 'Deepseek Chat', provider: 'deepseek', enabled: true },
    { id: 'dummy', name: 'Dummy (Test)', provider: 'dummy', enabled: true },
] as const;

type ModelId = typeof AI_MODELS[number]['id'];

interface ModelSelectorProps {
    selectedModel: ModelId;
    onModelChange: (modelId: ModelId) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
    const enabledModels = AI_MODELS.filter(m => m.enabled);
    const validIds = enabledModels.map(m => m.id);
    const model: ModelId = (validIds.includes(selectedModel) ? selectedModel : 'gpt-5-mini') as ModelId;

    // Group by provider
    const groups = enabledModels.reduce<Record<Provider, AiModel[]>>((acc, m) => {
        (acc[m.provider] ||= []).push(m);
        return acc;
    }, {} as any);

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="model-select" className="text-xs text-muted-foreground">
                Model
            </label>
            <select
                id="model-select"
                value={model}
                onChange={(e) => onModelChange(e.target.value as ModelId)}
                className="py-1 px-2 text-sm text-muted-foreground bg-secondary/50 border border-secondary rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select AI Model"
            >
                {Object.entries(groups).map(([provider, models]) => (
                    <optgroup key={provider} label={provider}>
                        {models.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.name}{m.experimental ? ' (exp)' : ''}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>
        </div>
    );
}