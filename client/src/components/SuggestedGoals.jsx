import React from 'react';
import './SuggestedGoals.css';

const SuggestedGoals = ({ suggestedGoals, onAdoptGoals }) => {
  if (!suggestedGoals) return null;

  return (
    <div className="goals-section suggested-goals">
      <h3>AI Suggested Goals</h3>
      <div className="goals-container">
        <div className="goal">
          <i className="fas fa-walking"></i>
          <div className="goal-text">
            <span>{suggestedGoals.steps.toLocaleString()} steps</span>
          </div>
        </div>
        <div className="goal">
          <i className="fas fa-bed"></i>
          <div className="goal-text">
            <span>{suggestedGoals.sleep} hours of sleep</span>
          </div>
        </div>
        <div className="goal">
          <i className="fas fa-tint"></i>
          <div className="goal-text">
            <span>{suggestedGoals.water}ml water</span>
          </div>
        </div>
        <div className="goal">
          <i className="fas fa-running"></i>
          <div className="goal-text">
            <span>{suggestedGoals.exercise} min exercise</span>
          </div>
        </div>
      </div>
      <button 
        className="adopt-goals-btn"
        onClick={() => onAdoptGoals(suggestedGoals)}
      >
        Adopt These Goals
      </button>
    </div>
  );
};

export default SuggestedGoals;
