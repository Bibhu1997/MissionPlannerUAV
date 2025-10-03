
import React from 'react';
import { useTelemetry } from '../hooks/useTelemetry';

const SatelliteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
        <path d="M7 20l-5-5 5-5"/>
        <path d="M12.5 14.5L9 18l5.5 3.5Z"/>
        <path d="M17 4l5 5-5 5"/>
        <path d="M14 7l3.5 2.5L14 13Z"/>
        <path d="m18 9.5 4 2.5-4 2.5"/>
        <path d="M12 2v2"/>
        <path d="M12 19v3"/>
        <path d="M20 12h2"/>
        <path d="M2 12h2"/>
    </svg>
)

const StatusIndicator: React.FC<{ label: string; value: string | number; color: string }> = ({ label, value, color }) => (
    <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-slate-400">{label}:</span>
        <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
);

const Header: React.FC = () => {
    const { telemetry, isSimulating } = useTelemetry();

    const getAltitudeColor = (altitude: number): string => {
        // Common safety limits: below 20m is low, above 120m (~400ft) is a common regulatory ceiling.
        if (altitude < 20 || altitude > 120) {
            return 'text-red-400'; // Unsafe
        }
        return 'text-green-400'; // Safe
    };

    return (
        <header className="flex items-center justify-between p-3 bg-base-200 border-b border-base-300 shadow-md h-16 shrink-0">
            <div className="flex items-center space-x-3">
                <SatelliteIcon />
                <h1 className="text-xl font-bold text-slate-100">Satellite MissionPlanner</h1>
            </div>
            <div className="flex items-center space-x-6 bg-base-100 px-4 py-2 rounded-md">
                {isSimulating && telemetry ? (
                    <>
                        <StatusIndicator label="Lat" value={telemetry.lat.toFixed(4)} color="text-secondary" />
                        <StatusIndicator label="Lon" value={telemetry.lng.toFixed(4)} color="text-secondary" />
                        <StatusIndicator 
                            label="Alt" 
                            value={`${telemetry.alt.toFixed(1)}m`} 
                            color={getAltitudeColor(telemetry.alt)} 
                        />
                        <StatusIndicator label="Speed" value={`${telemetry.speed.toFixed(1)}m/s`} color="text-secondary" />
                        <StatusIndicator label="Battery" value={`${telemetry.battery.toFixed(0)}%`} color={telemetry.battery > 20 ? 'text-green-400' : 'text-red-400'} />
                        <StatusIndicator label="Signal" value={`${telemetry.signal.toFixed(0)}%`} color={telemetry.signal > 50 ? 'text-green-400' : 'text-orange-400'} />
                    </>
                ) : (
                    <StatusIndicator label="Status" value="STANDBY" color="text-primary" />
                )}
            </div>
        </header>
    );
};

export default Header;
