import React from 'react';
import DigitalRain from '@/components/DigitalRain';
import AnimatedAICircle from '../ui/AnimatedAICircle';

interface DigitalRainIntroProps {
    onInteraction: () => void;
    speed?: number;
    backgroundColor?: string;
}

const DigitalRainIntro: React.FC<DigitalRainIntroProps> = ({
    onInteraction,
    speed = 4,
    backgroundColor = "rgba(10, 20, 10, 0.03)",
}) => {
    const containerStyle: React.CSSProperties = {   
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#000',
        borderRadius: '0.5rem',
    };
    return (
        <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-gray-900 text-white rounded-lg shadow-lg p-4">
            <div className="relative inset-0 z-20"
            >
                <DigitalRain
                    onInteraction={onInteraction}
                    speed={speed}
                    backgroundColor={backgroundColor}
                />
            </div>
            <div className="absolute inset-0 z-20 flex items-center justify-center transform -translate-y-5">
                <div className="relative flex flex-col justify-center items-center bg-transparent px-6 py-0 rounded-lg min-h-0">
                    <AnimatedAICircle className="absolute inset-0 z-0" />
                </div>
            </div>
            <div className="z-20 m-5 text-green-400 text-xl font-mono text-center">
                Click to start typing...
            </div>
        </div>
    );
};

export default DigitalRainIntro;