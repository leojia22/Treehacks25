import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/firebase';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    const validateInputs = () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return false;
        }
        if (password.length < 6) {
            setError('Password should be at least 6 characters');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateInputs()) return;

        setError('');
        setIsLoading(true);

        try {
            if (isRegistering) {
                await authService.register(email, password);
            } else {
                await authService.login(email, password);
            }
            navigate('/');
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">
                    {isRegistering ? 'Create Account' : 'Welcome Back'}
                </h1>
                
                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="form-input"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="form-input"
                            disabled={isLoading}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="submit-button"
                        disabled={isLoading}
                    >
                        {isLoading 
                            ? 'Loading...' 
                            : isRegistering 
                                ? 'Create Account' 
                                : 'Log In'
                        }
                    </button>
                </form>

                <button 
                    className="toggle-button"
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError('');
                    }}
                    disabled={isLoading}
                >
                    {isRegistering 
                        ? 'Already have an account? Log in' 
                        : 'Need an account? Sign up'
                    }
                </button>
            </div>
        </div>
    );
};

export default Login;