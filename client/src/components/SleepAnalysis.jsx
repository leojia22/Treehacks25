import React, { useState } from 'react';
import './SleepAnalysis.css';

const SleepAnalysis = () => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const analyzeSleepData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('http://localhost:5002/analyze_sleep_patterns');
            if (!response.ok) {
                throw new Error('Failed to analyze sleep data');
            }
            const data = await response.json();
            setAnalysis(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sleep-analysis">
            <div className="sleep-header">
                <h2>Sleep Pattern Analysis</h2>
                <button 
                    onClick={analyzeSleepData}
                    className="analyze-button"
                    disabled={loading}
                >
                    {loading ? 'Analyzing...' : 'Analyze Sleep Patterns'}
                </button>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {analysis && (
                <div className="analysis-results">
                    <div className="analysis-card">
                        <h3>Sleep Recommendations</h3>
                        <p>{analysis.recommendation}</p>
                    </div>
                    
                    {analysis.insights && (
                        <div className="analysis-card">
                            <h3>Sleep Insights</h3>
                            <ul>
                                {analysis.insights.map((insight, index) => (
                                    <li key={index}>{insight}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SleepAnalysis;
