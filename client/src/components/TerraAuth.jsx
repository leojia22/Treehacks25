import React, { useEffect } from "react";
import { terraService } from "../services/firebase";
import { authService } from "../services/firebase";

const TERRA_TOKEN_KEY = 'terra_auth_token';

const TerraAuth = () => {
  useEffect(() => {
    const initTerraAuth = async () => {
      console.log('Initializing Terra Auth...');
      const user = authService.getCurrentUser();
      if (!user) {
        console.log('No user found, skipping Terra Auth');
        return;
      }
      console.log('User found:', user.uid);

      try {
        console.log('Requesting Terra Auth token...');
        const tokenData = await terraService.getTerraAuthToken(user.uid);
        console.log('Terra Auth token received:', tokenData);
        
        // Save token to localStorage
        if (tokenData && tokenData.token) {
          localStorage.setItem(TERRA_TOKEN_KEY, tokenData.token);
          console.log('Terra Auth token saved to localStorage');
        } else if (tokenData) {
          localStorage.setItem(TERRA_TOKEN_KEY, JSON.stringify(tokenData));
          console.log('Terra Auth data saved to localStorage');
        }
      } catch(e) {
        console.error('Terra Auth Error:', e);
      }
    };

    initTerraAuth();

    // Cleanup function to remove token when component unmounts
    return () => {
      // Only remove token if user is not logged in
      if (!authService.getCurrentUser()) {
        localStorage.removeItem(TERRA_TOKEN_KEY);
        console.log('Terra Auth token removed from localStorage');
      }
    };
  }, []);

  return null; // Component doesn't render anything
};

export default TerraAuth;
