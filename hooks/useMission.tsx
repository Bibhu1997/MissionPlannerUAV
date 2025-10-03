import React, { createContext, useReducer, useContext, ReactNode, Dispatch, useEffect } from 'react';
import { Mission, Waypoint } from '../types';
import { DEFAULT_ALTITUDE, DEFAULT_SPEED } from '../constants';
import { useSettings } from './useSettings';

interface MissionState {
  currentMission: Mission;
  savedMissions: Mission[];
}

type MissionAction =
  | { type: 'ADD_WAYPOINT'; payload: { lat: number; lng: number } }
  | { type: 'UPDATE_WAYPOINT'; payload: Waypoint }
  | { type: 'DELETE_WAYPOINT'; payload: { id: string } }
  | { type: 'SET_MISSION_NAME'; payload: string }
  | { type: 'SET_HOME_POSITION'; payload: { lat: number; lng: number } }
  | { type: 'CREATE_NEW_MISSION' }
  | { type: 'LOAD_MISSION'; payload: Mission }
  | { type: 'SAVE_MISSION' }
  | { type: 'DELETE_SAVED_MISSION'; payload: { id: string } }
  | { type: 'ADD_BOUNDARY_POINT'; payload: { lat: number; lng: number } }
  | { type: 'CLEAR_BOUNDARY' }
  | { type: 'SET_WAYPOINT_ALT_TYPE'; payload: { id: string; altType: 'MSL' | 'AGL' } }
  | { type: 'SET_TERRAIN_PROFILE'; payload: { waypointsWithTerrain: Waypoint[]; terrainProfile: { elevation: number }[] } };

const createNewMission = (): Mission => ({
  id: `mission_${Date.now()}`,
  name: 'New Mission',
  waypoints: [],
  boundary: [],
  homePosition: { lat: 34.0522, lng: -118.2437 }, // Default to LA
  terrainProfile: [],
});

const initialState: MissionState = {
  currentMission: createNewMission(),
  savedMissions: [],
};

const missionReducer = (state: MissionState, action: MissionAction): MissionState => {
  switch (action.type) {
    case 'ADD_WAYPOINT': {
      const newWaypoint: Waypoint = {
        id: `wp_${Date.now()}`,
        lat: action.payload.lat,
        lng: action.payload.lng,
        alt: DEFAULT_ALTITUDE,
        speed: DEFAULT_SPEED,
        altType: 'MSL',
      };
      return {
        ...state,
        currentMission: {
          ...state.currentMission,
          waypoints: [...state.currentMission.waypoints, newWaypoint],
        },
      };
    }
    case 'UPDATE_WAYPOINT': {
      return {
        ...state,
        currentMission: {
          ...state.currentMission,
          waypoints: state.currentMission.waypoints.map((wp) =>
            wp.id === action.payload.id ? action.payload : wp
          ),
        },
      };
    }
    case 'DELETE_WAYPOINT': {
      return {
        ...state,
        currentMission: {
          ...state.currentMission,
          waypoints: state.currentMission.waypoints.filter((wp) => wp.id !== action.payload.id),
        },
      };
    }
    case 'SET_MISSION_NAME': {
        return {
            ...state,
            currentMission: { ...state.currentMission, name: action.payload }
        }
    }
    case 'SET_HOME_POSITION': {
        return {
            ...state,
            currentMission: { ...state.currentMission, homePosition: action.payload }
        }
    }
    case 'CREATE_NEW_MISSION': {
        return { ...state, currentMission: createNewMission() }
    }
    case 'LOAD_MISSION': {
        return { ...state, currentMission: action.payload }
    }
    case 'SAVE_MISSION': {
        const missionToSave = state.currentMission;
        const existingIndex = state.savedMissions.findIndex(m => m.id === missionToSave.id);
        if (existingIndex > -1) {
            const updatedMissions = [...state.savedMissions];
            updatedMissions[existingIndex] = missionToSave;
            return { ...state, savedMissions: updatedMissions };
        } else {
            return { ...state, savedMissions: [...state.savedMissions, missionToSave] };
        }
    }
    case 'DELETE_SAVED_MISSION': {
        return { ...state, savedMissions: state.savedMissions.filter(m => m.id !== action.payload.id) }
    }
    case 'ADD_BOUNDARY_POINT': {
      const newBoundaryPoint = { lat: action.payload.lat, lng: action.payload.lng };
      return {
        ...state,
        currentMission: {
          ...state.currentMission,
          boundary: [...(state.currentMission.boundary || []), newBoundaryPoint],
        },
      };
    }
    case 'CLEAR_BOUNDARY': {
      return { ...state, currentMission: { ...state.currentMission, boundary: [] } };
    }
    case 'SET_WAYPOINT_ALT_TYPE': {
      return {
        ...state,
        currentMission: {
          ...state.currentMission,
          waypoints: state.currentMission.waypoints.map(wp => 
            wp.id === action.payload.id ? { ...wp, altType: action.payload.altType } : wp
          ),
        },
      };
    }
    case 'SET_TERRAIN_PROFILE': {
      return {
        ...state,
        currentMission: {
          ...state.currentMission,
          waypoints: action.payload.waypointsWithTerrain,
          terrainProfile: action.payload.terrainProfile,
        },
      };
    }
    default:
      return state;
  }
};

