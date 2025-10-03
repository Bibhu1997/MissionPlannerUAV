
export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  alt: number;
  speed: number;
}

export interface Mission {
  id: string;
  name: string;
  waypoints: Waypoint[];
  homePosition?: { lat: number; lng: number };
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
}

export interface WeatherData {
  metar: string;
  taf: string;
  forecast: ForecastDetail[];
}


export enum ActivePanel {
  EDITOR = 'Mission Editor',
  LIBRARY = 'Mission Library',
  WEATHER = 'Weather',
  SETTINGS = 'Settings',
}