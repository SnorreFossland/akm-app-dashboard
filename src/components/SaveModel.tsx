import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

interface SaveModelProps {
    dispatchDone: () => void;
    handleDispatchIrtvData: () => void;
}

const SaveModel = ({ dispatchDone, handleDispatchIrtvData }: SaveModelProps) => (
    <Card>
        <CardHeader>
            <CardTitle>Save to current Model</CardTitle>
        </CardHeader>
        {/* Content for Save Model */}
    </Card>
);

export default SaveModel;