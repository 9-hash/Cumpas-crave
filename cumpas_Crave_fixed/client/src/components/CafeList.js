import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cafes } from '../api/client';

const CafeList = () => {
    const [cafeList, setCafeList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        cafes.getAll()
            .then((response) => {
                if (mounted) {
                    // Handle both response formats
                    const data = response.data?.data || response.data || [];
                    setCafeList(data);
                }
            })
            .catch((err) => {
                if (mounted) setError(err);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorMessage message={error.message} />;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>✨ Featured Cafes</h2>
                <p style={styles.subtitle}>Discover the best food spots on campus</p>
            </div>
            <div style={styles.grid}>
                {cafeList.map((cafe, index) => (
                    <Link to={`/cafe/${cafe.id}`} key={cafe.id} style={styles.cardLink}>
                        <div
                            className="hover-lift animate-fadeIn"
                            style={{ ...styles.card, animationDelay: `${index * 0.1}s` }}
                        >
                            <div style={styles.cardIcon}>
                                <span style={styles.iconEmoji}>🏪</span>
                            </div>
                            <h3 style={styles.cafeName}>{cafe.name}</h3>
                            <p style={styles.description}>{cafe.description || 'Fresh meals prepared daily with love ❤️'}</p>
                            <div style={styles.info}>
                                <span style={styles.location}>📍 {cafe.location}</span>
                                <span style={styles.phone}>📞 {cafe.contact_phone || 'N/A'}</span>
                            </div>
                            <div style={cafe.is_active ? styles.open : styles.closed}>
                                {cafe.is_active ? (
                                    <span style={styles.openBadge}>🟢 Open Now</span>
                                ) : (
                                    <span style={styles.closedBadge}>🔴 Closed</span>
                                )}
                            </div>
                            <div style={styles.viewMore}>
                                <span>View Menu →</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

const LoadingSkeleton = () => (
    <div style={styles.container}>
        <div style={styles.grid}>
            {[1, 2, 3, 4].map((i) => (
                <div key={i} style={styles.card}>
                    <div className="skeleton" style={{ height: '150px', borderRadius: '12px' }}></div>
                </div>
            ))}
        </div>
    </div>
);

const ErrorMessage = ({ message }) => (
    <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
            <span style={styles.errorIcon}>😢</span>
            <h3>Oops! Something went wrong</h3>
            <p>{message}</p>
            <button onClick={() => window.location.reload()} style={styles.retryBtn}>
                Try Again
            </button>
        </div>
    </div>
);

const styles = {
    container: {
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    header: {
        textAlign: 'center',
        marginBottom: '3rem',
    },
    title: {
        fontSize: '2.5rem',
        background: 'linear-gradient(135deg, #F2994A 0%, #E8720C 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '1rem',
    },
    subtitle: {
        fontSize: '1.1rem',
        color: '#8C7A63',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '2rem',
    },
    cardLink: {
        textDecoration: 'none',
        color: 'inherit',
    },
    card: {
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '1.5rem',
        boxShadow: '0 10px 40px rgba(232, 114, 12, 0.1)',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #F5E6CC',
    },
    cardIcon: {
        textAlign: 'center',
        marginBottom: '1rem',
    },
    iconEmoji: {
        fontSize: '3rem',
    },
    cafeName: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#4A3B2A',
        marginBottom: '0.5rem',
        textAlign: 'center',
    },
    description: {
        color: '#8C7A63',
        lineHeight: '1.6',
        marginBottom: '1rem',
        textAlign: 'center',
    },
    info: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.85rem',
        color: '#B99E7E',
        marginBottom: '1rem',
    },
    location: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
    },
    phone: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
    },
    open: {
        textAlign: 'center',
        marginBottom: '1rem',
    },
    openBadge: {
        display: 'inline-block',
        background: '#5CA85C',
        color: 'white',
        padding: '0.3rem 1rem',
        borderRadius: '20px',
        fontSize: '0.85rem',
    },
    closed: {
        textAlign: 'center',
        marginBottom: '1rem',
    },
    closedBadge: {
        display: 'inline-block',
        background: '#E74C3C',
        color: 'white',
        padding: '0.3rem 1rem',
        borderRadius: '20px',
        fontSize: '0.85rem',
    },
    viewMore: {
        textAlign: 'center',
        color: '#E8720C',
        fontWeight: '600',
        marginTop: '0.5rem',
        transition: 'all 0.3s ease',
    },
    errorContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        padding: '2rem',
    },
    errorCard: {
        textAlign: 'center',
        background: '#FFFFFF',
        padding: '3rem',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(232, 114, 12, 0.1)',
    },
    errorIcon: {
        fontSize: '4rem',
        marginBottom: '1rem',
    },
    retryBtn: {
        marginTop: '1.5rem',
        padding: '0.75rem 2rem',
        background: 'linear-gradient(135deg, #F2994A 0%, #E8720C 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
    },
};

export default CafeList;