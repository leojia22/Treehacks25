import React, { useState } from "react";
import { terraService } from "../services/firebase";
import { authService } from "../services/firebase";

const TerraAuth = () => {
  const [authToken, setAuthToken] = useState(null);

  const handleAuthRequest = async () => {
    const user = authService.getCurrentUser();
    if (!user) {
      alert("Please log in first!");
      return;
    }

    try {
      const tokenData = await terraService.getTerraAuthToken(user.uid);
      
      if (tokenData) {
        setAuthToken(tokenData.token || JSON.stringify(tokenData, null, 2));
      }
    } catch(e) {
      console.log('Error: ', e)
    }

  };

  return (
    <div>
      <h2>Terra API Authentication</h2>
      <button onClick={handleAuthRequest}>Get Auth Token</button>
      {authToken && <pre>{authToken}</pre>}
    </div>
  );
};

export default TerraAuth;
