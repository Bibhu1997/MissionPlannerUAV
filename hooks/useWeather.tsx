import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { WeatherData, ForecastDetail, Alert } from '../types';
import { useSettings } from './useSettings';
import { MOCK_WEATHER_DATA } from '../constants';

interface WeatherState {
  weather: WeatherData;
  isLoading: boolean;
  error: string | null;
}

const WeatherContext = createContext<WeatherState | undefined>(undefined);

const processForecastData = (daily: any[]): ForecastDetail[] => {
    if (!daily) return [];
    return daily.slice(0, 5).map(day => ({
        day: new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        temp_min: Math.round(day.temp.min),
        temp_max: Math.round(day.temp.max),
        humidity: day.humidity,
        precipitation: Math.round(day.pop * 100),
        weather_icon: day.weather[0].icon,
        weather_main: day.weather[0].main,
        wind_speed: Math.round(day.wind_speed),
        wind_deg: day.wind_deg,
    }));
};

export const WeatherProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { openWeatherApiKey } = useSettings();
    const [weather, setWeather] = useState<WeatherData>(MOCK_WEATHER_DATA);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!openWeatherApiKey) {
            setWeather(MOCK_WEATHER_DATA);
            setError(null);
            return;
        };

        const fetchWeather = async () => {
            setIsLoading(true);
            setError(null);
            const lat = 34.0522;
            const lon = -118.2437;
            // Using One Call API 3.0 for forecast and alerts
            const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}&units=imperial&exclude=current,minutely,hourly`;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to fetch weather data. Status: ${response.status}`);
                }
                const data = await response.json();
                const processedForecast = processForecastData(data.daily);
                const alerts: Alert[] = data.alerts || [];
                
                setWeather(prev => ({ 
                    ...prev, 
                    forecast: processedForecast,
                    alerts: alerts
                }));

            } catch (err: any) {
                setError(err.message);
                console.error(err);
                setWeather(MOCK_WEATHER_DATA);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWeather();
    }, [openWeatherApiKey]);

    return (
        <WeatherContext.Provider value={{ weather, isLoading, error }}>
            {children}
        </WeatherContext.Provider>
    );
};

export const useWeather = (): WeatherState => {
    const context = useContext(WeatherContext);
    if (context === undefined) {
        throw new Error('useWeather must be used within a WeatherProvider');
    }
    return context;
};