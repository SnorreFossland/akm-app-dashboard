// src/components/steps/ModelStep.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { LoadingCircularProgress } from "@/components/loading";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';



const ModelStep: React.FC<{ model: { objects: any[] } | null; isLoading: boolean; handleSecondStep: () => void }> = ({ model, isLoading, handleSecondStep }) => (
    <Card>
        <CardHeader>
            <CardTitle>Model Builder:</CardTitle>
        </CardHeader>
        <CardContent>
                <Button
                    onClick={handleSecondStep}
                    className={`rounded text-xl ${((model?.objects?.length ?? 0) > 0) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}
                >
                    <FontAwesomeIcon icon={faRobot} size="1x" />
                </Button>
                {isLoading && <LoadingCircularProgress />}
        </CardContent>
    </Card>
);

export default ModelStep;