
import React, { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';

const ApiKeyInput: React.FC<{
    title: string;
    description: string;
    value: string | null;
    onSave: (key: string) => void;
}> = ({ title, description, value, onSave }) => {
    const [localKey, setLocalKey] = useState(value || '');

    useEffect(() => {
        setLocalKey(value || '');
    }, [value]);

    const handleSave = () => {
        if (localKey.trim()) {
            onSave(localKey.trim());
            alert(`${title} API Key saved!`);
        } else {
            alert('Please enter a valid API key.');
        }
    };

    return (
        <div>
            <h3 className="text-lg font-bold text-slate-100">{title}</h3>
            <div className="p-3 bg-base-100 rounded-md space-y-2 mt-2">
                <p className="text-xs text-slate-500 mb-2">{description}</p>
                <input
                    type="password"
                    value={localKey}
                    onChange={(e) => setLocalKey(e.target.value)}
                    placeholder={`Enter your ${title} API Key`}
                    className="w-full bg-base-300 p-2 rounded-md border-transparent focus:border-primary focus:ring-0 text-slate-100"
                />
                <div className="flex space-x-2 pt-2">
                    <button onClick={handleSave} className="flex-1 bg-primary hover:bg-sky-500 text-white font-semibold py-2 px-2 rounded-md transition-colors text-sm">
                        Save Key
                    </button>
                    <button onClick={() => { onSave(''); setLocalKey(''); }} className="flex-1 bg-base-300 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-2 rounded-md transition-colors text-sm">
                        Clear Key
                    </button>
                </div>
            </div>
        </div>
    );
};

const SettingsPanel: React.FC = () => {
    const {
        googleMapsApiKey,
        openWeatherApiKey,
        setGoogleMapsApiKey,
        setOpenWeatherApiKey,
        unitSystem,
        setUnitSystem,
    } = useSettings();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-100 border-b border-base-300 pb-2">Configuration</h2>
                <p className="text-sm text-slate-400 mt-2">
                    Manage API keys and application-wide settings.
                </p>
            </div>

            <div>
                 <h3 className="text-lg font-bold text-slate-100">Unit System</h3>
                 <div className="p-3 bg-base-100 rounded-md space-y-2 mt-2">
                     <p className="text-xs text-slate-500 mb-2">Choose the display units for altitude, speed, and distance.</p>
                     <div className="flex bg-base-300 p-1 rounded-md">
                        <button 
                            onClick={() => setUnitSystem('imperial')}
                            className={`flex-1 text-sm py-1 rounded-md transition-colors ${unitSystem === 'imperial' ? 'bg-primary text-white font-semibold' : 'hover:bg-base-200'}`}
                        >
                            Imperial (ft)
                        </button>
                        <button 
                            onClick={() => setUnitSystem('metric')}
                            className={`flex-1 text-sm py-1 rounded-md transition-colors ${unitSystem === 'metric' ? 'bg-primary text-white font-semibold' : 'hover:bg-base-200'}`}
                        >
                            Metric (m)
                        </button>
                     </div>
                 </div>
            </div>

            <ApiKeyInput
                title="Google Maps"
                description="Required for displaying the satellite map and searching for locations."
                value={googleMapsApiKey}
                onSave={setGoogleMapsApiKey}
            />
            <ApiKeyInput
                title="OpenWeather"
                description="Required for fetching live weather forecast data."
                value={openWeatherApiKey}
                onSave={setOpenWeatherApiKey}
            />
        </div>
    );
};

export default SettingsPanel;
