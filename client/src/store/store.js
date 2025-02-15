import { configureStore } from '@reduxjs/toolkit';
import fitnessReducer from './fitnessSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    fitness: fitnessReducer,
    auth: authReducer
  }
});