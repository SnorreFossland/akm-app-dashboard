// src/components/steps/SaveStep.tsx
import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { useDispatch } from 'react-redux';

const SaveStep: React.FC<{ dispatchDone: any; handleDispatchIrtvData: any }> = ({ dispatchDone, handleDispatchIrtvData }) => (
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