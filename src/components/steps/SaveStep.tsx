// src/components/steps/SaveStep.tsx
import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

const SaveStep = ({ dispatchDone, handleDispatchIrtvData }) => (
    <Card>
        <CardHeader>
            <CardTitle>Save to Current Model:</CardTitle>
        </CardHeader>
        <CardContent>
            {/* Logic for saving the model can be implemented here */}
        </CardContent>
    </Card>
);

export default SaveStep;