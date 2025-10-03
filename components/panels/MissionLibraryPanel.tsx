import React from 'react';
import { useMissionState, useMissionDispatch } from '../../hooks/useMission';
import { Mission } from '../../types';
import * as exportService from '../../services/exportService';
import { useWeather } from '../../hooks/useWeather';

const MissionLibraryPanel: React.FC = () => {
    const { currentMission, savedMissions } = useMissionState();
    const { weather } = useWeather();
    const dispatch = useMissionDispatch();

    const handleSave = () => {
        dispatch({ type: 'SAVE_MISSION' });
        alert(`Mission "${currentMission.name}" saved!`);
    };

    const handleNew = () => {
        if(confirm("Are you sure you want to create a new mission? Any unsaved changes will be lost.")) {
            dispatch({ type: 'CREATE_NEW_MISSION' });
        }
    };
    
    const handleLoad = (mission: Mission) => {
        if(confirm(`Are you sure you want to load "${mission.name}"? Any unsaved changes will be lost.`)) {
            dispatch({ type: 'LOAD_MISSION', payload: mission });
        }
    };

    const handleDelete = (mission: Mission) => {
        if(confirm(`Are you sure you want to delete "${mission.name}"? This action cannot be undone.`)) {
            dispatch({ type: 'DELETE_SAVED_MISSION', payload: { id: mission.id } });
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">Current Mission</h3>
                <div className="flex space-x-2">
                     <button onClick={handleNew} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                        New Mission
                    </button>
                    <button onClick={handleSave} className="flex-1 bg-primary hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                        Save Current
                    </button>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">Saved Missions</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {savedMissions.length > 0 ? savedMissions.map(m => (
                        <div key={m.id} className="flex items-center justify-between p-2 bg-base-100 rounded-md">
                            <span className="font-medium">{m.name}</span>
                            <div className="space-x-2">
                                <button onClick={() => handleLoad(m)} className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded hover:bg-secondary/40">Load</button>
                                <button onClick={() => handleDelete(m)} className="text-xs bg-accent/20 text-accent px-2 py-1 rounded hover:bg-accent/40">Delete</button>
                            </div>
                        </div>
                    )) : <p className="text-slate-400 text-sm">No saved missions.</p>}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">Export Mission</h3>
                 <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => exportService.exportToGeoJSON(currentMission)} className="bg-base-300 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-md transition-colors">GeoJSON</button>
                    <button onClick={() => exportService.exportToKML(currentMission)} className="bg-base-300 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-md transition-colors">KML</button>
                    <button onClick={() => exportService.exportToCSV(currentMission)} className="bg-base-300 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-md transition-colors">CSV</button>
                    <button onClick={() => exportService.exportToMAVLink(currentMission)} className="bg-base-300 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-md transition-colors">MAVLink (Plan)</button>
                    <button onClick={() => exportService.exportToPDF(currentMission, weather)} className="col-span-2 bg-accent/80 hover:bg-accent text-white font-semibold py-2 px-4 rounded-md transition-colors">PDF Brief</button>
                </div>
            </div>
        </div>
    );
};

export default MissionLibraryPanel;