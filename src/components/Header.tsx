// src/features/model-universe/components/ModelHeader.tsx
import React from 'react';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


interface ModelHeaderProps {
    metisName?: string;
}

const ModelHeader: React.FC<ModelHeaderProps> = ({ metisName }) => {
    return (
        <header className="me-auto w-full bg-blue-500/60 text-gradient-to-r from-green-700 to-blue-900 text-transparent bg-clip-text">
            <div className="flex justify-between items-center font-bold text-white text-green-500 mx-1">
                <div className="me-1 mb-0 text-muted-foreground">Modelling Domain file :
                    {/* <span className="px-2 text-gray-300">{metisName}.json</span> */}
                </div>
                {/* <div className="me-5 text-3xl rounded bg-green-500/50 text-gradient-to-r from-green-700 to-blue-700 text-transparent bg-clip-text shadow-md shadow-green-500/50">
                    &nbsp;&nbsp; AI Assisted Modeling  &nbsp;&nbsp;
                </div> */}
            </div>
        </header>
    );
};

export default ModelHeader;