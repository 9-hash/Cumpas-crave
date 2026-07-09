import React, { useEffect, useState } from 'react';
import { menu } from '../api/client';
import { cart } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MenuItems = ({ cafeId }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantities, setQuantities] = useState({});
    const [message, setMessage] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        
        menu.getItems(parseInt(cafeId))
            .then((response) => {
                if (mounted) {
                    // Handle both response formats
                    const data = response.data?.data || response.data || [];
                    setItems(data);
                }
            })
            .catch((err) => {
                if (mounted) setError(err);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, [cafeId]);

    const handleQuantityChange = (itemId, value) => {
        setQuantities({
            ...quantities,
            [itemId]: parseInt(value) || 1
        });
    };

    const handleAddToCart = async (itemId) => {
        if (!user) {
            navigate('/login');
            return;
        }

        const quantity = quantities[itemId] || 1;

        try {
            await cart.add(parseInt(itemId), quantity, null);
            setMessage(`✓ Added ${quantity} item(s) to cart!`);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(`Error: ${err.message}`);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    if (loading) return <div className="loading">Loading menu...</div>;
    if (error) return <div className="error">Error loading menu: {error.message}</div>;

    if (items.length === 0) {
        return <div className="loading">No menu items available for this cafe.</div>;
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Menu</h2>
            {message && <div style={styles.successMessage}>{message}</div>}
            <div style={styles.grid}>
                {items.map((item) => (
                    <div key={item.id} style={styles.card}>
                        <div style={styles.itemInfo}>
                            <h3 style={styles.itemName}>{item.name}</h3>
                            <p style={styles.description}>{item.description}</p>
                            <span style={styles.category}>{item.category}</span>
                            <p style={styles.price}>ETB {item.price}</p>
                        </div>
                        <div style={styles.actions}>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={quantities[item.id] || 1}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                style={styles.quantityInput}
                            />
                            <button
                                onClick={() => handleAddToCart(item.id)}
                                style={styles.addButton}
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        paddingTop: '96px',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    title: {
        marginBottom: '30px',
        color: '#4A3B2A',
        textAlign: 'center',
    },
    successMessage: {
        backgroundColor: '#e6f4ea',
        color: '#2e7d32',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '20px',
        textAlign: 'center',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '24px',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(232, 114, 12, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        border: '1px solid #F5E6CC',
    },
    itemInfo: {
        flex: 1,
        minWidth: '180px',
    },
    itemName: {
        marginBottom: '8px',
        color: '#4A3B2A',
    },
    description: {
        color: '#8C7A63',
        fontSize: '14px',
        marginBottom: '8px',
    },
    category: {
        display: 'inline-block',
        backgroundColor: '#FBE8CE',
        color: '#C25E00',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        marginBottom: '8px',
    },
    price: {
        color: '#5CA85C',
        fontWeight: 'bold',
        fontSize: '18px',
        marginTop: '8px',
    },
    actions: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    quantityInput: {
        width: '60px',
        padding: '8px',
        border: '1px solid #F0DFC8',
        borderRadius: '5px',
        textAlign: 'center',
    },
    addButton: {
        padding: '8px 15px',
        backgroundColor: '#E8720C',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
    },
};

export default MenuItems;
