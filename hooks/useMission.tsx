
import React, { createContext, useReducer, useContext, ReactNode, Dispatch } from 'react';
import { Mission, Waypoint } from '../types';
import { DEFAULT_ALTITUDE, DEFAULT_SPEED } from '../constants';

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
  | { type: 'DELETE_SAVED_MISSION'; payload: { id: string } };

const createNewMission = (): Mission => ({
  id: `mission_${Date.now()}`,
  name: 'New Mission',
  waypoints: [],
  homePosition: { lat: 34.0522, lng: -118.2437 } // Default to LA for consistency
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
            currentMission: {
                ...state.currentMission,
                name: action.payload
            }
        }
    }
    case 'SET_HOME_POSITION': {
        return {
            ...state,
            currentMission: {
                ...state.currentMission,
                homePosition: action.payload
            }
        }
    }
    case 'CREATE_NEW_MISSION': {
        return {
            ...state,
            currentMission: createNewMission()
        }
    }
    case 'LOAD_MISSION': {
        return {
            ...state,
            currentMission: action.payload
        }
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
        return {
            ...state,
            savedMissions: state.savedMissions.filter(m => m.id !== action.payload.id)
        }
    }
    default:
      return state;
  }
};

const MissionStateContext = createContext<MissionState | undefined>(undefined);
const MissionDispatchContext = createContext<Dispatch<MissionAction> | undefined>(undefined);

export const MissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(missionReducer, initialState);

  return (
    <MissionStateContext.Provider value={state}>
      <MissionDispatchContext.Provider value={dispatch}>
        {children}
      </MissionDispatchContext.Provider>
    </MissionStateContext.Provider>
  );
};

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