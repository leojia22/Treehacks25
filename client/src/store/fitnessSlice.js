// src/store/fitnessSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { streakService } from '../services/firebase';

// Async thunk for initializing streak
export const initializeStreak = createAsyncThunk(
  'fitness/initializeStreak',
  async (userId) => {
    await streakService.initializeUserStreak(userId);
    const streakData = await streakService.getStreak(userId);
    return streakData;
  }
);

// Async thunk for updating streak
export const updateDailyStreak = createAsyncThunk(
  'fitness/updateDailyStreak',
  async (userId) => {
    const streakData = await streakService.updateStreak(userId);
    return streakData;
  }
);

// Async thunk for checking streak
export const checkAndUpdateStreak = createAsyncThunk(
  'fitness/checkAndUpdateStreak',
  async (userId) => {
    const streakData = await streakService.getStreak(userId);
    return streakData;
  }
);

const presetGoals = {
  beginner: {
    distance: { value: 2.0, unit: 'miles', current: 0 },
    time: { value: 20, unit: 'mins', current: 0 },
    calories: { value: 200, unit: 'cal', current: 0 }
  },
  intermediate: {
    distance: { value: 3.0, unit: 'miles', current: 0 },
    time: { value: 30, unit: 'mins', current: 0 },
    calories: { value: 300, unit: 'cal', current: 0 }
  },
  advanced: {
    distance: { value: 5.0, unit: 'miles', current: 0 },
    time: { value: 45, unit: 'mins', current: 0 },
    calories: { value: 500, unit: 'cal', current: 0 }
  }
};

const initialState = {
  fitnessLevel: 'beginner',
  goals: presetGoals.beginner,
  streak: {
    current: 0,
    lastCheckIn: null,
    status: 'idle',
    error: null
  },
  dailyProgress: {
    status: 'idle',
    error: null
  }
};

export const fitnessSlice = createSlice({
  name: 'fitness',
  initialState,
  reducers: {
    updateGoals: (state, action) => {
      state.goals = action.payload;
    },
    updateFitnessLevel: (state, action) => {
      state.fitnessLevel = action.payload;
      // Update goals to match new fitness level
      state.goals = presetGoals[action.payload];
    },
    updateProgress: (state, action) => {
      const { type, value } = action.payload;
      state.goals[type].current = value;

      // Check if all goals are completed
      const allCompleted = Object.values(state.goals).every(
        goal => (goal.current / goal.value) >= 1
      );

      if (allCompleted) {
        state.dailyProgress.status = 'completed';
      }
    },
    resetDailyProgress: (state) => {
      // Reset current values while maintaining targets
      Object.keys(state.goals).forEach(key => {
        state.goals[key].current = 0;
      });
      state.dailyProgress.status = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      // Initialize streak
      .addCase(initializeStreak.pending, (state) => {
        state.streak.status = 'loading';
      })
      .addCase(initializeStreak.fulfilled, (state, action) => {
        state.streak.status = 'succeeded';
        state.streak.current = action.payload.streak;
        state.streak.lastCheckIn = action.payload.lastCheckIn;
      })
      .addCase(initializeStreak.rejected, (state, action) => {
        state.streak.status = 'failed';
        state.streak.error = action.error.message;
      })
      // Update streak
      .addCase(updateDailyStreak.pending, (state) => {
        state.streak.status = 'loading';
      })
      .addCase(updateDailyStreak.fulfilled, (state, action) => {
        state.streak.status = 'succeeded';
        state.streak.current = action.payload.streak;
        state.streak.lastCheckIn = action.payload.lastCheckIn;
      })
      .addCase(updateDailyStreak.rejected, (state, action) => {
        state.streak.status = 'failed';
        state.streak.error = action.error.message;
      })
      // Check streak
      .addCase(checkAndUpdateStreak.fulfilled, (state, action) => {
        state.streak.current = action.payload.streak;
        state.streak.lastCheckIn = action.payload.lastCheckIn;
      });
  }
});

// Export actions
export const { 
  updateGoals, 
  updateFitnessLevel, 
  updateProgress, 
  resetDailyProgress 
} = fitnessSlice.actions;

// Selectors
export const selectCurrentStreak = (state) => state.fitness.streak.current;
export const selectGoals = (state) => state.fitness.goals;
export const selectFitnessLevel = (state) => state.fitness.fitnessLevel;
export const selectDailyProgress = (state) => state.fitness.dailyProgress;

// Progress calculations
export const selectGoalProgress = (state) => {
  const goals = state.fitness.goals;
  return Object.keys(goals).reduce((acc, key) => {
    acc[key] = Math.round((goals[key].current / goals[key].value) * 100);
    return acc;
  }, {});
};

export const selectAllGoalsCompleted = (state) => {
  return Object.values(state.fitness.goals).every(
    goal => (goal.current / goal.value) >= 1
  );
};

export default fitnessSlice.reducer;