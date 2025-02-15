import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        age: '',
        weight: ''
    });
    const [errors, setErrors] = useState({
        age: '',
        weight: ''
    });

    const handleChange = (event) => {
        const { id, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));

        // Clear error when user starts typing
        setErrors(prev => ({
            ...prev,
            [id]: ''
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.weight) {
            newErrors.weight = 'Weight is required';
        } else if (formData.weight < 0 || formData.weight > 500) {
            newErrors.weight = 'Please enter a valid weight (0-500)';
        }

        if (!formData.age) {
            newErrors.age = 'Age is required';
        } else if (formData.age < 0 || formData.age > 120) {
            newErrors.age = 'Please enter a valid age (0-120)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreatePlanClick = () => {
        if (validateForm()) {
            navigate('/plan', { state: formData });
        }
    };

    return (
        <div className="container">
            <h1 className="title">Create Your Plan</h1>
            
            <div className="form-group">
                <label htmlFor="weight" className="label">
                    Enter weight (lbs):
                </label>
                <input 
                    type="number"
                    id="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="Enter weight"
                    className={`input ${errors.weight ? 'error' : ''}`}
                />
                {errors.weight && (
                    <p className="error-message">{errors.weight}</p>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="age" className="label">
                    Enter age:
                </label>
                <input 
                    type="number"
                    id="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Enter age"
                    className={`input ${errors.age ? 'error' : ''}`}
                />
                {errors.age && (
                    <p className="error-message">{errors.age}</p>
                )}
            </div>

            <button 
                onClick={handleCreatePlanClick}
                className="button"
            >
                Create Plan
            </button>
        </div>
    );
};

export default Home;