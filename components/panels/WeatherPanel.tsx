
import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useWeather } from '../../hooks/useWeather';

const WeatherCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-base-100 p-4 rounded-lg">
    <h4 className="text-md font-bold text-primary mb-2">{title}</h4>
    <div className="text-sm text-slate-300 space-y-1">{children}</div>
  </div>
);

const WeatherPanel: React.FC = () => {
    const { openWeatherApiKey } = useSettings();
    const { weather, isLoading, error } = useWeather();

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Weather & Aviation Data</h3>
            
            {error && <p className="text-accent text-sm bg-accent/20 p-2 rounded-md">Error: {error}</p>}
            
            {!openWeatherApiKey && (
                 <p className="text-sm text-slate-400">
                    Go to the <strong className="text-primary">'Settings'</strong> panel and enter an OpenWeather API key to view live data. Showing mock data for KLAX.
                </p>
            )}

            <WeatherCard title="METAR">
                <code className="font-mono bg-base-300/50 p-2 rounded block text-xs">{weather.metar}</code>
            </WeatherCard>

            <WeatherCard title="TAF">
                <code className="font-mono bg-base-300/50 p-2 rounded block text-xs">{weather.taf}</code>
            </WeatherCard>

            <WeatherCard title="5-Day Forecast">
                {isLoading ? <p>Loading forecast...</p> : (
                    <div className="grid grid-cols-5 gap-2 text-center">
                        {weather.forecast.map((f, i) => (
                            <div key={i} className="bg-base-300/50 p-2 rounded-md flex flex-col items-center justify-between">
                                <div className="font-bold text-slate-200">{f.day}</div>
                                <img src={`https://openweathermap.org/img/wn/${f.weather_icon}.png`} alt={f.weather_main} className="w-10 h-10" />
                                <div className="text-sm font-semibold text-secondary">{f.temp_max}°F / {f.temp_min}°F</div>
                                <div className="text-xs text-slate-400 mt-1">💧{f.humidity}%</div>
                                <div className="text-xs text-slate-400">☔️ {f.precipitation}%</div>
                            </div>
                        ))}
                    </div>
                )}
            </WeatherCard>
        </div>
    );
};

export default WeatherPanel;