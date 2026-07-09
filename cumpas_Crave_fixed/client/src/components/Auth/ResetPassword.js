import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../api/auth';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const token = searchParams.get('token') || '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!token) {
            setError('Reset token is missing. Please request a new reset link.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, password);
            setMessage('Password reset successful. Redirecting to login...');
            setTimeout(() => navigate('/login'), 1200);
        } catch (err) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Reset Password</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="New password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={styles.input}
                        required
                    />
                    {error && <div style={styles.error}>{error}</div>}
                    {message && <div style={styles.success}>{message}</div>}
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
                <p style={styles.footer}>
                    Need a new link? <Link to="/forgot-password" style={styles.link}>Forgot password</Link>
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
        padding: '32px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(232, 114, 12, 0.15)',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid #F0DFC8',
    },
    title: {
        textAlign: 'center',
        marginBottom: '24px',
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
    success: {
        color: '#2e7d32',
        textAlign: 'center',
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#e6f4ea',
        borderRadius: '5px',
    },
    footer: {
        textAlign: 'center',
        marginTop: '20px',
    },
    link: {
        color: '#E8720C',
        textDecoration: 'none',
        fontWeight: '600',
    },
};

export default ResetPassword;
