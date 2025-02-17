"use client";

import { useState } from "react";
import { useSelector, useDispatch } from 'react-redux';

import { Button } from '@/components/ui/button';
import { Textarea } from "@/components/ui/textarea";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { Card, CardTitle } from '@/components/ui/card';

import { setDomainData } from '@/features/model-universe/modelSlice';
import { systemPrompt } from "@/app/prompt-builder/prompts";

export default function VercelAiPage() {
    const [prompt, setPrompt] = useState(systemPrompt);
    const [chatOutput, setChatOutput] = useState<string>("");

    const dispatch = useDispatch<AppDispatch>();
    const [dispatchDone, setDispatchDone] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const [suggestedDomainData, setSuggestedDomainData] = useState<any>(null);
    const [domainDataDone, setDomainDataDone] = useState(false);

    // New reusable IconButton component
    const IconButton = ({
        onClick,
        icon,
        className = "",
        iconWidth = "26px",
        iconSize = "1x"
    }: {
        onClick: () => void;
        icon: any;
        className?: string;
        iconWidth?: string;
        iconSize?: string;
    }) => {
        return (
            <Button
                onClick={onClick}
                className={`rounded text-xl p-4 bg-green-700 text-white ${className}`}
            >
                <FontAwesomeIcon icon={icon} width={iconWidth} size={iconSize} />
            </Button>
        );
    };

// Updated DispatchCardTitle component using IconButton
const DispatchCardTitle = ({
    dispatchDone,
    handleDispatchDomainData,
    extraClassName = ""
}: {
    dispatchDone: boolean;
    handleDispatchDomainData: () => void;
    extraClassName?: string;
}) => {
    return (
        <CardTitle
            className={`flex justify-between items-center flex-grow ps-1 bg-gray-600 border border-gray-700 ${extraClassName} ${dispatchDone ? 'text-green-600' : 'text-green-200'}`}
        >
            <div className={`flex justify-between items-center flex-grow ${dispatchDone ? 'text-green-600' : 'text-green-200'}`}>
                Save to current Store
                <div className="flex items-center ml-auto">
                    {!dispatchDone ? (
                        <div style={{ marginLeft: 8, marginRight: 8 }}>
                            <LoadingCircularProgress />
                        </div>
                    ) : (
                        <div style={{ marginLeft: 8, marginRight: 8, color: dispatchDone ? 'green' : 'gray' }}>
                            <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                        </div>
                    )}
                    <IconButton onClick={handleDispatchDomainData} icon={faPaperPlane} />
                </div>
            </div>
        </CardTitle>
    );
};

    const handleSubmit = async () => {
        if (!prompt || prompt.trim() === "") {
            console.error("Prompt is empty");
            setChatOutput("Prompt cannot be empty.");
            return;
        }

        console.log("Submitting prompt:", prompt);

        try {
            const response = await fetch("/api/genprompt", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt }),
            });
            console.log("Request body:", JSON.stringify({ prompt })); // Log the request body
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            const data = await response.json();
            setChatOutput(data.response); // Ensure 'data.response' is a string
            setSuggestedDomainData(data.response);
            setPrompt("");
        } catch (error) {
            console.error('Submit Error:', error);
            setChatOutput("An error occurred while submitting the prompt.");
        }
    };

        const handleDispatchDomainData = () => {
            if (!suggestedDomainData) {
                alert('No Domain data to dispatch');
                return;
            }
            console.log("120 Dispatching Domain data:", suggestedDomainData);
            dispatch(setDomainData(suggestedDomainData));
            setSuggestedDomainData(null);
            setDispatchDone(true);
        };

    return (
        <div className="flex flex-col gap-4 p-4 max-w-4xl mx-auto">
            <button onClick={handleSubmit} className="btn">
                Submit
            </button>
            <h1 className="text-2xl font-bold">AKM Concept Definer</h1>
            <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleSubmit();
                    }
                }}
                rows={10}
                placeholder="What Domain do you want?"
            />
            {chatOutput && <div className="chat-output">{chatOutput}</div>}
            <div className="mt-auto">
                <DispatchCardTitle
                    dispatchDone={dispatchDone}
                    handleDispatchDomainData={handleDispatchDomainData}
                />
            </div>
        </div>
    );
}