import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from './services/firebase';
import { setUser, clearUser } from './store/authSlice';

// Pages
import Homepage from './pages/Homepage';
import EditPlan from './pages/EditPlan';
import Login from './components/Login';

// Components
import PrivateRoute from './components/PrivateRoute';
import TerraAuth from './components/TerraAuth';

function App() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      if (user) {
        dispatch(setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }));
      } else {
        dispatch(clearUser());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return (
    <BrowserRouter>
      <div className="app">
        {/* 🔹 Routes */}
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login />} 
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Homepage />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/edit-plan"
            element={
              <PrivateRoute>
                <EditPlan />
              </PrivateRoute>
            }
          />

          <Route
            path="/terra-auth"
            element={
              <PrivateRoute>
                <TerraAuth />
              </PrivateRoute>
            }
          />

          {/* Catch all route - redirect to home */}
          <Route
            path="*"
            element={<Navigate to="/" />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
