import React, { useState } from 'react';
import './GarminAnalysis.css';

const GarminAnalysis = () => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const analyzeGarminData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('http://localhost:5002/analyze_garmin_data', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Failed to analyze Garmin data');
            }
            
            const data = await response.json();
            if (!data || (!data.recommendation && !data.insights)) {
                throw new Error('Invalid response format from server');
            }
            
            setAnalysis(data);
        } catch (err) {
            console.error('Error analyzing Garmin data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="garmin-analysis">
            <div className="garmin-header">
                <h2>AI Workout Analysis</h2>
                <button 
                    onClick={analyzeGarminData}
                    className="analyze-button"
                    disabled={loading}
                >
                    {loading ? 'Analyzing...' : 'Analyze My Data'}
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
                        <h3>AI Recommendations</h3>
                        <p>{analysis.recommendation}</p>
                    </div>
                    
                    {analysis.insights && (
                        <div className="analysis-card">
                            <h3>Insights</h3>
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

export default GarminAnalysis;
