import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useWeather } from '../../hooks/useWeather';

const WeatherCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-base-100 p-4 rounded-lg">
    <h4 className="text-md font-bold text-primary mb-2">{title}</h4>
    <div className="text-sm text-slate-300 space-y-1">{children}</div>
  </div>
);

const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-accent"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);

const WeatherPanel: React.FC = () => {
    const { openWeatherApiKey } = useSettings();
    const { weather, isLoading, error } = useWeather();
    const hasAlerts = weather.alerts && weather.alerts.length > 0;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Weather & Aviation Data</h3>
            
            {hasAlerts && (
                <div className="bg-accent/10 border border-accent/30 p-3 rounded-lg space-y-3">
                    <div className="flex items-center space-x-2">
                        <AlertIcon />
                        <h4 className="text-md font-bold text-accent">Critical Weather Alerts</h4>
                    </div>
                    {weather.alerts!.map((alert, index) => (
                        <div key={index} className="text-sm border-t border-accent/20 pt-2">
                            <p className="font-semibold text-pink-300">{alert.event}</p>
                            <p className="text-xs text-slate-400">Source: {alert.sender_name}</p>
                            <p className="text-xs text-slate-400 mt-1">{alert.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {error && <p className="text-accent text-sm bg-accent/20 p-2 rounded-md">Error: {error}</p>}
            
            {!openWeatherApiKey && (
                 <p className="text-sm text-slate-400">
                    Go to the <strong className="text-primary">'Settings'</strong> panel and enter an OpenWeather API key to view live data. Showing mock data for KLAX.
                </p>
            )}

            <WeatherCard title="METAR">
                <code className="font-mono bg-base-300/50 p-2 rounded block text-xs">{weather.metar}</code>
            {/* FIX: Corrected typo in closing tag from WebatherCard to WeatherCard. */}
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