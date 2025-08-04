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
    return (
        <div className="relative w-full h-full overflow-hidden bg-black rounded-lg">
            {/* Digital Rain Background - Full size */}
            <div className="absolute inset-0 w-full h-full">
                <DigitalRain
                    onInteraction={onInteraction}
                    speed={speed}
                    backgroundColor={backgroundColor}
                    containerStyle={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                    }}
                />
            </div>
            
            {/* Animated AI Circle Overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className="relative">
                    <AnimatedAICircle className="w-52 h-52" />
                </div>
            </div>
            
            {/* Optional interaction hint */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 text-green-400 text-sm font-mono text-center opacity-70 pointer-events-none">
                Click anywhere to start...
            </div>
        </div>
    );
};

export default DigitalRainIntro;