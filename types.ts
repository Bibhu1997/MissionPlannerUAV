export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  alt: number;
  speed: number;
  altType: 'MSL' | 'AGL'; // Mean Sea Level (Absolute) vs Above Ground Level (Relative)
  terrain_alt?: number; // Ground elevation at this point
}

export interface Mission {
  id:string;
  name: string;
  waypoints: Waypoint[];
  homePosition?: { lat: number; lng: number };
  boundary?: { lat: number; lng: number }[];
  terrainProfile?: { elevation: number }[];
}

export interface Telemetry {
  lat: number;
  lng: number;
  alt: number;
  heading: number;
  speed: number;
  battery: number;
  signal: number;
}

export interface ForecastDetail {
  day: string;
  temp_min: number;
  temp_max: number;
  humidity: number;
  precipitation: number; // Probability
  weather_icon: string;
  weather_main: string;
  wind_speed: number;
  wind_deg: number;
}

export interface Alert {
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
}

export interface WeatherData {
  metar: string;
  taf: string;
  forecast: ForecastDetail[];
  alerts?: Alert[];
}


export enum ActivePanel {
  EDITOR = 'Mission Editor',
  LIBRARY = 'Mission Library',
  WEATHER = 'Weather',
  SETTINGS = 'Settings',
}

export type UnitSystem = 'metric' | 'imperial';