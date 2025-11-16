import React from 'react';
import { render, screen } from '@testing-library/react';
import PromptBuilder from '@/components/prompt-builder/PromptBuilder';

jest.mock('react-markdown', () => ({
    __esModule: true,
    default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) =>
        selector({
            modelUniverse: {
                phData: { domain: {} },
                phSource: '',
            },
        }),
}));

describe('PromptBuilder', () => {
    const setFinalPrompt = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the AI Assistant header', () => {
        render(<PromptBuilder finalPrompt="" setFinalPrompt={setFinalPrompt} />);
        const aiAssistantElements = screen.getAllByText(/AI Assistant/i);
        expect(aiAssistantElements.length).toBeGreaterThan(0);
    });
});
