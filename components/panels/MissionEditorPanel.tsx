
import React from 'react';
import { useMissionState, useMissionDispatch } from '../../hooks/useMission';
import { Waypoint } from '../../types';
import { useTelemetry } from '../../hooks/useTelemetry';
import AltitudeProfileChart from '../AltitudeProfileChart';
import { useEditorMode } from '../../hooks/useEditorMode';

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
);

const WaypointEditor: React.FC<{ waypoint: Waypoint; index: number }> = ({ waypoint, index }) => {
    const dispatch = useMissionDispatch();
    
    const handleUpdate = (field: keyof Waypoint, value: string) => {
        const numValue = parseFloat(value);
        if(!isNaN(numValue)) {
            dispatch({ type: 'UPDATE_WAYPOINT', payload: { ...waypoint, [field]: numValue } });
        }
    };

    const handleDelete = () => {
        dispatch({ type: 'DELETE_WAYPOINT', payload: { id: waypoint.id } });
    }

    return (
        <div className="p-3 bg-base-100 rounded-md space-y-2">
            <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-200">Waypoint {index + 1}</h4>
                <button onClick={handleDelete} className="text-slate-400 hover:text-accent p-1 rounded-full transition-colors"><TrashIcon /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                    <label className="block text-xs font-medium text-slate-400">Lat</label>
                    <input type="number" value={waypoint.lat.toFixed(6)} readOnly className="w-full bg-base-300/50 p-1 rounded-md border-transparent focus:border-primary focus:ring-0" />
                </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-400">Lon</label>
                    <input type="number" value={waypoint.lng.toFixed(6)} readOnly className="w-full bg-base-300/50 p-1 rounded-md border-transparent focus:border-primary focus:ring-0" />
                </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-400">Alt (m)</label>
                    <input type="number" value={waypoint.alt} onChange={e => handleUpdate('alt', e.target.value)} className="w-full bg-base-300 p-1 rounded-md border-transparent focus:border-primary focus:ring-0" />
                </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-400">Speed (m/s)</label>
                    <input type="number" value={waypoint.speed} onChange={e => handleUpdate('speed', e.target.value)} className="w-full bg-base-300 p-1 rounded-md border-transparent focus:border-primary focus:ring-0" />
                </div>
            </div>
        </div>
    );
};

const MissionEditorPanel: React.FC = () => {
    const { currentMission } = useMissionState();
    const dispatch = useMissionDispatch();
    const { isSimulating, startSimulation, stopSimulation } = useTelemetry();
    const { mode, setMode } = useEditorMode();

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({ type: 'SET_MISSION_NAME', payload: e.target.value });
    }

    const handleHomePositionChange = (field: 'lat' | 'lng', value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            dispatch({
                type: 'SET_HOME_POSITION',
                payload: {
                    ...currentMission.homePosition,
                    lat: currentMission.homePosition?.lat ?? 0,
                    lng: currentMission.homePosition?.lng ?? 0,
                    [field]: numValue
                }
            });
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Mission Details</h3>
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Mission Name</label>
                    <input 
                        type="text" 
                        value={currentMission.name} 
                        onChange={handleNameChange}
                        className="w-full bg-base-300 p-2 rounded-md border-transparent focus:border-primary focus:ring-0 text-slate-100"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Home Position</label>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="number"
                            placeholder="Latitude"
                            value={currentMission.homePosition?.lat ?? ''}
                            onChange={e => handleHomePositionChange('lat', e.target.value)}
                            className="w-full bg-base-300 p-2 rounded-md border-transparent focus:border-primary focus:ring-0 text-slate-100"
                        />
                        <input
                            type="number"
                            placeholder="Longitude"
                            value={currentMission.homePosition?.lng ?? ''}
                            onChange={e => handleHomePositionChange('lng', e.target.value)}
                            className="w-full bg-base-300 p-2 rounded-md border-transparent focus:border-primary focus:ring-0 text-slate-100"
                        />
                    </div>
                </div>
                 <div className="pt-2">
                    <label className="block text-sm font-medium text-slate-400 mb-1">Mission Boundary</label>
                    <p className="text-xs text-slate-500 mb-2">
                        {mode === 'BOUNDARY' 
                            ? 'Click on the map to add points. Click the button again to finish.' 
                            : 'Define a polygonal operational area for the mission.'}
                    </p>
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => setMode(mode === 'BOUNDARY' ? 'WAYPOINT' : 'BOUNDARY')}
                            className={`flex-1 py-2 px-4 text-sm rounded-md font-semibold transition-colors text-white ${
                                mode === 'BOUNDARY' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-sky-500'
                            }`}
                        >
                            {mode === 'BOUNDARY' ? 'Finish Drawing' : 'Draw Boundary'}
                        </button>
                        <button 
                            onClick={() => dispatch({ type: 'CLEAR_BOUNDARY' })}
                            disabled={!currentMission.boundary || currentMission.boundary.length === 0}
                            className="flex-1 py-2 px-4 text-sm rounded-md font-semibold transition-colors bg-base-300 hover:bg-slate-600 text-slate-200 disabled:bg-base-300/50 disabled:cursor-not-allowed"
                        >
                            Clear Boundary
                        </button>
                    </div>
                </div>
            </div>

            {currentMission.waypoints.length > 1 && (
                <div className="pt-2">
                    <h4 className="font-semibold text-slate-200 mb-2">Altitude Profile</h4>
                    <AltitudeProfileChart waypoints={currentMission.waypoints} />
                </div>
            )}
            
            <div className="flex items-center justify-between pt-2">
                <h4 className="font-semibold text-slate-200">Waypoints ({currentMission.waypoints.length})</h4>
                <button
                    onClick={isSimulating ? stopSimulation : startSimulation}
                    disabled={currentMission.waypoints.length < 2}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                        isSimulating 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-green-500 hover:bg-green-600 disabled:bg-base-300 disabled:cursor-not-allowed'
                    } text-white`}
                >
                    {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
                </button>
            </div>

            <div className="space-y-3">
                {currentMission.waypoints.length > 0 ? (
                    currentMission.waypoints.map((wp, index) => (
                        <WaypointEditor key={wp.id} waypoint={wp} index={index} />
                    ))
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
