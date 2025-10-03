import React, { useRef, useEffect, useState } from 'react';
import { useMissionState, useMissionDispatch } from '../hooks/useMission';
import { useTelemetry } from '../hooks/useTelemetry';

// FIX: The google.maps types were not available. This declares the global
// `google` object to satisfy the TypeScript compiler and removes the
// non-working triple-slash directive.
declare const google: any;

const MapCanvas: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { currentMission } = useMissionState();
  const dispatch = useMissionDispatch();
  const { telemetry } = useTelemetry();

  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const telemetryMarkerRef = useRef<google.maps.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (mapRef.current && !map) {
      if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        console.error('Google Maps script not loaded. Please check your API key and network connection.');
        alert('Could not load Google Maps. Please check your API key and refresh the page.');
        return;
      }

      const gMap = new google.maps.Map(mapRef.current, {
        center: { lat: 34.0522, lng: -118.2437 }, // Default to Los Angeles
        zoom: 12,
        mapTypeId: 'satellite',
        disableDefaultUI: true,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });
      setMap(gMap);
    }
  }, [mapRef, map]);

  // Initialize Autocomplete Search
  useEffect(() => {
    if (map && searchInputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
        fields: ["geometry", "name"],
        types: ["geocode"],
      });

      autocomplete.bindTo("bounds", map);

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
          } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17); // Zoom in closer for specific addresses
          }
        } else {
          alert("No details available for input: '" + place.name + "'");
        }
      });
    }
  }, [map]);

  // Handle Map Click to Add Waypoint
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
      google.maps.event.removeListener(clickListener);
    };
  }, [map, dispatch]);

  // Update Waypoint Markers and Polyline
  useEffect(() => {
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers with custom icons
    currentMission.waypoints.forEach((wp, index) => {
      const marker = new google.maps.Marker({
        position: { lat: wp.lat, lng: wp.lng },
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#38bdf8', // primary color
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        label: {
          text: `${index + 1}`,
          color: 'white',
          fontWeight: 'bold',
          fontSize: '12px',
        },
        title: `Waypoint ${index + 1}`,
        zIndex: 1, // Keep waypoints below telemetry
      });
      markersRef.current.push(marker);
    });

    // Update Polyline
    const path = currentMission.waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng }));
    if (polylineRef.current) {
      polylineRef.current.setPath(path);
    } else {
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#38bdf8', // primary color
        strokeOpacity: 0.8,
        strokeWeight: 3,
      });
      polylineRef.current.setMap(map);
    }

  }, [map, currentMission.waypoints]);

  // Update Telemetry Marker
  useEffect(() => {
    if (!map) return;
    if (telemetry) {
      const position = { lat: telemetry.lat, lng: telemetry.lng };
      const telemetryIcon = {
        path: 'm12 2 7 19-7-4-7 4 7-19z', // UAV icon shape
        fillColor: '#4ade80', // secondary color
        fillOpacity: 1,
        strokeWeight: 1.5,
        strokeColor: '#0f172a', // base-100 color for outline
        rotation: telemetry.heading,
        scale: 1.2,
        anchor: new google.maps.Point(12, 12),
      };

      if (telemetryMarkerRef.current) {
        telemetryMarkerRef.current.setPosition(position);
        telemetryMarkerRef.current.setIcon(telemetryIcon);
      } else {
        telemetryMarkerRef.current = new google.maps.Marker({
          position,
          map,
          icon: telemetryIcon,
          title: 'UAV Position',
          zIndex: 10, // Ensure telemetry marker is on top of waypoints
        });
      }
    } else {
      // Hide marker when simulation stops
      if (telemetryMarkerRef.current) {
        telemetryMarkerRef.current.setMap(null);
        telemetryMarkerRef.current = null;
      }
    }
  }, [map, telemetry]);

  return (
    <div className="w-full h-full relative bg-base-300">
      <input
        ref={searchInputRef}
        type="text"
        placeholder="Search location or address..."
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-1/2 max-w-md p-2 rounded-md shadow-lg bg-base-100/90 border border-base-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none placeholder-slate-400"
      />
      <div ref={mapRef} className="w-full h-full">
         <div className="flex h-full w-full items-center justify-center">
            <p className="text-slate-400">Loading Map...</p>
          </div>
      </div>
    </div>
  );
};

export default MapCanvas;
