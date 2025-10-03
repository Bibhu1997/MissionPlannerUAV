import React from 'react';
import { useTelemetry } from '../hooks/useTelemetry';

const SatelliteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
        <path d="M7 20l-5-5 5-5"/><path d="M12.5 14.5L9 18l5.5 3.5Z"/><path d="M17 4l5 5-5 5"/><path d="M14 7l3.5 2.5L14 13Z"/><path d="m18 9.5 4 2.5-4 2.5"/><path d="M12 2v2"/><path d="M12 19v3"/><path d="M20 12h2"/><path d="M2 12h2"/>
    </svg>
);

const BatteryIcon: React.FC<{ level: number }> = ({ level }) => {
    const color = level > 50 ? 'text-secondary' : level > 20 ? 'text-orange-400' : 'text-red-500';
    let iconPath = <path d="M14 7h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />; // Full
    if (level <= 50) iconPath = <path d="M14 7h2a2 2 0 0 1 2 2v2" />; // Half
    if (level <= 20) iconPath = <path d="M14 11h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />; // Low (shows bottom part)

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${color}`}>
            <rect x="6" y="7" width="12" height="10" rx="2" ry="2"/>
            <line x1="18" y1="13" x2="22" y2="13"/>
        </svg>
    );
};

const SignalIcon: React.FC<{ level: number }> = ({ level }) => {
    const color = level > 70 ? 'text-secondary' : level > 40 ? 'text-orange-400' : 'text-red-500';
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${color}`}>
            <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20" opacity={level > 10 ? 1 : 0.3} />
            <path d="M2 8a13 13 0 0 1 13.95 20" opacity={level > 40 ? 1 : 0.3} />
            <path d="M2 4a17 17 0 0 1 17.95 20" opacity={level > 70 ? 1 : 0.3} />
            <line x1="2" y1="20" x2="2.01" y2="20" />
        </svg>
    );
};

const AltitudeIcon: React.FC<{ color: string }> = ({ color }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${color}`}>
      <path d="m12 3-8 4.5v9l8 4.5 8-4.5v-9L12 3z"/>
      <path d="m12 12 8-4.5"/>
      <path d="M12 12v9"/>
      <path d="m12 12-8-4.5"/>
      <path d="M16 5.11V10l-4 2.22"/>
    </svg>
);

const Header: React.FC = () => {
    const { telemetry, isSimulating, alert } = useTelemetry();

    const getAltitudeColor = (altitude: number): string => {
        if (altitude < 20 || altitude > 120) return 'text-red-400';
        return 'text-green-400';
    };

    return (
        <header className="relative flex items-center justify-between p-3 bg-base-200 border-b border-base-300 shadow-md h-16 shrink-0 z-20">
            <div className="flex items-center space-x-3">
                <SatelliteIcon />
                <h1 className="text-xl font-bold text-slate-100">Satellite MissionPlanner</h1>
            </div>
            <div className="flex items-center space-x-4 bg-base-100 px-4 py-2 rounded-md">
                {isSimulating && telemetry ? (
                    <>
                        <div className="flex items-center space-x-2" title="Altitude">
                            <AltitudeIcon color={getAltitudeColor(telemetry.alt)} />
                            <span className={`text-sm font-semibold ${getAltitudeColor(telemetry.alt)}`}>{telemetry.alt.toFixed(1)}m</span>
                        </div>
                         <div className="flex items-center space-x-2" title="Battery">
                            <BatteryIcon level={telemetry.battery} />
                            <span className={`text-sm font-semibold`}>{telemetry.battery.toFixed(0)}%</span>
                        </div>
                         <div className="flex items-center space-x-2" title="Signal">
                            <SignalIcon level={telemetry.signal} />
                            <span className={`text-sm font-semibold`}>{telemetry.signal.toFixed(0)}%</span>
                        </div>
                    </>
                ) : (
                     <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-slate-400">Status:</span>
                        <span className={`text-sm font-semibold text-primary`}>STANDBY</span>
                    </div>
                )}
            </div>
             {alert && (
                <div className="absolute top-full left-0 right-0 bg-red-500 text-white text-center text-sm font-bold p-1 animate-pulse z-10">
                    {alert}
                </div>
            )}
        </header>
    );
};

export default Header;