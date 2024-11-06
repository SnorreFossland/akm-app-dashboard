// src/components/steps/ConceptStep.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingCircularProgress } from "@/components/loading";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

const ConceptStep = ({ topicDescr, settopicDescr, isLoading, handleFirstStep, concepts, setStep }) => (
    <Card>
        <CardHeader>
            <CardTitle>Concept Builder:</CardTitle>
        </CardHeader>
        <CardContent>
            <label htmlFor="topicDescr" className="text-white">Topic</label>
            <Textarea
                id="topicDescr"
                className="flex-grow p-1 rounded bg-gray-800"
                value={topicDescr}
                disabled={isLoading}
                onChange={(e) => settopicDescr(e.target.value)}
                placeholder="Enter domain description"
                rows={3}
            />
            {/* Additional fields and logic for domain description and concepts can be added here */}
        </CardContent>
        <CardFooter>
            <div className="flex justify-between">
                <Button
                    onClick={() => { setStep(1); handleFirstStep(); }}
                    className={`rounded text-xl p-4 ${(concepts.length > 0) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}
                >
                    <FontAwesomeIcon icon={faRobot} size="1x" />
                </Button>
                {isLoading && <LoadingCircularProgress />}
            </div>
        </CardFooter>
    </Card>
);

export default ConceptStep;