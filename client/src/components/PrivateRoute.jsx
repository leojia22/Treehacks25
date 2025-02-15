import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children }) => {
    const user = useSelector((state) => state.auth.user);
    
    if (!user) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" />;
    }

    return children;
};

export default PrivateRoute;