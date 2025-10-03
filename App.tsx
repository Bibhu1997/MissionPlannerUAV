
import React from 'react';
import { MissionProvider } from './hooks/useMission';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapCanvas from './components/MapCanvas';
import { TelemetryProvider } from './hooks/useTelemetry';
import { SettingsProvider } from './hooks/useSettings';
import { WeatherProvider } from './hooks/useWeather';
import { EditorModeProvider } from './hooks/useEditorMode';

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <WeatherProvider>
        <EditorModeProvider>
          <MissionProvider>
            <TelemetryProvider>
              <div className="flex flex-col h-screen w-screen overflow-hidden bg-base-100 text-slate-300">
                <Header />
                <div className="flex flex-1 overflow-hidden">
                  <main className="flex-1 relative">
                    <MapCanvas />
                  </main>
                  <Sidebar />
                </div>
              </div>
            </TelemetryProvider>
          </MissionProvider>
        </EditorModeProvider>
      </WeatherProvider>
    </SettingsProvider>
  );
};

export default App;