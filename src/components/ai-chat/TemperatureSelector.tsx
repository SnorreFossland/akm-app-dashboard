import React from 'react';

interface TemperatureSelectorProps {
  temperature: number;
  onChange: (value: number) => void;
  className?: string;
}

const TemperatureSelector: React.FC<TemperatureSelectorProps> = ({
  temperature,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center text-xs ${className}`}>
      <div className="flex items-center gap-1">
        <span className="text-gray-400">Temp:</span>
        <select
          value={temperature}
            onChange={(e) => {
              const newTemp = parseFloat(e.target.value);
              onChange(newTemp);
              try {
                localStorage.setItem('aiDashboard_temperature', newTemp.toString());
              } catch {
                // ignore storage errors (private mode, etc.)
              }
            }}
          className="bg-popover border border-gray-600 rounded text-xs py-0 px-1"
          title="Temperature controls randomness. Lower values are more deterministic, higher values more creative."
        >
          <option value="0.0">0.0</option>
          <option value="0.3">0.3</option>
          <option value="0.5">0.5</option>
          <option value="0.7">0.7</option>
          <option value="1.0">1.0</option>
          <option value="1.2">1.2</option>
        </select>
      </div>
    </div>
  );
};

export default TemperatureSelector;
export type { TemperatureSelectorProps };