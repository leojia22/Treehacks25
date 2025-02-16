import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { streakService, goalsService } from '../services/firebase';

// Async thunk for initializing streak
export const initializeStreak = createAsyncThunk(
  'fitness/initializeStreak',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:5002/get_streak');
      const data = await response.json();
      return data.streak;
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
      const response = await fetch('http://localhost:5002/update_streak', {
        method: 'POST'
      });
      const data = await response.json();
      return data.streak;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for checking streak
export const checkAndUpdateStreak = createAsyncThunk(
  'fitness/checkAndUpdateStreak',
  async () => {
    try {
      const response = await fetch('http://localhost:5002/get_streak');
      const data = await response.json();
      return data.streak;
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
      console.log('Fetching goals from Firebase...'); // Debug log
      const goals = await goalsService.getGoals();
      console.log('Fetched goals:', goals); // Debug log
      return goals;
    } catch (error) {
      console.error('Error fetching goals:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for saving goals
export const saveGoals = createAsyncThunk(
  'fitness/saveGoals',
  async (goals, { rejectWithValue }) => {
    try {
      console.log('Saving goals to Firebase:', goals); // Debug log
      const updatedGoals = await goalsService.updateGoals(goals);
      console.log('Goals saved successfully:', updatedGoals); // Debug log
      return updatedGoals;
    } catch (error) {
      console.error('Error saving goals:', error);
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
  },
  status: 'idle',
  error: null
};

export const fitnessSlice = createSlice({
  name: 'fitness',
  initialState,
  reducers: {
    updateGoals(state, action) {
      state.goals = action.payload;
    },
    updateFitnessLevel(state, action) {
      state.fitnessLevel = action.payload;
    },
    updateProgress(state, action) {
      const { type, value } = action.payload;
      state.goals[type].current = value;
    },
    resetDailyProgress(state) {
      Object.keys(state.goals).forEach(key => {
        state.goals[key].current = 0;
      });
    }
  },
  extraReducers: (builder) => {
    builder
      // Streak cases
      .addCase(initializeStreak.pending, (state) => {
        state.streak.status = 'loading';
      })
      .addCase(initializeStreak.fulfilled, (state, action) => {
        state.streak.status = 'succeeded';
        state.streak.current = action.payload.current;
        state.streak.lastCheckIn = action.payload.lastCheckIn;
      })
      .addCase(initializeStreak.rejected, (state, action) => {
        state.streak.status = 'failed';
        state.streak.error = action.error.message;
      })
      .addCase(updateDailyStreak.pending, (state) => {
        state.streak.status = 'loading';
      })
      .addCase(updateDailyStreak.fulfilled, (state, action) => {
        state.streak.status = 'succeeded';
        state.streak.current = action.payload.current;
        state.streak.lastCheckIn = action.payload.lastCheckIn;
      })
      .addCase(updateDailyStreak.rejected, (state, action) => {
        state.streak.status = 'failed';
        state.streak.error = action.error.message;
      })
      .addCase(checkAndUpdateStreak.pending, (state) => {
        state.streak.status = 'loading';
      })
      .addCase(checkAndUpdateStreak.fulfilled, (state, action) => {
        state.streak.status = 'succeeded';
        state.streak.current = action.payload.current;
        state.streak.lastCheckIn = action.payload.lastCheckIn;
      })
      .addCase(checkAndUpdateStreak.rejected, (state, action) => {
        state.streak.status = 'failed';
        state.streak.error = action.error.message;
      })
      // Goals cases
      .addCase(fetchGoals.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.goals = action.payload;
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(saveGoals.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(saveGoals.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.goals = action.payload;
      })
      .addCase(saveGoals.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
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
export const selectLastCheckIn = (state) => state.fitness.streak.lastCheckIn;
export const selectStatus = (state) => state.fitness.status;
export const selectError = (state) => state.fitness.error;

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