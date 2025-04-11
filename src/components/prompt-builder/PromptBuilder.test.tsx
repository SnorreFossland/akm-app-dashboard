import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import PromptBuilder from "./PromptBuilder";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { setDomainPrompt, deleteDomainPrompt, setDomainData } from "@/features/model-universe/modelSlice";

// Mock the Redux store
const mockStore = configureStore([]);

// Mock the API call
global.fetch = jest.fn();

describe("PromptBuilder Component", () => {
    let store;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock store with initial state
        store = mockStore({
            modelUniverse: {
                phData: {
                    domain: {
                        name: "Test Domain",
                        description: "Test Description",
                        prompt: "Test Prompt",
                        presentation: "Test Presentation",
                        additionalContext: ""
                    }
                }
            }
        });

        // Mock successful API response
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ response: "# AI-Generated Response" })
        });

        // Mock dispatch
        store.dispatch = jest.fn();
    });

    test("renders the component correctly in initial phase", () => {
        render(
            <Provider store={store}>
                <PromptBuilder />
            </Provider>
        );

        expect(screen.getByText("Prompt Builder")).toBeInTheDocument();
        expect(screen.getByText("Enter a Domain/Topic/Theme below:")).toBeInTheDocument();
        expect(screen.getByText("Generate prompt")).toBeInTheDocument();
    });

    test("allows user to enter domain input", async () => {
        render(
            <Provider store={store}>
                <PromptBuilder />
            </Provider>
        );

        const textarea = screen.getByPlaceholderText(/E.g., Financial Risk Assessment/i);
        userEvent.type(textarea, "Artificial Intelligence");

        expect(textarea).toHaveValue("Artificial Intelligence");
    });

    test("handles clarification request when Generate prompt button is clicked", async () => {
        render(
            <Provider store={store}>
                <PromptBuilder />
            </Provider>
        );

        // Enter domain input
        const textarea = screen.getByPlaceholderText(/E.g., Financial Risk Assessment/i);
        userEvent.type(textarea, "Artificial Intelligence");

        // Click Generate prompt button
        const generateButton = screen.getByText("Generate prompt").closest("button");
        fireEvent.click(generateButton);

        // Wait for API call
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
    });

    test("transitions to clarification phase after receiving API response", async () => {
        render(
            <Provider store={store}>
                <PromptBuilder />
            </Provider>
        );

        // Enter domain input
        const textarea = screen.getByPlaceholderText(/E.g., Financial Risk Assessment/i);
        userEvent.type(textarea, "Artificial Intelligence");

        // Click Generate prompt button
        const generateButton = screen.getByText("Generate prompt").closest("button");
        fireEvent.click(generateButton);

        // Wait for phase transition
        await waitFor(() => {
            expect(screen.getByText("Additional Details (Optional):")).toBeInTheDocument();
        });
    });

    test("dispatches prompt to Redux store when Save Final Prompt button is clicked", async () => {
        // Start in final phase with a prompt
        const finalPhaseStore = mockStore({
            modelUniverse: {
                phData: {
                    domain: {
                        name: "Test Domain",
                        description: "Test Description",
                        prompt: "Test Prompt",
                        presentation: "Test Presentation"
                    }
                }
            }
        });
        finalPhaseStore.dispatch = jest.fn();

        const { rerender } = render(
            <Provider store={finalPhaseStore}>
                <PromptBuilder />
            </Provider>
        );

        // Navigate through phases to final
        const textarea = screen.getByPlaceholderText(/E.g., Financial Risk Assessment/i);
        userEvent.type(textarea, "Artificial Intelligence");

        const generateButton = screen.getByText("Generate prompt").closest("button");
        fireEvent.click(generateButton);

        // Wait for clarification phase
        await waitFor(() => {
            expect(screen.getByText("Additional Details (Optional):")).toBeInTheDocument();
        });

        // Finalize prompt
        const finalizeButton = screen.getByText("Finalize Prompt").closest("button");
        fireEvent.click(finalizeButton);

        // Wait for final phase
        await waitFor(() => {
            expect(screen.getByText("Final Perfect Prompt:")).toBeInTheDocument();
        });

        // Save prompt to store
        const saveButton = screen.getByText("Save Final Prompt to Store").closest("button");
        fireEvent.click(saveButton);

        // Verify dispatch was called
        expect(finalPhaseStore.dispatch).toHaveBeenCalledTimes(2);
    });

    test("allows editing the prompt in final phase", async () => {
        render(
            <Provider store={store}>
                <PromptBuilder />
            </Provider>
        );

        // Navigate to final phase
        const textarea = screen.getByPlaceholderText(/E.g., Financial Risk Assessment/i);
        userEvent.type(textarea, "Artificial Intelligence");

        const generateButton = screen.getByText("Generate prompt").closest("button");
        fireEvent.click(generateButton);

        // Complete clarification phase
        await waitFor(() => {
            expect(screen.getByText("Additional Details (Optional):")).toBeInTheDocument();
        });

        const finalizeButton = screen.getByText("Finalize Prompt").closest("button");
        fireEvent.click(finalizeButton);

        // Verify edit mode in final phase
        await waitFor(() => {
            const finalPromptTextarea = screen.getByText("Final Perfect Prompt:").nextElementSibling;
            expect(finalPromptTextarea).toBeInTheDocument();
        });
    });

    test('basic test', () => {
        expect(1 + 1).toBe(2);
    });
});