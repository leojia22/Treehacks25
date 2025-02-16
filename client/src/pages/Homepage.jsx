import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
    initializeStreak, 
    checkAndUpdateStreak, 
    updateDailyStreak,
    fetchGoals 
} from '../store/fitnessSlice';
import { authService } from '../services/firebase';
import './Homepage.css';
import GarminAnalysis from '../components/GarminAnalysis';
import SleepAnalysis from '../components/SleepAnalysis';
import BodyComposition from '../components/BodyComposition';

const Homepage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { goals } = useSelector((state) => state.fitness);
    const streak = useSelector((state) => state.fitness.streak);
    const streakCount = streak.current || 0;

    const [currentMetrics, setCurrentMetrics] = useState({
        distance: 0,
        active_time: 0,
        calories: 0
    });

    useEffect(() => {
        // Initialize streak when component mounts
        dispatch(initializeStreak());
        dispatch(fetchGoals());

        // Check and update streak every minute
        const streakInterval = setInterval(() => {
            dispatch(checkAndUpdateStreak());
        }, 60000);

        // Fetch current values every 2 seconds
        const fetchCurrentValues = async () => {
            try {
                const response = await fetch('http://localhost:5002/get_goals');
                const data = await response.json();
                if (data.status === 'success' && data.goals) {
                    dispatch({ 
                        type: 'fitness/updateCurrentValues', 
                        payload: {
                            distance: data.goals.distance?.current || 0,
                            time: data.goals.time?.current || 0,
                            calories: data.goals.calories?.current || 0
                        }
                    });
                }
            } catch (error) {
                console.error('Error fetching current values:', error);
            }
        };

        const valuesInterval = setInterval(fetchCurrentValues, 2000);

        // Cleanup intervals
        return () => {
            clearInterval(streakInterval);
            clearInterval(valuesInterval);
        };
    }, [dispatch]);

    // Update goals when metrics change
    useEffect(() => {
        const updatedGoals = { ...goals };
        if (currentMetrics.distance) updatedGoals.distance = { ...goals.distance, current: currentMetrics.distance };
        if (currentMetrics.active_time) updatedGoals.time = { ...goals.time, current: currentMetrics.active_time };
        if (currentMetrics.calories) updatedGoals.calories = { ...goals.calories, current: currentMetrics.calories };
        dispatch({ type: 'fitness/updateGoals', payload: updatedGoals });
    }, [currentMetrics, dispatch]);

    const handleUpdateStreak = async () => {
        try {
            await dispatch(updateDailyStreak()).unwrap();
        } catch (error) {
            console.error('Failed to update streak:', error);
        }
    };

    const calculateProgress = (goal) => {
        if (!goal.value) return 0;
        const progress = (goal.current / goal.value) * 100;
        return Math.min(Math.max(progress, 0), 100); // Clamp between 0 and 100
    };

    const [suggestedGoals, setSuggestedGoals] = useState(null);

    const handleAnalysisComplete = (data) => {
        if (data.suggested_goals) {
            const formatted = [
                {
                    title: 'Distance',
                    current: '0.0',
                    target: data.suggested_goals.distance.value,
                    unit: data.suggested_goals.distance.unit,
                    icon: '🏃‍♂️',
                    explanation: 'Aim to cover a certain distance to improve cardiovascular health and burn calories.'
                },
                {
                    title: 'Time',
                    current: '0',
                    target: data.suggested_goals.time.value,
                    unit: data.suggested_goals.time.unit,
                    icon: '⏱️',
                    explanation: 'Spend a certain amount of time engaging in physical activity to boost mood and energy levels.'
                },
                {
                    title: 'Calories',
                    current: '0',
                    target: data.suggested_goals.calories.value,
                    unit: data.suggested_goals.calories.unit,
                    icon: '🔥',
                    explanation: 'Burn a certain number of calories to support weight loss and weight management goals.'
                }
            ];
            setSuggestedGoals(formatted);
        }
    };

    const formattedGoals = [
        {
            title: "Distance",
            target: `${goals.distance?.value || 0} ${goals.distance?.unit || 'miles'}`,
            current: `${goals.distance?.current || 0} ${goals.distance?.unit || 'miles'}`,
            progress: calculateProgress(goals.distance || { value: 0, current: 0 }),
            icon: '🏃'
        },
        {
            title: "Time",
            target: `${goals.time?.value || 0} ${goals.time?.unit || 'mins'}`,
            current: `${goals.time?.current || 0} ${goals.time?.unit || 'mins'}`,
            progress: calculateProgress(goals.time || { value: 0, current: 0 }),
            icon: '⏱️'
        },
        {
            title: "Calories",
            target: `${goals.calories?.value || 0} ${goals.calories?.unit || 'cal'}`,
            current: `${goals.calories?.current || 0} ${goals.calories?.unit || 'cal'}`,
            progress: calculateProgress(goals.calories || { value: 0, current: 0 }),
            icon: '🔥'
        }
    ];

    const allGoalsCompleted = formattedGoals.every(goal => goal.progress >= 100);

    useEffect(() => {
        if (allGoalsCompleted) {
            handleUpdateStreak();
        }
    }, [allGoalsCompleted]);

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

            <div className="content">
                <div className="streak-section">
                    <div className="streak-card">
                        {streak.status === 'loading' ? (
                            <div className="streak-loading">Loading streak...</div>
                        ) : streak.status === 'failed' ? (
                            <div className="streak-error">Error: {streak.error}</div>
                        ) : (
                            <>
                                <div className="streak-number">{streakCount}</div>
                                <div className="streak-label">Day Streak</div>
                            </>
                        )}
                    </div>
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
                                <div className="goal-target">Target: {goal.target}</div>
                            </div>
                        ))}
                    </div>

                    {suggestedGoals && (
                        <>
                            <h2 className="section-title">AI Suggested Goals</h2>
                            <div className="goals-grid">
                                {suggestedGoals.map((goal, index) => (
                                    <div key={index} className="goal-card suggested">
                                        <div className="goal-header">
                                            <span className="goal-icon">{goal.icon}</span>
                                            <div className="goal-title">{goal.title}</div>
                                        </div>
                                        <div className="goal-value">{goal.current}</div>
                                        <div className="progress-bar-container">
                                            <div 
                                                className="progress-bar"
                                                style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className="goal-target">Target: {goal.target} {goal.unit}</div>
                                        <div className="goal-explanation">{goal.explanation}</div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </section>

                <GarminAnalysis handleAnalysisComplete={handleAnalysisComplete} />
                <SleepAnalysis />
                <BodyComposition />

                {allGoalsCompleted && (
                    <div className="completion-message">
                        Congratulations! You've completed all your goals for today. 
                        Keep up the great work!
                    </div>
                )}
            </div>
        </div>
    );
};

export default Homepage;