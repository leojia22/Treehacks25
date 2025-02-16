import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { initializeStreak, checkAndUpdateStreak, updateDailyStreak } from '../store/fitnessSlice';
import { authService } from '../services/firebase';
import './Homepage.css';

const Homepage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { goals } = useSelector((state) => state.fitness);
    const { current: streakCount, status: streakStatus, error: streakError } = 
        useSelector((state) => state.fitness.streak);
    const userId = 'current-user-id'; // Replace with actual user ID from auth

    useEffect(() => {
        // Initialize and check streak when component mounts
        dispatch(initializeStreak(userId));
        dispatch(checkAndUpdateStreak(userId));

        // Check streak every hour
        const intervalId = setInterval(() => {
            dispatch(checkAndUpdateStreak(userId));
        }, 3600000);

        return () => clearInterval(intervalId);
    }, [dispatch, userId]);

    const calculateProgress = (goal) => {
        return Math.round((goal.current / goal.value) * 100);
    };

    const formattedGoals = [
        {
            title: "Distance",
            target: `${goals.distance.value} ${goals.distance.unit}`,
            current: `${goals.distance.current} ${goals.distance.unit}`,
            progress: calculateProgress(goals.distance)
        },
        {
            title: "Time",
            target: `${goals.time.value} ${goals.time.unit}`,
            current: `${goals.time.current} ${goals.time.unit}`,
            progress: calculateProgress(goals.time)
        },
        {
            title: "Calories",
            target: `${goals.calories.value} ${goals.calories.unit}`,
            current: `${goals.calories.current} ${goals.calories.unit}`,
            progress: calculateProgress(goals.calories)
        }
    ];

    const allGoalsCompleted = formattedGoals.every(goal => goal.progress >= 100);

    useEffect(() => {
        if (allGoalsCompleted) {
            dispatch(updateDailyStreak(userId));
        }
    }, [allGoalsCompleted, dispatch, userId]);

    const handleLogout = async () => {
        try {
            await authService.logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <div className="homepage">
            <header className="header">
                <div className="header-content">
                    <div className="spacer"></div>
                    <Link to="/" className="logo">
                        <h1>Fit Streak</h1>
                    </Link>
                    <div className="header-buttons">
                        <Link to="/edit-plan" className="header-button edit-button">
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
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit Plan
                        </Link>
                        <button onClick={handleLogout} className="header-button logout-button">
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
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="streak-card">
                {streakStatus === 'loading' ? (
                    <div className="streak-loading">Loading streak...</div>
                ) : streakStatus === 'failed' ? (
                    <div className="streak-error">Error: {streakError}</div>
                ) : (
                    <>
                        <div className="streak-number">{streakCount}</div>
                        <div className="streak-label">Day Streak</div>
                    </>
                )}
            </div>

            <section className="goals-section">
                <h2 className="section-title">Today's Goals</h2>
                <div className="goals-grid">
                    {formattedGoals.map((goal, index) => (
                        <div key={index} className="goal-card">
                            <div className="goal-header">
                                <span className="goal-icon">{goal.icon}</span>
                                <div className="goal-title">{goal.title}</div>
                            </div>
                            <div className="goal-value">{goal.current}</div>
                            <div className="progress-bar-container">
                                <div 
                                    className="progress-bar"
                                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                                />
                            </div>
                            <div className={`goal-progress ${goal.progress < 50 ? 'behind' : ''}`}>
                                {goal.progress}% of {goal.target}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {allGoalsCompleted && (
                <div className="completion-message">
                    Congratulations! You've completed all your goals for today. 
                    Keep up the great work!
                </div>
            )}
        </div>
    );
};

export default Homepage;