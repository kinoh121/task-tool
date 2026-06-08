import React, { createContext, useContext, useReducer } from 'react';

interface AppState {
  selectedListId: string | null;
  openGroupIds: string[];          // 複数グループを同時に開ける
  showCopyScreen: boolean;
}

type AppAction =
  | { type: 'SELECT_LIST'; listId: string | null }
  | { type: 'TOGGLE_GROUP'; groupId: string }
  | { type: 'SHOW_COPY_SCREEN' }
  | { type: 'HIDE_COPY_SCREEN' };

const initialState: AppState = {
  selectedListId: null,
  openGroupIds: [],
  showCopyScreen: false,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SELECT_LIST':
      return { ...state, selectedListId: action.listId };
    case 'TOGGLE_GROUP': {
      const ids = state.openGroupIds ?? [];
      const open = ids.includes(action.groupId);
      return {
        ...state,
        openGroupIds: open
          ? ids.filter((id) => id !== action.groupId)
          : [...ids, action.groupId],
      };
    }
    case 'SHOW_COPY_SCREEN':
      return { ...state, showCopyScreen: true };
    case 'HIDE_COPY_SCREEN':
      return { ...state, showCopyScreen: false };
    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> } | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
