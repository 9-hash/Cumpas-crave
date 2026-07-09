import React, { useEffect, useState } from 'react';
import { getMyOrders } from '../api/orders';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        getMyOrders()
            .then((data) => {
                if (mounted) setOrders(data || []);
            })
            .catch((err) => {
                if (mounted) setError(err);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    if (loading) return <div className="loading">Loading orders...</div>;
    if (error) return <div className="error">Error: {error.message}</div>;

    if (orders.length === 0) {
        return (
            <div style={styles.emptyContainer}>
                <h2>No Orders Yet</h2>
                <p>Start ordering from your favorite cafes!</p>
                <button onClick={() => window.location.href = '/'} style={styles.browseBtn}>
                    Browse Cafes
                </button>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return '#F4A300';
            case 'confirmed': return '#E8720C';
            case 'preparing': return '#C25E00';
            case 'ready': return '#5CA85C';
            case 'delivered': return '#4A9D4A';
            case 'cancelled': return '#E74C3C';
            default: return '#B99E7E';
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>My Orders</h2>
            <div style={styles.ordersList}>
                {orders.map((order) => (
                    <div key={order.id} style={styles.orderCard}>
                        <div style={styles.orderHeader}>
                            <h3>Order #{order.order_number || order.id}</h3>
                            <span style={{
                                ...styles.statusBadge,
                                backgroundColor: getStatusColor(order.order_status)
                            }}>
                                {order.order_status}
                            </span>
                        </div>
                        <div style={styles.orderDetails}>
                            <p><strong>Cafe:</strong> {order.cafe_name}</p>
                            <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
                            <p><strong>Total:</strong> ETB {order.total_amount}</p>
                        </div>
                        <div style={styles.itemsSection}>
                            <h4>Items:</h4>
                            {order.items?.map((item, idx) => (
                                <div key={idx} style={styles.orderItem}>
                                    <span>{item.quantity}x {item.name}</span>
                                    <span>ETB {item.unit_price * item.quantity}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
    },
    title: {
        marginBottom: '20px',
        color: '#4A3B2A',
    },
    ordersList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(232, 114, 12, 0.1)',
        border: '1px solid #F0DFC8',
    },
    orderHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '1px solid #F5E6CC',
    },
    statusBadge: {
        padding: '5px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: 'white',
    },
    orderDetails: {
        marginBottom: '15px',
    },
    itemsSection: {
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid #F5E6CC',
    },
    orderItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '5px 0',
    },
    browseBtn: {
        marginTop: '20px',
        padding: '10px 25px',
        backgroundColor: '#E8720C',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    emptyContainer: {
        textAlign: 'center',
        padding: '60px',
    },
};

export default Orders;
