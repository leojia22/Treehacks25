import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { initializeStreak, checkAndUpdateStreak, updateDailyStreak } from '../store/fitnessSlice';
import './Homepage.css';

const Homepage = () => {
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
            icon: "🏃‍♂️",
            target: `${goals.distance.value} ${goals.distance.unit}`,
            current: `${goals.distance.current} ${goals.distance.unit}`,
            progress: calculateProgress(goals.distance)
        },
        {
            title: "Time",
            icon: "⏱️",
            target: `${goals.time.value} ${goals.time.unit}`,
            current: `${goals.time.current} ${goals.time.unit}`,
            progress: calculateProgress(goals.time)
        },
        {
            title: "Calories",
            icon: "🔥",
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

    return (
        <div className="homepage">
            <header className="header">
                <div className="header-content">
                    <h1 className="header-title">My Dashboard</h1>
                    <Link to="/edit-plan" className="edit-button">
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
                </div>
            </header>

            <div className="streak-card">
                {streakStatus === 'loading' ? (
                    <div className="streak-loading">Loading streak...</div>
                ) : streakStatus === 'failed' ? (
                    <div className="streak-error">Error: {streakError}</div>
                ) : (
                    <>
                        <div className="streak-icon">🔥</div>
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