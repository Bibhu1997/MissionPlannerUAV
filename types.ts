
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

export interface WeatherData {
  metar: string;
  taf: string;
  forecast: {
    time: string;
    temperature: number;
    windSpeed: number;
    windDirection: number;
  }[];
}

export enum ActivePanel {
  EDITOR = 'Mission Editor',
  LIBRARY = 'Mission Library',
  WEATHER = 'Weather',
  CHECKLIST = 'Checklist',
}
