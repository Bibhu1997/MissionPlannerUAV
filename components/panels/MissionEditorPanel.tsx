import React, { useState, useMemo } from 'react';
import { useMissionState, useMissionDispatch } from '../../hooks/useMission';
import { Waypoint } from '../../types';
import { useTelemetry } from '../../hooks/useTelemetry';
import AltitudeProfileChart from '../AltitudeProfileChart';
import { useEditorMode } from '../../hooks/useEditorMode';

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
);
const ChevronDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform"><polyline points="6 9 12 15 18 9"></polyline></svg>
const AlertTriangle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-orange-400"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>

const getDistance = (from: { lat: number, lng: number }, to: { lat: number, lng: number }) => {
    const R = 6371e3;
    const toRad = (v: number) => v * Math.PI / 180;
    const dLat = toRad(to.lat - from.lat);
    const dLon = toRad(to.lng - from.lng);
    const lat1 = toRad(from.lat);
    const lat2 = toRad(to.lat);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};


const MissionEditorPanel: React.FC = () => {
    const { currentMission } = useMissionState();
    const dispatch = useMissionDispatch();
    const { isSimulating, startSimulation, stopSimulation } = useTelemetry();
    const { mode, setMode } = useEditorMode();
    const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null);

    const validationErrors = useMemo(() => {
        const errors: string[] = [];
        const { waypoints } = currentMission;
        
        // Check for unsafe altitude
        if (waypoints.some(wp => wp.alt < 20)) {
            errors.push("At least one waypoint is below the 20m minimum safe altitude.");
        }

        // Check for duplicate waypoints
        const positions = new Set(waypoints.map(wp => `${wp.lat.toFixed(6)},${wp.lng.toFixed(6)}`));
        if (positions.size !== waypoints.length) {
            errors.push("Duplicate waypoints found at the same coordinates.");
        }

        // Check for excessive flight time
        let estimatedTime = 0;
        for (let i = 0; i < waypoints.length - 1; i++) {
            const from = waypoints[i];
            const to = waypoints[i+1];
            const distance = getDistance(from, to);
            if (from.speed > 0) estimatedTime += distance / from.speed;
        }
        if (estimatedTime > 20 * 60) { // 20 minutes
            errors.push(`Estimated flight time (${Math.round(estimatedTime / 60)} min) may exceed standard battery life.`);
        }

        return errors;
    }, [currentMission.waypoints]);

    const handleUpdate = (id: string, field: keyof Waypoint, value: string) => {
        const numValue = parseFloat(value);
        if(!isNaN(numValue)) {
            const waypointToUpdate = currentMission.waypoints.find(wp => wp.id === id);
            if (waypointToUpdate) {
                dispatch({ type: 'UPDATE_WAYPOINT', payload: { ...waypointToUpdate, [field]: numValue } });
            }
        }
    };

    const handleDelete = (id: string, index: number) => {
        if (window.confirm(`Are you sure you want to delete Waypoint ${index + 1}?`)) {
            dispatch({ type: 'DELETE_WAYPOINT', payload: { id } });
        }
    }
    
    return (
        <div className="space-y-4">
             {validationErrors.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-lg space-y-2">
                    <div className="flex items-center space-x-2">
                        <AlertTriangle />
                        <h4 className="text-md font-bold text-orange-400">Plan Validation</h4>
                    </div>
                    <ul className="list-disc list-inside text-sm text-orange-300 space-y-1">
                        {validationErrors.map((error, i) => <li key={i}>{error}</li>)}
                    </ul>
                </div>
            )}
            <div>
                <h3 className="text-md font-bold text-slate-100 mb-1">Mission Details</h3>
                <div className="space-y-3 bg-base-100 p-3 rounded-md">
                    <input 
                        type="text" 
                        value={currentMission.name} 
                        onChange={(e) => dispatch({ type: 'SET_MISSION_NAME', payload: e.target.value })}
                        className="w-full bg-base-300 p-2 rounded-md border-transparent focus:border-primary focus:ring-0 text-slate-100"
                    />
                     <div className="grid grid-cols-2 gap-2">
                        <input
                            type="number" placeholder="Home Latitude"
                            value={currentMission.homePosition?.lat ?? ''}
                            onChange={e => dispatch({type: 'SET_HOME_POSITION', payload: { ...currentMission.homePosition!, lat: parseFloat(e.target.value) || 0 }})}
                            className="w-full bg-base-300 p-2 rounded-md border-transparent focus:border-primary focus:ring-0 text-slate-100"
                        />
                        <input
                            type="number" placeholder="Home Longitude"
                            value={currentMission.homePosition?.lng ?? ''}
                            onChange={e => dispatch({type: 'SET_HOME_POSITION', payload: { ...currentMission.homePosition!, lng: parseFloat(e.target.value) || 0 }})}
                            className="w-full bg-base-300 p-2 rounded-md border-transparent focus:border-primary focus:ring-0 text-slate-100"
                        />
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-md font-bold text-slate-100 mb-1">Mission Boundary</h3>
                <div className="flex space-x-2">
                    <button onClick={() => setMode(mode === 'BOUNDARY' ? 'WAYPOINT' : 'BOUNDARY')} className={`flex-1 py-2 px-4 text-sm rounded-md font-semibold transition-colors text-white ${mode === 'BOUNDARY' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-sky-500'}`}>
                        {mode === 'BOUNDARY' ? 'Finish Drawing' : 'Draw Boundary'}
                    </button>
                    <button onClick={() => dispatch({ type: 'CLEAR_BOUNDARY' })} disabled={!currentMission.boundary || currentMission.boundary.length === 0} className="flex-1 py-2 px-4 text-sm rounded-md font-semibold transition-colors bg-base-300 hover:bg-slate-600 text-slate-200 disabled:bg-base-300/50 disabled:cursor-not-allowed">
                        Clear Boundary
                    </button>
                </div>
            </div>

            {currentMission.waypoints.length > 1 && <AltitudeProfileChart waypoints={currentMission.waypoints} />}
            
            <div className="flex items-center justify-between pt-2">
                <h4 className="font-semibold text-slate-200">Waypoints ({currentMission.waypoints.length})</h4>
                <button onClick={isSimulating ? stopSimulation : startSimulation} disabled={currentMission.waypoints.length < 2} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors text-white ${isSimulating ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600 disabled:bg-base-300 disabled:cursor-not-allowed'}`}>
                    {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
                </button>
            </div>

            <div className="space-y-2">
                {currentMission.waypoints.length > 0 ? (
                    currentMission.waypoints.map((wp, index) => {
                        const isSelected = selectedWaypointId === wp.id;
                        return (
                            <div key={wp.id} className={`bg-base-100 rounded-md transition-all duration-200 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                                <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setSelectedWaypointId(isSelected ? null : wp.id)}>
                                    <h4 className="font-bold text-slate-200">Waypoint {index + 1}</h4>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(wp.id, index); }} className="text-slate-400 hover:text-accent p-1 rounded-full transition-colors"><TrashIcon /></button>
                                        <div className={`${isSelected ? 'rotate-180' : ''} transition-transform`}><ChevronDown /></div>
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="p-3 border-t border-base-300 space-y-3">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                             <input type="number" value={wp.lat.toFixed(6)} onChange={e => handleUpdate(wp.id, 'lat', e.target.value)} title="Latitude" className="w-full bg-base-300 p-1 rounded-md border-transparent focus:border-primary focus:ring-0" />
                                             <input type="number" value={wp.lng.toFixed(6)} onChange={e => handleUpdate(wp.id, 'lng', e.target.value)} title="Longitude" className="w-full bg-base-300 p-1 rounded-md border-transparent focus:border-primary focus:ring-0" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-400 flex justify-between">Altitude (m) <span>{wp.alt}m</span></label>
                                            <input type="range" min="20" max="120" step="1" value={wp.alt} onChange={e => handleUpdate(wp.id, 'alt', e.target.value)} className="w-full h-2 bg-base-300 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-400 flex justify-between">Speed (m/s) <span>{wp.speed}m/s</span></label>
                                            <input type="range" min="1" max="25" step="1" value={wp.speed} onChange={e => handleUpdate(wp.id, 'speed', e.target.value)} className="w-full h-2 bg-base-300 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-8 bg-base-100 rounded-md">
                        <p className="text-slate-400">Click on the map to add waypoints.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MissionEditorPanel;