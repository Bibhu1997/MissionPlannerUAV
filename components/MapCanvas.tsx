import React, { useRef, useEffect, useState } from 'react';
import { useMissionState, useMissionDispatch } from '../hooks/useMission';
import { useTelemetry } from '../hooks/useTelemetry';
import { useSettings } from '../hooks/useSettings';

// FIX: Add global declarations for the Google Maps API to resolve TypeScript errors.
// This prevents "Cannot find namespace 'google'" and "Property 'google' does not exist on type 'Window'".
declare global {
  namespace google {
    namespace maps {
      interface MapsEventListener {}

      interface LatLng {
        lat(): number;
        lng(): number;
      }

      interface LatLngLiteral {
        lat: number;
        lng: number;
      }
      
      class Point {
        constructor(x: number, y: number);
      }

      class Map {
        constructor(mapDiv: HTMLDivElement | null, opts?: MapOptions);
        addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
        fitBounds(bounds: any): void; // Simplified
        setCenter(latlng: LatLng | LatLngLiteral): void;
        setZoom(zoom: number): void;
      }

      interface MapOptions {
        center?: LatLng | LatLngLiteral;
        zoom?: number;
        mapTypeId?: string;
        disableDefaultUI?: boolean;
        zoomControl?: boolean;
        streetViewControl?: boolean;
        mapTypeControl?: boolean;
        fullscreenControl?: boolean;
      }

      interface MapMouseEvent {
        latLng: LatLng;
      }

      interface MarkerOptions {
        position: LatLng | LatLngLiteral;
        map?: Map;
        icon?: any;
        label?: any;
        title?: string;
        zIndex?: number;
      }

      class Marker {
        constructor(opts?: MarkerOptions);
        setMap(map: Map | null): void;
        setPosition(position: LatLng | LatLngLiteral): void;
        setIcon(icon: any): void;
      }
      
      interface PolylineOptions {
        path: (LatLng | LatLngLiteral)[];
        geodesic?: boolean;
        strokeColor?: string;
        strokeOpacity?: number;
        strokeWeight?: number;
      }

      class Polyline {
        constructor(opts?: PolylineOptions);
        setMap(map: Map | null): void;
        setPath(path: (LatLng | LatLngLiteral)[]): void;
      }

      namespace places {
        class Autocomplete {
          constructor(inputElement: HTMLInputElement, opts?: any);
          bindTo(key: string, target: any): void;
          addListener(eventName: string, handler: () => void): MapsEventListener;
          getPlace(): any; // Simplified
        }
      }

      namespace event {
        function removeListener(listener: MapsEventListener): void;
      }

      const SymbolPath: {
        CIRCLE: number;
      };
    }
  }

  interface Window {
    google: typeof google;
    // FIX: Add gm_authFailure to the window type to handle Google Maps API authentication errors.
    gm_authFailure?: () => void;
  }
}

const loadGoogleMapsScript = (apiKey: string, onReady: () => void, onError: () => void) => {
  if (window.google && window.google.maps) {
    onReady();
    return;
  }
  
  // Clean up old script if it exists, to allow retrying with a new key
  const oldScript = document.getElementById('googleMapsScript');
  if (oldScript) {
    oldScript.remove();
  }

  window.gm_authFailure = () => {
    onError();
  };

  const script = document.createElement('script');
  script.id = 'googleMapsScript';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  script.onload = onReady;
  script.onerror = onError;
  document.head.appendChild(script);
};

