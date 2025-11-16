import React from 'react';
import { render, screen } from '@testing-library/react';
import PromptBuilder from './PromptBuilder';

jest.mock('react-redux', () => ({
    useDispatch: () => jest.fn(),
    useSelector: (selector: any) =>
        selector({
            modelUniverse: {
                phData: { domain: {} },
                phSource: '',
            },
        }),
}));

describe('PromptBuilder component', () => {
    it('renders AI Assistant content', () => {
        render(<PromptBuilder finalPrompt="" setFinalPrompt={jest.fn()} />);
        const aiAssistantElements = screen.getAllByText(/AI Assistant/i);
        expect(aiAssistantElements.length).toBeGreaterThan(0);
    });
});