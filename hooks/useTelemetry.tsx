import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import { Telemetry, Waypoint } from '../types';
import { useMissionState } from './useMission';

// Helper functions for realistic simulation
const toRadians = (deg: number) => deg * Math.PI / 180;
const toDegrees = (rad: number) => rad * 180 / Math.PI;

const getDistance = (from: { lat: number, lng: number }, to: { lat: number, lng: number }) => {
    const R = 6371e3; // metres
    const φ1 = toRadians(from.lat);
    const φ2 = toRadians(to.lat);
    const Δφ = toRadians(to.lat - from.lat);
    const Δλ = toRadians(to.lng - from.lng);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

const getBearing = (from: { lat: number, lng: number }, to: { lat: number, lng: number }) => {
    const φ1 = toRadians(from.lat);
    const λ1 = toRadians(from.lng);
    const φ2 = toRadians(to.lat);
    const λ2 = toRadians(to.lng);
    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    const θ = Math.atan2(y, x);
    return (toDegrees(θ) + 360) % 360;
};

const interpolate = (from: Waypoint, to: Waypoint, fraction: number) => {
    const lat = from.lat + (to.lat - from.lat) * fraction;
    const lng = from.lng + (to.lng - from.lng) * fraction;
    const alt = from.alt + (to.alt - from.alt) * fraction;
    return { lat, lng, alt };
};


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
  
  const simulationRef = useRef<{
    animationFrameId: number | null;
    currentWaypointIndex: number;
    progress: number; // meters traveled towards next waypoint
    lastFrameTime: number;
  }>({
    animationFrameId: null,
    currentWaypointIndex: 0,
    progress: 0,
    lastFrameTime: 0,
  });

  const stopSimulation = () => {
    if (simulationRef.current.animationFrameId) {
      cancelAnimationFrame(simulationRef.current.animationFrameId);
    }
    setIsSimulating(false);
    setTelemetry(null);
    simulationRef.current = { animationFrameId: null, currentWaypointIndex: 0, progress: 0, lastFrameTime: 0 };
  };

  const startSimulation = () => {
    if (currentMission.waypoints.length < 2) {
      alert("Cannot start simulation. At least 2 waypoints are required for a flight path.");
      return;
    }
    stopSimulation(); // Reset any existing simulation
    
    simulationRef.current = {
        animationFrameId: null,
        currentWaypointIndex: 0,
        progress: 0,
        lastFrameTime: performance.now(),
    };
    
    const firstWp = currentMission.waypoints[0];
    setTelemetry({
        lat: firstWp.lat, lng: firstWp.lng, alt: firstWp.alt,
        heading: getBearing(firstWp, currentMission.waypoints[1]),
        speed: 0, battery: 100, signal: 99
    });

    setIsSimulating(true);
  };
  
  useEffect(() => {
    if (!isSimulating) return;

    const simulationLoop = (timestamp: number) => {
        const sim = simulationRef.current;
        const waypoints = currentMission.waypoints;

        const deltaTime = (timestamp - sim.lastFrameTime) / 1000; // in seconds
        sim.lastFrameTime = timestamp;

        const fromWp = waypoints[sim.currentWaypointIndex];
        const toWpIndex = sim.currentWaypointIndex + 1;
        
        if (toWpIndex >= waypoints.length) {
            stopSimulation();
            return;
        }
        const toWp = waypoints[toWpIndex];

        const segmentDistance = getDistance(fromWp, toWp);
        const speed = fromWp.speed; // meters per second
        
        sim.progress += speed * deltaTime;

        if (sim.progress >= segmentDistance) {
            // Move to next segment
            sim.currentWaypointIndex++;
            sim.progress = 0;
            if (sim.currentWaypointIndex >= waypoints.length - 1) {
                stopSimulation();
                return;
            }
        } else {
            const fraction = sim.progress / segmentDistance;
            const currentPosition = interpolate(fromWp, toWp, fraction);
            const heading = getBearing(fromWp, toWp);

            const totalWaypoints = waypoints.length;
            const completedWaypoints = sim.currentWaypointIndex + fraction;
            
            setTelemetry({
                lat: currentPosition.lat,
                lng: currentPosition.lng,
                alt: currentPosition.alt,
                heading: heading,
                speed: speed,
                battery: 100 - (completedWaypoints / (totalWaypoints -1)) * 50,
                signal: 95 - Math.random() * 5,
            });
        }
        
        sim.animationFrameId = requestAnimationFrame(simulationLoop);
    };

    simulationRef.current.animationFrameId = requestAnimationFrame(simulationLoop);

    return () => {
        if (simulationRef.current.animationFrameId) {
            cancelAnimationFrame(simulationRef.current.animationFrameId);
        }
    };
  }, [isSimulating, currentMission.waypoints]);


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