const MapCanvas: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { currentMission } = useMissionState();
  const dispatch = useMissionDispatch();
  const { telemetry } = useTelemetry();
  const { googleMapsApiKey } = useSettings();
  
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error' | 'no_key'>('loading');

  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const telemetryMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (googleMapsApiKey) {
      setMapStatus('loading');
      loadGoogleMapsScript(
        googleMapsApiKey,
        () => {
          setMapStatus('ready');
          delete (window as any).gm_authFailure;
        },
        () => {
          setMapStatus('error');
          console.error("Google Maps script failed to load. This may be due to an invalid API key, billing issues, or network problems.");
        }
      );
    } else {
      setMapStatus('no_key');
    }
  }, [googleMapsApiKey]);

  useEffect(() => {
    if (mapStatus === 'ready' && mapRef.current && !map) {
      const gMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 34.0522, lng: -118.2437 },
        zoom: 12,
        mapTypeId: 'satellite',
        disableDefaultUI: true,
      });
      setMap(gMap);
    }
  }, [mapStatus, mapRef, map]);

  useEffect(() => {
    if (map && searchInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        fields: ["geometry", "name", "viewport"],
      });
      autocomplete.bindTo("bounds", map);
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
            map.fitBounds(place.geometry.viewport || place.geometry.location);
        }
      });
    }
  }, [map]);

  useEffect(() => {
    if (!map) return;
    const clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        dispatch({
          type: 'ADD_WAYPOINT',
          payload: { lat: e.latLng.lat(), lng: e.latLng.lng() },
        });
      }
    });
    return () => {
      window.google.maps.event.removeListener(clickListener);
    };
  }, [map, dispatch]);

  useEffect(() => {
    if (!map) return;
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    currentMission.waypoints.forEach((wp, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: wp.lat, lng: wp.lng },
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#38bdf8',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        label: { text: `${index + 1}`, color: 'white', fontWeight: 'bold', fontSize: '12px' },
        title: `Waypoint ${index + 1}`,
        zIndex: 1,
      });
      markersRef.current.push(marker);
    });

    const path = currentMission.waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng }));
    if (polylineRef.current) {
      polylineRef.current.setPath(path);
    } else {
      polylineRef.current = new window.google.maps.Polyline({
        path, geodesic: true, strokeColor: '#38bdf8', strokeOpacity: 0.8, strokeWeight: 3,
      });
      polylineRef.current.setMap(map);
    }
  }, [map, currentMission.waypoints]);

  useEffect(() => {
    if (!map) return;
    if (telemetry) {
      const position = { lat: telemetry.lat, lng: telemetry.lng };
      const telemetryIcon = {
        // Custom Drone Icon SVG Path
        path: 'M12,2.5c-5.25,0-9.5,4.25-9.5,9.5s4.25,9.5,9.5,9.5s9.5-4.25,9.5-9.5S17.25,2.5,12,2.5z M12,4.5c4.14,0,7.5,3.36,7.5,7.5 c0,4.14-3.36,7.5-7.5,7.5c-4.14,0-7.5-3.36-7.5-7.5C4.5,7.86,7.86,4.5,12,4.5z M11,11v-4h2v4H11z M11,13h2v2h-2V13z M3,12h2 M19,12h2 M12,3V1 M12,23v-2',
        fillColor: '#4ade80',
        fillOpacity: 1,
        strokeWeight: 1.5,
        strokeColor: '#0f172a',
        rotation: telemetry.heading,
        scale: 1.2,
        anchor: new window.google.maps.Point(12, 12),
      };

      if (telemetryMarkerRef.current) {
        telemetryMarkerRef.current.setPosition(position);
        telemetryMarkerRef.current.setIcon(telemetryIcon);
      } else {
        telemetryMarkerRef.current = new window.google.maps.Marker({
          position, map, icon: telemetryIcon, title: 'UAV Position', zIndex: 10,
        });
      }
    } else {
      if (telemetryMarkerRef.current) {
        telemetryMarkerRef.current.setMap(null);
        telemetryMarkerRef.current = null;
      }
    }
  }, [map, telemetry]);

  const renderContent = () => {
    switch (mapStatus) {
      case 'no_key':
        return (
          <div className="flex h-full w-full items-center justify-center bg-base-200 text-center p-8">
            <div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">Google Maps API Key Required</h3>
              <p className="text-slate-400">
                Please go to the <strong className="text-primary">'Settings'</strong> panel and enter your API key to load the map.
              </p>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="flex h-full w-full items-center justify-center bg-base-200 text-center p-8">
            <div>
              <h3 className="text-xl font-bold text-accent mb-2">Map Loading Error</h3>
              <p className="text-slate-400">
                The Google Maps script failed to load. Please check your key in the <strong className="text-primary">'Settings'</strong> panel and ensure it is valid and has billing enabled.
              </p>
            </div>
          </div>
        );
      case 'loading':
         return (
             <div className="flex h-full w-full items-center justify-center">
               <p className="text-slate-400">Loading Map...</p>
             </div>
        );
      case 'ready':
      default:
        return (
          <>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search location or address..."
              className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-1/2 max-w-md p-2 rounded-md shadow-lg bg-base-100/90 border border-base-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none placeholder-slate-400"
            />
            <div ref={mapRef} className="w-full h-full" />
          </>
        );
    }
  };

  return (
    <div className="w-full h-full relative bg-base-300">
      {renderContent()}
    </div>
  );
};

export default MapCanvas;