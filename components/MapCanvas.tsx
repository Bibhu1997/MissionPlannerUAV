import React, { useRef, useEffect, useState } from 'react';
import { useMissionState, useMissionDispatch } from '../hooks/useMission';
import { useTelemetry } from '../hooks/useTelemetry';
import { useSettings } from '../hooks/useSettings';
import { useEditorMode } from '../hooks/useEditorMode';

declare global {
  namespace google {
    namespace maps {
      interface MapsEventListener {}
      interface LatLng { lat(): number; lng(): number; }
      interface LatLngLiteral { lat: number; lng: number; }
      class Point { constructor(x: number, y: number); }
      class Map {
        constructor(mapDiv: HTMLDivElement | null, opts?: MapOptions);
        addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
        fitBounds(bounds: any): void;
        setCenter(latlng: LatLng | LatLngLiteral): void;
        setZoom(zoom: number): void;
      }
      interface MapOptions {
        center?: LatLng | LatLngLiteral;
        zoom?: number;
        mapTypeId?: string;
        disableDefaultUI?: boolean;
      }
      interface MapMouseEvent { latLng: LatLng; }
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
        // FIX: Added missing method signature for addListener to the Marker interface to resolve type errors.
        addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
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
      interface PolygonOptions {
        paths?: (LatLng | LatLngLiteral)[];
        strokeColor?: string;
        strokeOpacity?: number;
        strokeWeight?: number;
        fillColor?: string;
        fillOpacity?: number;
        map?: Map;
      }
      class Polygon {
        constructor(opts?: PolygonOptions);
        getMap(): Map | null;
        setMap(map: Map | null): void;
        setPath(path: (LatLng | LatLngLiteral)[] | LatLng[] | LatLngLiteral[]): void;
      }
      namespace places {
        class Autocomplete {
          constructor(inputElement: HTMLInputElement, opts?: any);
          bindTo(key: string, target: any): void;
          addListener(eventName: string, handler: () => void): MapsEventListener;
          getPlace(): any;
        }
      }
      namespace event {
        function removeListener(listener: MapsEventListener): void;
      }
      const SymbolPath: { CIRCLE: number; };
      class InfoWindow {
        constructor(opts?: any);
        setContent(content: string | Node): void;
        open(options: { anchor: Marker; map: Map; }): void;
        close(): void;
      }
    }
  }
  interface Window {
    google: typeof google;
    gm_authFailure?: () => void;
  }
}

