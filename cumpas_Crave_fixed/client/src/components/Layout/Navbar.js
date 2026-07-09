import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCart } from '../../api/cart';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [cartCount, setCartCount] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        if (!user) {
            setCartCount(0);
            return;
        }
        let mounted = true;
        getCart()
            .then((data) => {
                if (mounted) setCartCount(data?.item_count || 0);
            })
            .catch(() => {
                if (mounted) setCartCount(0);
            });
        return () => { mounted = false; };
    }, [user, location.pathname]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <nav style={{ ...styles.navbar, ...(scrolled && styles.navbarScrolled) }}>
                <div style={styles.navContainer}>
                    <Link to="/" style={styles.logo}>
                        <span style={styles.logoEmoji}>🍕</span>
                        <span style={styles.logoText}>Campus Crave</span>
                    </Link>

                    <button
                        style={styles.menuButton}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <span style={styles.menuIcon}>☰</span>
                    </button>

                    <div style={{ ...styles.navLinks, ...(mobileMenuOpen && styles.navLinksMobile) }}>
                        <Link to="/" style={{ ...styles.navLink, ...(isActive('/') && styles.navLinkActive) }}>
                            🏠 Home
                        </Link>
                        {user ? (
                            <>
                                {user.role === 'admin' && (
                                    <Link to="/admin" style={{ ...styles.navLink, ...(isActive('/admin') && styles.navLinkActive) }}>
                                        🛠️ Admin
                                    </Link>
                                )}
                                {(user.role === 'owner' || user.role === 'admin') && (
                                    <Link to="/cafe-management" style={{ ...styles.navLink, ...(isActive('/cafe-management') && styles.navLinkActive) }}>
                                        🏪 My Cafe
                                    </Link>
                                )}
                                <Link to="/orders" style={{ ...styles.navLink, ...(isActive('/orders') && styles.navLinkActive) }}>
                                    📋 Orders
                                </Link>
                                <Link to="/cart" style={{ ...styles.navLink, ...(isActive('/cart') && styles.navLinkActive) }}>
                                    🛒 Cart
                                    {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
                                </Link>
                                <Link to="/profile" style={{ ...styles.navLink, ...(isActive('/profile') && styles.navLinkActive) }}>
                                    👤 {user.username}
                                </Link>
                                <button onClick={handleLogout} style={styles.logoutBtn}>
                                    🚪 Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" style={{ ...styles.navLink, ...(isActive('/login') && styles.navLinkActive) }}>
                                    🔑 Login
                                </Link>
                                <Link to="/register" style={{ ...styles.navLink, ...(isActive('/register') && styles.navLinkActive) }}>
                                    ✨ Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
};

const styles = {
    navbar: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(255, 248, 237, 0.98)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(232, 114, 12, 0.12)',
        transition: 'all 0.3s ease',
        padding: '0.7rem 0',
    },
    navbarScrolled: {
        padding: '0.7rem 0',
    },
    navContainer: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        textDecoration: 'none',
    },
    logoEmoji: {
        fontSize: '2rem',
        animation: 'pulse 2s infinite',
    },
    logoText: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        background: 'linear-gradient(135deg, #F2994A 0%, #E8720C 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    },
    menuButton: {
        display: 'none',
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        cursor: 'pointer',
    },
    menuIcon: {
        fontSize: '1.5rem',
    },
    navLinks: {
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
    },
    navLinksMobile: {
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        top: '70px',
        left: 0,
        right: 0,
        background: '#FFF8ED',
        padding: '1rem',
        boxShadow: '0 4px 20px rgba(232, 114, 12, 0.12)',
    },
    navLink: {
        color: '#4A3B2A',
        textDecoration: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        transition: 'all 0.3s ease',
        position: 'relative',
        whiteSpace: 'nowrap',
    },
    navLinkActive: {
        color: '#E8720C',
        background: 'rgba(232, 114, 12, 0.1)',
    },
    logoutBtn: {
        background: 'linear-gradient(135deg, #E8720C 0%, #C25E00 100%)',
        color: 'white',
        border: 'none',
        padding: '0.5rem 1.2rem',
        borderRadius: '25px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    cartBadge: {
        background: '#E74C3C',
        color: 'white',
        borderRadius: '50%',
        padding: '2px 6px',
        fontSize: '12px',
        marginLeft: '5px',
    },
};

export default Navbar;
