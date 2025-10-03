
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { UnitSystem } from '../types';

interface SettingsState {
  googleMapsApiKey: string | null;
  openWeatherApiKey: string | null;
  unitSystem: UnitSystem;
  setGoogleMapsApiKey: (key: string | null) => void;
  setOpenWeatherApiKey: (key: string | null) => void;
  setUnitSystem: (system: UnitSystem) => void;
}

const SettingsContext = createContext<SettingsState | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [googleMapsApiKey, setGoogleMapsApiKeyState] = useState<string | null>(null);
  const [openWeatherApiKey, setOpenWeatherApiKeyState] = useState<string | null>(null);
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>('imperial');

  useEffect(() => {
    const storedGoogleKey = localStorage.getItem('googleMapsApiKey');
    const storedOpenWeatherKey = localStorage.getItem('openWeatherApiKey');
    const storedUnitSystem = localStorage.getItem('unitSystem') as UnitSystem;
    if (storedGoogleKey) setGoogleMapsApiKeyState(storedGoogleKey);
    if (storedOpenWeatherKey) setOpenWeatherApiKeyState(storedOpenWeatherKey);
    if (storedUnitSystem) setUnitSystemState(storedUnitSystem);
  }, []);

  const setGoogleMapsApiKey = (key: string | null) => {
    setGoogleMapsApiKeyState(key);
    if (key) {
      localStorage.setItem('googleMapsApiKey', key);
    } else {
      localStorage.removeItem('googleMapsApiKey');
    }
  };

  const setOpenWeatherApiKey = (key: string | null) => {
    setOpenWeatherApiKeyState(key);
    if (key) {
      localStorage.setItem('openWeatherApiKey', key);
    } else {
      localStorage.removeItem('openWeatherApiKey');
    }
  };

  const setUnitSystem = (system: UnitSystem) => {
    setUnitSystemState(system);
    localStorage.setItem('unitSystem', system);
  };

  return (
    <SettingsContext.Provider value={{ googleMapsApiKey, openWeatherApiKey, setGoogleMapsApiKey, setOpenWeatherApiKey, unitSystem, setUnitSystem }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsState => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
