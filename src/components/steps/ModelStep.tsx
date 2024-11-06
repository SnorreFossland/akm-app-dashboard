// src/components/steps/ModelStep.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { LoadingCircularProgress } from "@/components/loading";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

const ModelStep = ({ model, isLoading, handleSecondStep }) => (
    <Card>
        <CardHeader>
            <CardTitle>Model Builder:</CardTitle>
        </CardHeader>
        <CardContent>
            {/* Additional fields and logic for model building can be added here */}
        </CardContent>
        <CardFooter>
            <div className="flex justify-between">
                <Button
                    onClick={handleSecondStep}
                    className={`rounded text-xl ${(model?.objects?.length > 0) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}
                >
                    <FontAwesomeIcon icon={faRobot} size="1x" />
                </Button>
                {isLoading && <LoadingCircularProgress />}
            </div>
        </CardFooter>
    </Card>
);

export default ModelStep;