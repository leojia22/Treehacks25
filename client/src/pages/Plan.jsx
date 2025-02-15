import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Plan.css';

const Plan = () => {
  const location = useLocation();
  const { age, weight } = location.state || { age: '', weight: '' };

  // Convert pounds to kg for calculations
  const weightInKg = weight * 0.453592;

  // Calculate recommended values based on age and weight
  const calculateBMR = () => {
    // Basic BMR calculation (Mifflin-St Jeor Equation)
    // This is a simplified version - you might want to add gender and height
    return Math.round(10 * weightInKg + 6.25 * 170 - 5 * age + 5); // Assuming average height
  };

  const calculateProtein = () => {
    // Basic protein recommendation (0.7-1g per lb for active individuals)
    return {
      min: Math.round(weight * 0.7),
      max: Math.round(weight * 1)
    };
  };

  const bmr = calculateBMR();
  const proteinNeeds = calculateProtein();

  return (
    <div className="plan-container">
      <header className="plan-header">
        <h1 className="plan-title">Your Personalized Plan</h1>
        <p className="plan-subtitle">Based on your profile: Age {age}, Weight {weight} lbs</p>
      </header>

      <section className="plan-section">
        <h2 className="section-title">Daily Nutritional Goals</h2>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">Base Metabolic Rate</div>
            <div className="info-value">{bmr} calories</div>
          </div>
          <div className="info-item">
            <div className="info-label">Protein Intake Target</div>
            <div className="info-value">{proteinNeeds.min}-{proteinNeeds.max}g</div>
          </div>
        </div>
      </section>

      <section className="plan-section">
        <h2 className="section-title">Recommended Schedule</h2>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">Weekly Workout Sessions</div>
            <div className="info-value">3-4 sessions</div>
          </div>
          <div className="info-item">
            <div className="info-label">Session Duration</div>
            <div className="info-value">45-60 minutes</div>
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <Link to="/" className="button button-secondary">
          Back to Home
        </Link>
        <Link to="/workout-schedule" className="button">
          View Detailed Schedule
        </Link>
      </div>
    </div>
  );
};

export default Plan;