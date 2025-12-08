import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Represents a conflict between local and server versions.
 */
export interface Conflict {
  id: string;
  resourceType: 'product' | 'order' | 'address';
  resourceId: string;
  localVersion: Record<string, unknown>;
  serverVersion: Record<string, unknown>;
  localTimestamp: string;
  serverTimestamp: string;
  fields: string[]; // Fields that differ
  resolved: boolean;
}

interface ConflictState {
  conflicts: Conflict[];
  activeConflictId: string | null;
  isResolving: boolean;
}

const initialState: ConflictState = {
  conflicts: [],
  activeConflictId: null,
  isResolving: false,
};

const conflictSlice = createSlice({
  name: 'conflicts',
  initialState,
  reducers: {
    /**
     * Add a new conflict detected from a 409 response.
     */
    addConflict: (state, action: PayloadAction<Omit<Conflict, 'id' | 'resolved'>>) => {
      const conflict: Conflict = {
        ...action.payload,
        id: `conflict-${Date.now()}`,
        resolved: false,
      };
      state.conflicts.push(conflict);

      // Auto-open if no active conflict
      if (!state.activeConflictId) {
        state.activeConflictId = conflict.id;
      }
    },

    /**
     * Set the active conflict to resolve.
     */
    setActiveConflict: (state, action: PayloadAction<string | null>) => {
      state.activeConflictId = action.payload;
    },

    /**
     * Mark conflict as resolved and remove from list.
     */
    resolveConflict: (
      state,
      action: PayloadAction<{ conflictId: string; resolution: 'local' | 'server' | 'merge' }>,
    ) => {
      const index = state.conflicts.findIndex((c) => c.id === action.payload.conflictId);
      if (index !== -1) {
        state.conflicts.splice(index, 1);
      }

      // Clear active if it was the resolved one
      if (state.activeConflictId === action.payload.conflictId) {
        state.activeConflictId = state.conflicts[0]?.id || null;
      }
    },

    /**
     * Dismiss a conflict without resolving (user cancels).
     */
    dismissConflict: (state, action: PayloadAction<string>) => {
      const conflict = state.conflicts.find((c) => c.id === action.payload);
      if (conflict) {
        conflict.resolved = true;
      }
      if (state.activeConflictId === action.payload) {
        state.activeConflictId = null;
      }
    },

    /**
     * Clear all conflicts.
     */
    clearConflicts: (state) => {
      state.conflicts = [];
      state.activeConflictId = null;
    },

    /**
     * Set resolving state (for loading UI).
     */
    setResolving: (state, action: PayloadAction<boolean>) => {
      state.isResolving = action.payload;
    },
  },
});

export const {
  addConflict,
  setActiveConflict,
  resolveConflict,
  dismissConflict,
  clearConflicts,
  setResolving,
} = conflictSlice.actions;

export default conflictSlice.reducer;

// Selectors
export const selectConflicts = (state: { conflicts: ConflictState }) => state.conflicts.conflicts;
export const selectActiveConflict = (state: { conflicts: ConflictState }) =>
  state.conflicts.conflicts.find((c) => c.id === state.conflicts.activeConflictId);
export const selectHasConflicts = (state: { conflicts: ConflictState }) =>
  state.conflicts.conflicts.filter((c) => !c.resolved).length > 0;
