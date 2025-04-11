// src/components/steps/WorkspaceStep.tsx
import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';

interface WorkspaceStepProps {
    newModelview: {
        name: string;
    }
}

const WorkspaceStep: React.FC<WorkspaceStepProps> = ({ newModelview }) => (
    <Card>
        <CardHeader>
            <CardTitle>Workspace Builder:</CardTitle>
        </CardHeader>
        <CardContent>
            {/* Logic for workspace building can be implemented here */}
            {newModelview.name && (
                <div>   
                    <h2 className="text-lg font-semibold">{newModelview.name}</h2>
                </div>
            )}
        </CardContent>
    </Card>
);

export default WorkspaceStep;