const MissionStateContext = createContext<MissionState | undefined>(undefined);
const MissionDispatchContext = createContext<Dispatch<MissionAction> | undefined>(undefined);

const MissionProviderInternal: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(missionReducer, initialState);
  const { googleMapsApiKey } = useSettings();

  useEffect(() => {
    const fetchTerrainData = async () => {
      const { waypoints } = state.currentMission;
      if (!googleMapsApiKey || waypoints.length === 0) {
        // Clear terrain data if no waypoints or no key
        const waypointsWithoutTerrain = waypoints.map(({ terrain_alt, ...wp }) => wp);
        dispatch({ type: 'SET_TERRAIN_PROFILE', payload: { waypointsWithTerrain: waypointsWithoutTerrain, terrainProfile: [] } });
        return;
      }

      // Use the 'locations' parameter for precise elevation at each waypoint
      const locations = waypoints.map(wp => `${wp.lat},${wp.lng}`).join('|');
      const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${locations}&key=${googleMapsApiKey}`;

      try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results && data.results.length === waypoints.length) {
          const waypointsWithTerrain = waypoints.map((wp, index) => ({
            ...wp,
            terrain_alt: data.results[index].elevation,
          }));
          const terrainProfile = data.results.map((result: any) => ({ elevation: result.elevation }));
          dispatch({ type: 'SET_TERRAIN_PROFILE', payload: { waypointsWithTerrain, terrainProfile } });
        } else {
          console.error('Failed to fetch elevation data:', data.status, data.error_message);
          // If fetch fails, keep existing waypoints but clear profile to avoid stale chart data
          dispatch({ type: 'SET_TERRAIN_PROFILE', payload: { waypointsWithTerrain: waypoints, terrainProfile: [] } });
        }
      } catch (error) {
        console.error('Error fetching elevation data:', error);
      }
    };

    const debounceTimer = setTimeout(fetchTerrainData, 500); // Debounce API calls
    return () => clearTimeout(debounceTimer);
  }, [state.currentMission.waypoints, googleMapsApiKey, dispatch]);


  return (
    <MissionStateContext.Provider value={state}>
      <MissionDispatchContext.Provider value={dispatch}>
        {children}
      </MissionDispatchContext.Provider>
    </MissionStateContext.Provider>
  );
};

export const MissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
    <MissionProviderInternal>{children}</MissionProviderInternal>
);


export const useMissionState = (): MissionState => {
  const context = useContext(MissionStateContext);
  if (context === undefined) {
    throw new Error('useMissionState must be used within a MissionProvider');
  }
  return context;
};

export const useMissionDispatch = (): Dispatch<MissionAction> => {
  const context = useContext(MissionDispatchContext);
  if (context === undefined) {
    throw new Error('useMissionDispatch must be used within a MissionProvider');
  }
  return context;
};