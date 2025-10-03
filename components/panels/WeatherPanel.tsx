
import React from 'react';
import { MOCK_WEATHER_DATA } from '../../constants';
import { WeatherData } from '../../types';

const WeatherCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-base-100 p-4 rounded-lg">
    <h4 className="text-md font-bold text-primary mb-2">{title}</h4>
    <div className="text-sm text-slate-300 space-y-1">{children}</div>
  </div>
);

const WeatherPanel: React.FC = () => {
    // In a real app, you would fetch this data from an API.
    const weather: WeatherData = MOCK_WEATHER_DATA;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Weather & Aviation Data</h3>
            <p className="text-sm text-slate-400">
                Data for KLAX (Los Angeles Intl). This is mock data for demonstration purposes.
            </p>

            <WeatherCard title="METAR">
                <code className="font-mono bg-base-300/50 p-2 rounded block text-xs">{weather.metar}</code>
            </WeatherCard>

            <WeatherCard title="TAF">
                <code className="font-mono bg-base-300/50 p-2 rounded block text-xs">{weather.taf}</code>
            </WeatherCard>

            <WeatherCard title="Forecast">
                <div className="grid grid-cols-4 gap-2 text-center">
                    {weather.forecast.map((f, i) => (
                        <div key={i} className="bg-base-300/50 p-2 rounded">
                            <div className="font-semibold">{f.time}</div>
                            <div className="text-lg font-bold text-secondary">{f.temperature}°C</div>
                            <div className="text-xs text-slate-400">{f.windSpeed} kts @ {f.windDirection}°</div>
                        </div>
                    ))}
                </div>
            </WeatherCard>
        </div>
    );
};

export default WeatherPanel;