const loadGoogleMapsScript = (apiKey: string, onReady: () => void, onError: () => void) => {
  if (window.google && window.google.maps) {
    onReady();
    return;
  }
  const oldScript = document.getElementById('googleMapsScript');
  if (oldScript) oldScript.remove();
  window.gm_authFailure = onError;
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
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  const { currentMission } = useMissionState();
  const dispatch = useMissionDispatch();
  const { telemetry } = useTelemetry();
  const { googleMapsApiKey } = useSettings();
  const { mode } = useEditorMode();
  
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error' | 'no_key'>('loading');

  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const boundaryPolygonRef = useRef<google.maps.Polygon | null>(null);
  const telemetryMarkerRef = useRef<google.maps.Marker | null>(null);
  const homeMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (googleMapsApiKey) {
      setMapStatus('loading');
      loadGoogleMapsScript(
        googleMapsApiKey,
        () => { setMapStatus('ready'); delete window.gm_authFailure; },
        () => setMapStatus('error')
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
      setInfoWindow(new window.google.maps.InfoWindow({
          content: '',
          disableAutoPan: true,
      }));
    }
  }, [mapStatus, mapRef, map]);

  useEffect(() => {
    if (map && searchInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        fields: ["geometry", "name"],
      });
      autocomplete.bindTo("bounds", map);
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
            if (place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
            } else if (place.geometry.location) {
                map.setCenter(place.geometry.location);
                map.setZoom(17);
            }
        }
      });
    }
  }, [map]);

  useEffect(() => {
    if (!map) return;
    const clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        if (mode === 'BOUNDARY') {
            dispatch({ type: 'ADD_BOUNDARY_POINT', payload: { lat: e.latLng.lat(), lng: e.latLng.lng() } });
        } else {
            dispatch({ type: 'ADD_WAYPOINT', payload: { lat: e.latLng.lat(), lng: e.latLng.lng() } });
        }
      }
    });
    return () => window.google.maps.event.removeListener(clickListener);
  }, [map, dispatch, mode]);

  useEffect(() => {
    if (!map || !infoWindow) return;
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    currentMission.waypoints.forEach((wp, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: wp.lat, lng: wp.lng },
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#38bdf8', fillOpacity: 1,
          strokeColor: '#ffffff', strokeWeight: 2,
        },
        label: { text: `${index + 1}`, color: 'white', fontWeight: 'bold', fontSize: '11px' },
        zIndex: 1,
      });
      
      marker.addListener('mouseover', () => {
        const content = `
          <div style="color: #0f172a; padding: 2px;">
            <strong style="font-size: 1.1em;">Waypoint ${index + 1}</strong>
            <p style="margin: 2px 0;">Lat: ${wp.lat.toFixed(4)}, Lon: ${wp.lng.toFixed(4)}</p>
            <p style="margin: 2px 0;">Alt: ${wp.alt}m, Speed: ${wp.speed}m/s</p>
          </div>`;
        infoWindow.setContent(content);
        infoWindow.open({ anchor: marker, map });
      });
      marker.addListener('mouseout', () => infoWindow.close());

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
  }, [map, currentMission.waypoints, infoWindow]);

  useEffect(() => {
    if (!map) return;
    if(currentMission.homePosition) {
        if (homeMarkerRef.current) {
            homeMarkerRef.current.setPosition(currentMission.homePosition);
        } else {
            homeMarkerRef.current = new window.google.maps.Marker({
                position: currentMission.homePosition,
                map,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 9,
                    fillColor: '#4ade80', fillOpacity: 1,
                    strokeColor: '#ffffff', strokeWeight: 2.5,
                },
                label: { text: `H`, color: 'white', fontWeight: 'bold', fontSize: '12px' },
                zIndex: 5,
            });
        }
    }
  }, [map, currentMission.homePosition]);


  useEffect(() => {
    if (!map) return;
    const boundaryPath = currentMission.boundary || [];
    if (!boundaryPolygonRef.current) {
        boundaryPolygonRef.current = new window.google.maps.Polygon({
            strokeColor: '#f472b6', strokeOpacity: 0.9, strokeWeight: 2,
            fillColor: '#f472b6', fillOpacity: 0.2,
        });
    }
    boundaryPolygonRef.current.setPath(boundaryPath);
    boundaryPolygonRef.current.setMap(boundaryPath.length > 0 ? map : null);
  }, [map, currentMission.boundary]);

  useEffect(() => {
    if (!map) return;
    if (telemetry) {
      const position = { lat: telemetry.lat, lng: telemetry.lng };
      const droneSVG = `
        <svg width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill="#4ade80" stroke="#0f172a" stroke-width="1" transform="rotate(${telemetry.heading}, 12, 12)"
            d="M12 2L2.5 6.5L12 11L21.5 6.5L12 2Z M12 13L2.5 17.5L12 22L21.5 17.5L12 13Z"/>
        </svg>`;
      const telemetryIcon = { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(droneSVG) };
      if (telemetryMarkerRef.current) {
        telemetryMarkerRef.current.setPosition(position);
        telemetryMarkerRef.current.setIcon(telemetryIcon);
      } else {
        telemetryMarkerRef.current = new window.google.maps.Marker({
          position, map, icon: telemetryIcon, zIndex: 10,
        });
      }
    } else if (telemetryMarkerRef.current) {
        telemetryMarkerRef.current.setMap(null);
        telemetryMarkerRef.current = null;
    }
  }, [map, telemetry]);

  const renderContent = () => {
    switch (mapStatus) {
      case 'no_key': return <div className="flex h-full w-full items-center justify-center bg-base-200 text-center p-8"><div><h3 className="text-xl font-bold text-slate-100 mb-2">Google Maps API Key Required</h3><p className="text-slate-400">Please go to the <strong className="text-primary">'Settings'</strong> panel and enter your API key to load the map.</p></div></div>;
      case 'error': return <div className="flex h-full w-full items-center justify-center bg-base-200 text-center p-8"><div><h3 className="text-xl font-bold text-accent mb-2">Map Loading Error</h3><p className="text-slate-400">Please check your API key in <strong className="text-primary">'Settings'</strong> and ensure it is valid and has billing enabled.</p></div></div>;
      case 'loading': return <div className="flex h-full w-full items-center justify-center"><p className="text-slate-400">Loading Map...</p></div>;
      case 'ready': default: return (
          <>
            <input ref={searchInputRef} type="text" placeholder="Search location or address..." className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-1/2 max-w-md p-2 rounded-md shadow-lg bg-base-100/90 border border-base-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none placeholder-slate-400" />
            <div ref={mapRef} className="w-full h-full" />
          </>
      );
    }
  };

  return <div className="w-full h-full relative bg-base-300">{renderContent()}</div>;
};

export default MapCanvas;