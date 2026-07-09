import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { token, user } = await loginUser(email, password);
            login(token, user);

            // Role-based landing page.
            if (user.role === 'admin') {
                navigate('/admin');
            } else if (user.role === 'owner') {
                navigate('/cafe-management');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Login to Campus Crave</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={styles.input}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                        required
                    />
                    {error && <div style={styles.error}>{error}</div>}
                    <div style={styles.forgotRow}>
                        <Link to="/forgot-password" style={styles.link}>Forgot password?</Link>
                    </div>
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p style={styles.footer}>
                    Don't have an account? <Link to="/register" style={styles.link}>Register here</Link>
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        padding: '96px 20px 24px',
    },
    card: {
        background: '#FFFFFF',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(232, 114, 12, 0.15)',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid #F0DFC8',
    },
    title: {
        textAlign: 'center',
        marginBottom: '30px',
        color: '#4A3B2A',
    },
    input: {
        width: '100%',
        padding: '12px',
        marginBottom: '15px',
        border: '1px solid #F0DFC8',
        borderRadius: '5px',
        fontSize: '14px',
        boxSizing: 'border-box',
        backgroundColor: '#FFF8ED',
    },
    button: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#E8720C',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
    },
    error: {
        color: '#e74c3c',
        textAlign: 'center',
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#fdecea',
        borderRadius: '5px',
    },
    footer: {
        textAlign: 'center',
        marginTop: '20px',
    },
    forgotRow: {
        textAlign: 'right',
        margin: '-5px 0 15px',
    },
    link: {
        color: '#E8720C',
        textDecoration: 'none',
        fontWeight: '600',
    },
};

export default Login;
