import { WeatherData, ActivePanel } from './types';

export const DEFAULT_ALTITUDE = 100;
export const DEFAULT_SPEED = 15;

export const MOCK_WEATHER_DATA: WeatherData = {
  metar: 'METAR KLAX 121852Z 25012KT 10SM FEW040 25/10 A2992 RMK AO2 SLP132 T02500100',
  taf: 'TAF KLAX 121720Z 1218/1324 26010KT P6SM FEW030 SCT250 FM130200 24008KT P6SM SKC FM131500 VRB03KT P6SM SKC',
  forecast: [
    { day: 'Mon', temp_min: 64, temp_max: 77, humidity: 60, precipitation: 10, weather_icon: '01d', weather_main: 'Clear', wind_speed: 5, wind_deg: 270 },
    { day: 'Tue', temp_min: 66, temp_max: 79, humidity: 65, precipitation: 20, weather_icon: '02d', weather_main: 'Clouds', wind_speed: 8, wind_deg: 260 },
    { day: 'Wed', temp_min: 68, temp_max: 81, humidity: 70, precipitation: 30, weather_icon: '10d', weather_main: 'Rain', wind_speed: 12, wind_deg: 250 },
    { day: 'Thu', temp_min: 66, temp_max: 79, humidity: 68, precipitation: 15, weather_icon: '03d', weather_main: 'Cloudy', wind_speed: 10, wind_deg: 280 },
    { day: 'Fri', temp_min: 70, temp_max: 82, humidity: 62, precipitation: 5, weather_icon: '01d', weather_main: 'Clear', wind_speed: 6, wind_deg: 275 },
  ],
  alerts: [],
};

export const SIDEBAR_PANELS: ActivePanel[] = [
  ActivePanel.EDITOR,
  ActivePanel.LIBRARY,
  ActivePanel.WEATHER,
  ActivePanel.SETTINGS
];