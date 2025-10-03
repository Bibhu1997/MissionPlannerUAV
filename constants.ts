
import { WeatherData, ActivePanel } from './types';

export const DEFAULT_ALTITUDE = 100;
export const DEFAULT_SPEED = 15;

export const MOCK_WEATHER_DATA: WeatherData = {
  metar: 'METAR KLAX 121852Z 25012KT 10SM FEW040 25/10 A2992 RMK AO2 SLP132 T02500100',
  taf: 'TAF KLAX 121720Z 1218/1324 26010KT P6SM FEW030 SCT250 FM130200 24008KT P6SM SKC FM131500 VRB03KT P6SM SKC',
  forecast: [
    { time: '12:00', temperature: 22, windSpeed: 10, windDirection: 250 },
    { time: '15:00', temperature: 25, windSpeed: 12, windDirection: 260 },
    { time: '18:00', temperature: 24, windSpeed: 11, windDirection: 270 },
    { time: '21:00', temperature: 20, windSpeed: 8, windDirection: 240 },
  ],
};

export const PREFLIGHT_CHECKLIST_ITEMS = [
  'UAV battery fully charged',
  'Controller battery fully charged',
  'Propellers secure and undamaged',
  'Gimbal and camera check',
  'GPS lock acquired',
  'Return-to-Home altitude set',
  'Airspace authorization checked (LAANC/NOTAM)',
  'Weather conditions acceptable',
  'Obstacle clearance plan reviewed',
  'Emergency procedures briefed',
];

export const SIDEBAR_PANELS: ActivePanel[] = [
  ActivePanel.EDITOR,
  ActivePanel.LIBRARY,
  ActivePanel.WEATHER,
  ActivePanel.CHECKLIST
];
