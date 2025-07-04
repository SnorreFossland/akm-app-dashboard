// src/features/model-universe/components/ModelHeader.tsx
import React from 'react';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


interface ModelHeaderProps {
    title?: string;
    value?: string;
}

const ModelHeader: React.FC<ModelHeaderProps> = ({ title, value }) => {
    return (
        <header className="m-0 p-0 w-full bg-blue-500/60 text-gradient-to-r from-green-700 to-blue-900 text-transparent bg-clip-text">
            <div className="flex justify-center items-center font-bold text-white text-green-500 m-0 p-0">
                <div className="m-0 text-muted-foreground">{title}:</div>
                <span className="px-2 text-gray-300">{value}.json</span>
            </div>
        </header>
    );
};

export default ModelHeader;