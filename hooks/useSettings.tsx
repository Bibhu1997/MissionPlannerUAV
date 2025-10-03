
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface SettingsState {
  googleMapsApiKey: string | null;
  openWeatherApiKey: string | null;
  setGoogleMapsApiKey: (key: string | null) => void;
  setOpenWeatherApiKey: (key: string | null) => void;
}

const SettingsContext = createContext<SettingsState | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [googleMapsApiKey, setGoogleMapsApiKeyState] = useState<string | null>(null);
  const [openWeatherApiKey, setOpenWeatherApiKeyState] = useState<string | null>(null);

  useEffect(() => {
    const storedGoogleKey = localStorage.getItem('googleMapsApiKey');
    const storedOpenWeatherKey = localStorage.getItem('openWeatherApiKey');
    if (storedGoogleKey) setGoogleMapsApiKeyState(storedGoogleKey);
    if (storedOpenWeatherKey) setOpenWeatherApiKeyState(storedOpenWeatherKey);
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

  return (
    <SettingsContext.Provider value={{ googleMapsApiKey, openWeatherApiKey, setGoogleMapsApiKey, setOpenWeatherApiKey }}>
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