import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateGoals, updateFitnessLevel, saveGoals, fetchGoals } from '../store/fitnessSlice';
import './EditPlan.css';

const EditPlan = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { goals, fitnessLevel } = useSelector((state) => state.fitness);

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

    const handleFitnessLevelChange = (e) => {
        const level = e.target.value;
        dispatch(updateFitnessLevel(level));
        dispatch(updateGoals(presetGoals[level]));
    };

    const handleGoalChange = (type, value) => {
        console.log('Changing goal:', type, value); // Debug log
        const updatedGoals = {
            ...goals,
            [type]: {
                ...goals[type],
                value: parseFloat(value) || 0,
                current: goals[type].current // Preserve current value
            }
        };
        console.log('Updated goals:', updatedGoals); // Debug log
        dispatch(updateGoals(updatedGoals));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Submitting goals:', goals); // Debug log
        try {
            await dispatch(saveGoals(goals)).unwrap();
            await dispatch(fetchGoals()).unwrap(); // Fetch updated goals immediately
            navigate('/');
        } catch (error) {
            console.error('Failed to save goals:', error);
        }
    };

    return (
        <div className="edit-plan">
            <header className="edit-header">
                <div className="header-content">
                    <div className="spacer"></div>
                    <Link to="/" className="logo">
                        <h1>Fit Streak</h1>
                    </Link>
                    <Link to="/" className="back-button">
                        <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back
                    </Link>
                </div>
            </header>

            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <h2 className="form-title">Fitness Level</h2>
                    <div className="form-group">
                        <label className="form-label">Select your fitness level:</label>
                        <select 
                            className="form-input"
                            value={fitnessLevel}
                            onChange={handleFitnessLevelChange}
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="form-title">Daily Goals</h2>
                    
                    <div className="form-group">
                        <label className="form-label">Target Distance</label>
                        <div className="input-group">
                            <input
                                type="number"
                                className="form-input"
                                value={goals.distance.value}
                                onChange={(e) => handleGoalChange('distance', e.target.value)}
                                step="0.1"
                                min="0"
                            />
                            <span className="unit-label">{goals.distance.unit}</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Target Time</label>
                        <div className="input-group">
                            <input
                                type="number"
                                className="form-input"
                                value={goals.time.value}
                                onChange={(e) => handleGoalChange('time', e.target.value)}
                                step="1"
                                min="0"
                            />
                            <span className="unit-label">{goals.time.unit}</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Target Calories</label>
                        <div className="input-group">
                            <input
                                type="number"
                                className="form-input"
                                value={goals.calories.value}
                                onChange={(e) => handleGoalChange('calories', e.target.value)}
                                step="10"
                                min="0"
                            />
                            <span className="unit-label">{goals.calories.unit}</span>
                        </div>
                    </div>
                </div>

                <button type="submit" className="save-button">
                    Save Changes
                </button>
            </form>
        </div>
    );
};

export default EditPlan;