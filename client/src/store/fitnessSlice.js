import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { streakService, auth, goalsService } from '../services/firebase';

// Async thunk for initializing streak
export const initializeStreak = createAsyncThunk(
  'fitness/initializeStreak',
  async (_, { rejectWithValue }) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      await streakService.initializeUserStreak(currentUser.uid);
      const streakData = await streakService.getStreak(currentUser.uid);
      return streakData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating streak
export const updateDailyStreak = createAsyncThunk(
  'fitness/updateDailyStreak',
  async (_, { rejectWithValue }) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const streakData = await streakService.updateStreak(currentUser.uid);
      return streakData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for checking streak
export const checkAndUpdateStreak = createAsyncThunk(
  'fitness/checkAndUpdateStreak',
  async (userId) => {
    try {
      const streak = await streakService.checkStreak(userId);
      return streak;
    } catch (error) {
      throw error;
    }
  }
);

// Async thunk for getting goals
export const fetchGoals = createAsyncThunk(
  'fitness/fetchGoals',
  async (_, { rejectWithValue }) => {
    try {
      return await goalsService.getGoals();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Rest of your slice remains the same
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
  goals: {
    distance: { value: 2.0, unit: 'miles', current: 0 },
    time: { value: 20, unit: 'mins', current: 0 },
    calories: { value: 200, unit: 'cal', current: 0 }
  },
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
      state.goals = presetGoals[action.payload];
    },
    updateProgress: (state, action) => {
      const { type, value } = action.payload;
      if (state.goals[type]) {
        state.goals[type].current = value;
      }

      const allCompleted = Object.values(state.goals).every(
        goal => (goal.current / goal.value) >= 1
      );

      if (allCompleted) {
        state.dailyProgress.status = 'completed';
      }
    },
    resetDailyProgress: (state) => {
      Object.keys(state.goals).forEach(key => {
        state.goals[key].current = 0;
      });
      state.dailyProgress.status = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      // Initialize Streak
      .addCase(initializeStreak.pending, (state) => {
        state.streak.status = 'loading';
      })
      .addCase(initializeStreak.fulfilled, (state, action) => {
        state.streak.status = 'idle';
        state.streak.current = action.payload.streakCount;
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
        state.streak.error = action.payload;
      })
      // Check and Update Streak
      .addCase(checkAndUpdateStreak.pending, (state) => {
        // Don't set loading state for periodic checks
        if (state.streak.status === 'idle' || state.streak.status === 'failed') {
          state.streak.status = 'loading';
        }
      })
      .addCase(checkAndUpdateStreak.fulfilled, (state, action) => {
        state.streak.status = 'idle';
        state.streak.current = action.payload.streakCount;
        state.streak.lastCheckIn = action.payload.lastCheckIn;
        state.streak.error = null;
      })
      .addCase(checkAndUpdateStreak.rejected, (state, action) => {
        state.streak.status = 'failed';
        state.streak.error = action.error.message;
      })
      // Add goals cases
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.goals = action.payload;
      });
  }
});

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
export const selectStreakStatus = (state) => state.fitness.streak.status;
export const selectStreakError = (state) => state.fitness.streak.error;

// Helper selector to calculate goal progress
export const selectGoalProgress = (state) => {
  const goals = state.fitness.goals;
  return Object.keys(goals).map(key => ({
    type: key,
    progress: Math.min((goals[key].current / goals[key].value) * 100, 100)
  }));
};

// Helper selector to check if all goals are completed
export const selectAllGoalsCompleted = (state) => {
  return selectGoalProgress(state).every(goal => goal.progress >= 100);
};

export default fitnessSlice.reducer;