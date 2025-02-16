import React, { useState } from 'react';
import './BodyComposition.css';

const BodyComposition = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analysis, setAnalysis] = useState(null);

    const analyzeBodyComposition = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5002/analyze_body_composition');
            if (!response.ok) {
                throw new Error('Failed to analyze body composition');
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
        <div className="body-composition">
            <div className="body-header">
                <h2>Body Composition Analysis</h2>
                <button 
                    className="analyze-button"
                    onClick={analyzeBodyComposition}
                    disabled={loading}
                >
                    {loading ? 'Analyzing...' : 'Analyze Body Composition'}
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
                        <h3>Recommendations</h3>
                        <p>{analysis.recommendation}</p>
                    </div>
                    
                    <div className="analysis-card">
                        <h3>Key Insights</h3>
                        <ul>
                            {analysis.insights.map((insight, index) => (
                                <li key={index}>{insight}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BodyComposition;
