import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../api/auth';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [resetUrl, setResetUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setResetUrl('');
        setLoading(true);

        try {
            const result = await forgotPassword(email);
            setMessage(result.message || 'Reset link prepared.');
            if (result.data?.reset_url) {
                setResetUrl(result.data.reset_url);
            }
        } catch (err) {
            setError(err.message || 'Failed to prepare reset link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Forgot Password</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={styles.input}
                        required
                    />
                    {error && <div style={styles.error}>{error}</div>}
                    {message && <div style={styles.success}>{message}</div>}
                    {resetUrl && (
                        <div style={styles.devBox}>
                            <span style={styles.devLabel}>Local reset link</span>
                            <Link to={new URL(resetUrl).pathname + new URL(resetUrl).search} style={styles.devLink}>
                                Open reset password
                            </Link>
                        </div>
                    )}
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Preparing...' : 'Send Reset Link'}
                    </button>
                </form>
                <p style={styles.footer}>
                    Remembered it? <Link to="/login" style={styles.link}>Back to login</Link>
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
    devBox: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '15px',
        padding: '10px',
        background: '#FFF8ED',
        border: '1px solid #F0DFC8',
        borderRadius: '5px',
        flexWrap: 'wrap',
    },
    devLabel: { color: '#8C7A63', fontSize: '13px' },
    devLink: { color: '#E8720C', fontWeight: '700', textDecoration: 'none' },
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

export default ForgotPassword;
