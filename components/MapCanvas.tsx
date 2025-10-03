
import React, { useRef, MouseEvent } from 'react';
import { useMissionState, useMissionDispatch } from '../hooks/useMission';
import { useTelemetry } from '../hooks/useTelemetry';

const MapCanvas: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const { currentMission } = useMissionState();
  const dispatch = useMissionDispatch();
  const { telemetry } = useTelemetry();

  const handleMapClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Simulate lat/lng based on click position
    const lat = 34.0522 - (y / rect.height) * 0.1; // Centered around LA
    const lng = -118.2437 + (x / rect.width) * 0.2;

    dispatch({ type: 'ADD_WAYPOINT', payload: { lat, lng } });
  };
  
  const getPositionStyle = (lat: number, lng: number): React.CSSProperties => {
    const mapLatStart = 34.1022;
    const mapLngStart = -118.3437;
    const latRange = 0.1;
    const lngRange = 0.2;
    
    const topPercent = ((mapLatStart - lat) / latRange) * 100;
    const leftPercent = ((lng - mapLngStart) / lngRange) * 100;

    return {
        top: `${topPercent}%`,
        left: `${leftPercent}%`,
    }
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-full bg-slate-800 cursor-crosshair overflow-hidden relative"
      onClick={handleMapClick}
      style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(51, 65, 85, 0.5) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
      }}
    >
      {/* Inform user this is a mock map */}
      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          MOCK MAP CANVAS - Click to add waypoints
      </div>
      
      {/* Render mission path */}
      {currentMission.waypoints.length > 1 && (
         <svg className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            <polyline
                points={currentMission.waypoints.map(wp => {
                    const style = getPositionStyle(wp.lat, wp.lng);
                    const x = (parseFloat(style.left as string) / 100) * (mapRef.current?.clientWidth || 0);
                    const y = (parseFloat(style.top as string) / 100) * (mapRef.current?.clientHeight || 0);
                    return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="rgba(56, 189, 248, 0.7)"
                strokeWidth="2"
                strokeDasharray="5 5"
            />
        </svg>
      )}

      {/* Render waypoints */}
      {currentMission.waypoints.map((wp, index) => (
        <div
          key={wp.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-primary rounded-full text-white font-bold text-xs border-2 border-white shadow-lg"
          style={getPositionStyle(wp.lat, wp.lng)}
        >
          {index + 1}
        </div>
      ))}

      {/* Render Telemetry */}
      {telemetry && (
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-linear"
          style={getPositionStyle(telemetry.lat, telemetry.lng)}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary drop-shadow-lg" style={{transform: `rotate(${telemetry.heading}deg)`}}>
                <path d="m12 2 7 19-7-4-7 4 7-19z"/>
            </svg>
        </div>
      )}
    </div>
  );
};

export default MapCanvas;
