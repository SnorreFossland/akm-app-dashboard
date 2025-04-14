'use client';

import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

interface AnimatedAICircleProps {
  className?: string;
}

const AnimatedAICircle = ({ className = '' }: AnimatedAICircleProps) => {
  return (
    <div className={`relative w-full max-w-xs aspect-square rounded-full border-4 border-green-500 shadow-lg flex items-center justify-center ${className}`}>
      <div className="relative w-full h-full m-1 rounded-full border-4 border-blue-500 shadow-lg flex items-center justify-center">
        {/* Image visible for the first half of the cycle */}
        <div
          style={{ animation: "fadeInOut 10s ease-in-out infinite" }}
          className="absolute"
        >
          <style jsx>{`
            @keyframes fadeInOut {
              0% { opacity: 1; }
              45% { opacity: 0; }
              55% { opacity: 0; }
              100% { opacity: 1; }
            }
          `}</style>
          {/* <Image
            src="/images/earthbox.png"
            alt="Active AI Powered Knowledge Models"
            width={222}
            height={222}
            className="object-cover rounded-full w-full h-full"
          /> */}
        </div>
        <div className="absolute inset-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-10 animate-[pulse_5s_linear_infinite]"></div>
        <div className="flex flex-col items-center z-2">
          <span className="relative p-2 md:p-4 text-center text-lg md:text-2xl lg:text-2xl font-semibold bg-gradient-to-r from-green-400 to-blue-500 animate-[pulse_1s_linear_infinite] bg-clip-text text-transparent">
            AI Powered
          </span>
          <span className="relative p-2 md:p-4 text-center text-lg md:text-2xl lg:text-2xl font-semibold bg-gradient-to-l from-green-400 to-blue-500 animate-[pulse_5s_linear_infinite] bg-clip-text text-transparent">
            Active Knowledge Models
          </span>
        </div>
        <div
          style={{
            animation: "fadeInOut 20s ease-in-out infinite reverse, moveAround 60s linear infinite"
          }}
          className="absolute"
        >
          <style jsx>{`
          @keyframes fadeInOut {
          0% { opacity: 1; }
          45% { opacity: 0; }
          55% { opacity: 0; }
          100% { opacity: 1; }
          }
          @keyframes moveAround {
          0% { transform: translate(0px, 0px); }
          20% { transform: translate(50px, -35px); }
          40% { transform: translate(-40px, -30px); }
          60% { transform: translate(-50px, 40px); }
          80% { transform: translate(40px, 30px); }
          100% { transform: translate(0px, 0px); }
          }
          @keyframes changeColors {
          0% { color: #b91c1c; }
          25% { color: #4f46e5; }
          50% { color: #0ea5e9; }
          75% { color: #059669; }
          100% { color: #b91c1c; }
          }
          @keyframes changeSize {
          0% { transform: scale(1); }
          50% { transform: scale(1.5); }
          100% { transform: scale(1); }
          }
          `}</style>
          <FontAwesomeIcon
            icon={faRobot}
            className="fa-2xl"
            style={{ animation: "changeColors 18s linear infinite, changeSize 8s ease-in-out infinite" }}
          />
        </div>
      </div>
    </div>
  );
};

export default AnimatedAICircle;