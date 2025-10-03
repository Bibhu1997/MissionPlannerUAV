import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { WeatherData, ForecastDetail } from '../types';
import { useSettings } from './useSettings';
import { MOCK_WEATHER_DATA } from '../constants';

interface WeatherState {
  weather: WeatherData;
  isLoading: boolean;
  error: string | null;
}

const WeatherContext = createContext<WeatherState | undefined>(undefined);

const processWeatherData = (data: any): ForecastDetail[] => {
    const dailyData: { [key: string]: any[] } = {};
    data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
        if (!dailyData[date]) {
            dailyData[date] = [];
        }
        dailyData[date].push(item);
    });

    return Object.keys(dailyData).slice(0, 5).map(day => {
        const dayEntries = dailyData[day];
        const temps = dayEntries.map(e => e.main.temp);
        const humidity = dayEntries.map(e => e.main.humidity);
        const precipitation = dayEntries.map(e => e.pop);
        const middayEntry = dayEntries.find(e => new Date(e.dt * 1000).getHours() >= 12) || dayEntries[0];

        return {
            day: day,
            temp_min: Math.round(Math.min(...temps)),
            temp_max: Math.round(Math.max(...temps)),
            humidity: Math.round(humidity.reduce((a, b) => a + b) / humidity.length),
            precipitation: Math.round(Math.max(...precipitation) * 100),
            weather_icon: middayEntry.weather[0].icon,
            weather_main: middayEntry.weather[0].main,
        };
    });
}


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
            const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}&units=imperial`;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to fetch weather data. Status: ${response.status}`);
                }
                const data = await response.json();
                const processedForecast = processWeatherData(data);
                setWeather(prev => ({ ...prev, forecast: processedForecast }));
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
