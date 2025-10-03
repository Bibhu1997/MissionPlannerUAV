
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Telemetry } from '../types';
import { useMissionState } from './useMission';

interface TelemetryState {
  telemetry: Telemetry | null;
  isSimulating: boolean;
  startSimulation: () => void;
  stopSimulation: () => void;
}

const TelemetryContext = createContext<TelemetryState | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentMission } = useMissionState();
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [waypointIndex, setWaypointIndex] = useState(0);

  useEffect(() => {
    let interval: number | undefined;

    if (isSimulating && currentMission.waypoints.length > 0) {
      interval = window.setInterval(() => {
        setWaypointIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % currentMission.waypoints.length;
          const currentWaypoint = currentMission.waypoints[nextIndex];

          setTelemetry({
            lat: currentWaypoint.lat,
            lng: currentWaypoint.lng,
            alt: currentWaypoint.alt,
            heading: Math.random() * 360,
            speed: currentWaypoint.speed,
            battery: 100 - (nextIndex / currentMission.waypoints.length) * 50,
            signal: 95 - Math.random() * 10,
          });

          return nextIndex;
        });
      }, 2000);
    } else {
        setTelemetry(null);
        setWaypointIndex(0);
    }

    return () => clearInterval(interval);
  }, [isSimulating, currentMission.waypoints]);

  const startSimulation = () => {
    if(currentMission.waypoints.length > 0) {
      setWaypointIndex(0);
      setTelemetry({
        lat: currentMission.waypoints[0].lat,
        lng: currentMission.waypoints[0].lng,
        alt: currentMission.waypoints[0].alt,
        heading: 0,
        speed: 0,
        battery: 100,
        signal: 99
      });
      setIsSimulating(true);
    } else {
        alert("Cannot start simulation. No waypoints in mission.");
    }
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setTelemetry(null);
    setWaypointIndex(0);
  };

  return (
    <TelemetryContext.Provider value={{ telemetry, isSimulating, startSimulation, stopSimulation }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = (): TelemetryState => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
