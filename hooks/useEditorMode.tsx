
import React, { createContext, useState, useContext, ReactNode } from 'react';

export type EditorMode = 'WAYPOINT' | 'BOUNDARY';

interface EditorModeState {
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
}

const EditorModeContext = createContext<EditorModeState | undefined>(undefined);

export const EditorModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<EditorMode>('WAYPOINT');

  return (
    <EditorModeContext.Provider value={{ mode, setMode }}>
      {children}
    </EditorModeContext.Provider>
  );
};

export const useEditorMode = (): EditorModeState => {
  const context = useContext(EditorModeContext);
  if (!context) {
    throw new Error('useEditorMode must be used within an EditorModeProvider');
  }
  return context;
};
