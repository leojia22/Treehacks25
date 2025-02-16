import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { auth, streakService } from '../services/firebase';
import './Homepage.css';

const Homepage = () => {
    const navigate = useNavigate();
    const [streak, setStreak] = useState(0);
    const { goals } = useSelector((state) => state.fitness);

    useEffect(() => {
        const checkStreak = async () => {
            if (!auth.currentUser) return;
            
            try {
                const streakData = await streakService.getStreak(auth.currentUser.uid);
                setStreak(streakData.streak);
            } catch (error) {
                console.error('Error fetching streak:', error);
            }
        };

        checkStreak();
    }, []);

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

    useEffect(() => {
        const updateStreakIfGoalsMet = async () => {
            if (!auth.currentUser) return;

            const currentStats = {
                distance: goals.distance.current,
                time: goals.time.current,
                calories: goals.calories.current
            };

            try {
                const result = await streakService.checkGoalsAndUpdateStreak(auth.currentUser.uid, currentStats);
                if (result.updated) {
                    setStreak(result.streak);
                }
            } catch (error) {
                console.error('Error updating streak:', error);
            }
        };

        updateStreakIfGoalsMet();
    }, [goals]);

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

            <main className="main-content">
                <div className="streak-counter">
                    <h2>Current Streak: {streak} days</h2>
                </div>

                <div className="goals-grid">
                    {formattedGoals.map((goal, index) => (
                        <div key={index} className="goal-card">
                            <h3>{goal.title}</h3>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                                />
                            </div>
                            <p>Progress: {goal.current} / {goal.target}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Homepage;