
import React, { useState } from 'react';
import { ActivePanel } from '../types';
import MissionEditorPanel from './panels/MissionEditorPanel';
import MissionLibraryPanel from './panels/MissionLibraryPanel';
import WeatherPanel from './panels/WeatherPanel';
import SettingsPanel from './panels/SettingsPanel';
import { SIDEBAR_PANELS } from '../constants';

const PanelIcon: React.FC<{ panel: ActivePanel }> = ({ panel }) => {
    // FIX: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
    const icons: { [key in ActivePanel]: React.ReactElement } = {
        [ActivePanel.EDITOR]: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>,
        [ActivePanel.LIBRARY]: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
        [ActivePanel.WEATHER]: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M22 10a3 3 0 0 0-3-3h-2.207a5.502 5.502 0 0 0-10.702.5"/></svg>,
        [ActivePanel.SETTINGS]: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.73l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1 0-2.73l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
    }
    return icons[panel];
}

const Sidebar: React.FC = () => {
    const [activePanel, setActivePanel] = useState<ActivePanel>(ActivePanel.EDITOR);

    const renderPanel = () => {
        switch (activePanel) {
            case ActivePanel.EDITOR:
                return <MissionEditorPanel />;
            case ActivePanel.LIBRARY:
                return <MissionLibraryPanel />;
            case ActivePanel.WEATHER:
                return <WeatherPanel />;
            case ActivePanel.SETTINGS:
                return <SettingsPanel />;
            default:
                return null;
        }
    };

    return (
        <aside className="w-[400px] bg-base-200 border-l border-base-300 flex flex-col shadow-lg shrink-0">
            <div className="flex items-center border-b border-base-300">
                {SIDEBAR_PANELS.map(panel => (
                    <button
                        key={panel}
                        onClick={() => setActivePanel(panel)}
                        className={`flex-1 flex items-center justify-center space-x-2 p-3 text-sm font-semibold transition-colors duration-200 ${
                            activePanel === panel
                                ? 'bg-base-100 text-primary border-b-2 border-primary'
                                : 'text-slate-400 hover:bg-base-300/50'
                        }`}
                    >
                       <PanelIcon panel={panel} />
                       <span>{panel}</span>
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {renderPanel()}
            </div>
        </aside>
    );
};

export default Sidebar;