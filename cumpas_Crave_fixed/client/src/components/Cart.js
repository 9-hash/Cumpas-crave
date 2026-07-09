import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeFromCart, clearCart as clearCartApi } from '../api/cart';
import { createOrder, verifyPayment } from '../api/orders';

const Cart = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentPassword, setPaymentPassword] = useState('');
    const [currentOrder, setCurrentOrder] = useState(null);
    const [paymentError, setPaymentError] = useState('');

    const refetch = useCallback(() => {
        setLoading(true);
        return getCart()
            .then((data) => setCart(data))
            .catch((err) => setError(err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    useEffect(() => {
        if ((cart?.item_count || 0) >= 4 && paymentMethod === 'COD') {
            setPaymentMethod('ONLINE');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart?.item_count]);

    const handleUpdateQuantity = async (cartItemId, currentQty, change) => {
        const newQty = currentQty + change;
        if (newQty < 1) return;

        try {
            await updateCartItem(cartItemId, newQty);
            refetch();
        } catch (err) {
            alert('Failed to update quantity');
        }
    };

    const handleRemoveItem = async (cartItemId) => {
        try {
            await removeFromCart(cartItemId);
            refetch();
        } catch (err) {
            alert('Failed to remove item');
        }
    };

    const handleClearCart = async () => {
        if (window.confirm('Are you sure you want to clear your entire cart?')) {
            try {
                await clearCartApi();
                refetch();
            } catch (err) {
                alert('Failed to clear cart');
            }
        }
    };

    const handleCheckout = async () => {
        if (!cart?.items?.length) {
            alert('Your cart is empty');
            return;
        }

        const cafeId = cart.items[0].cafe_id;
        const itemCount = cart.item_count || 0;

        // Business rules (enforced again server-side — this is just so the
        // user gets an immediate, clear message instead of a generic error):
        //   - a single order can't exceed 6 items total
        //   - 4 or more items must be paid online (no COD)
        if (itemCount > 6) {
            alert(`Maximum 6 items per order. You have ${itemCount} — please remove ${itemCount - 6} item(s) before checking out.`);
            return;
        }
        if (itemCount >= 4 && paymentMethod !== 'ONLINE') {
            alert('Orders with 4 or more items require online payment.');
            setPaymentMethod('ONLINE');
            return;
        }

        try {
            const order = await createOrder(cafeId, paymentMethod, null);

            if (paymentMethod === 'COD') {
                // Cash on Delivery - direct success
                alert(`Order placed successfully! Order #: ${order.order_number || order.id}`);
                refetch();
                navigate('/orders');
            } else {
                // Online payment - show password modal
                setCurrentOrder(order);
                setShowPaymentModal(true);
            }
        } catch (err) {
            alert('Failed to create order: ' + err.message);
        }
    };

    const handlePaymentVerification = async () => {
        if (!paymentPassword) {
            setPaymentError('Please enter your payment password');
            return;
        }

        try {
            const result = await verifyPayment(currentOrder.id, paymentPassword);

            if (result?.success) {
                alert('Payment successful! Order confirmed.');
                setShowPaymentModal(false);
                setPaymentPassword('');
                window.location.href = '/orders';
            } else {
                setPaymentError(result?.message || 'Payment failed');
            }
        } catch (err) {
            setPaymentError(err.message || 'Payment verification failed');
        }
    };

    if (loading) return <div className="loading">Loading cart...</div>;
    if (error) return <div className="error">Error: {error.message}</div>;

    const items = cart?.items || [];
    const total = cart?.total || 0;
    const itemCount = cart?.item_count || 0;
    const overLimit = itemCount > 6;
    const requiresOnline = itemCount >= 4;

    if (items.length === 0) {
        return (
            <div style={styles.emptyContainer}>
                <h2>Your Cart is Empty</h2>
                <p>Add items from our cafes to get started!</p>
                <Link to="/">
                    <button style={styles.browseBtn}>Browse Cafes</button>
                </Link>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Shopping Cart</h2>

            {/* Payment Method Selection */}
            <div style={styles.paymentSection}>
                <h3>Payment Method</h3>
                <div style={styles.paymentOptions}>
                    <label style={styles.paymentOption}>
                        <input
                            type="radio"
                            value="COD"
                            checked={paymentMethod === 'COD'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            disabled={requiresOnline}
                        />
                        <span>Cash on Delivery (COD)</span>
                    </label>
                    <label style={styles.paymentOption}>
                        <input
                            type="radio"
                            value="ONLINE"
                            checked={paymentMethod === 'ONLINE'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span>Pay Online</span>
                    </label>
                </div>
                {requiresOnline && (
                    <p style={styles.warningMessage}>
                        ⚠️ Orders with 4 or more items ({itemCount} in cart) must pay online
                    </p>
                )}
                {overLimit && (
                    <p style={styles.warningMessage}>
                        ⚠️ Maximum 6 items per order — remove {itemCount - 6} item(s) to check out
                    </p>
                )}
            </div>

            <div style={styles.itemsContainer}>
                {items.map((item) => (
                    <div key={item.id} style={styles.cartItem}>
                        <div style={styles.itemDetails}>
                            <h4>{item.name}</h4>
                            <p>ETB {item.unit_price} each</p>
                        </div>
                        <div style={styles.itemActions}>
                            <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                                style={styles.qtyBtn}
                            >
                                -
                            </button>
                            <span style={styles.quantity}>{item.quantity}</span>
                            <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                                style={styles.qtyBtn}
                            >
                                +
                            </button>
                            <span style={styles.itemTotal}>
                                ETB {item.quantity * item.unit_price}
                            </span>
                            <button
                                onClick={() => handleRemoveItem(item.id)}
                                style={styles.removeBtn}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div style={styles.summary}>
                <h3>Total: ETB {total}</h3>
                <div style={styles.summaryButtons}>
                    <button onClick={handleClearCart} style={styles.clearBtn}>
                        Clear Cart
                    </button>
                    <button onClick={handleCheckout} style={styles.checkoutBtn} disabled={overLimit}>
                        Proceed to Checkout
                    </button>
                </div>
            </div>

            {/* Payment Password Modal */}
            {showPaymentModal && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h3>Enter Payment Password</h3>
                        <p>Order Total: ETB {currentOrder?.total_amount}</p>
                        <input
                            type="password"
                            placeholder="Enter your payment password"
                            value={paymentPassword}
                            onChange={(e) => setPaymentPassword(e.target.value)}
                            style={styles.modalInput}
                        />
                        {paymentError && <p style={styles.errorText}>{paymentError}</p>}
                        <div style={styles.modalButtons}>
                            <button onClick={() => setShowPaymentModal(false)} style={styles.cancelBtn}>
                                Cancel
                            </button>
                            <button onClick={handlePaymentVerification} style={styles.confirmBtn}>
                                Pay Now
                            </button>
                        </div>
                        <p style={styles.modalHint}>Default password: 123456</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px',
    },
    title: {
        marginBottom: '20px',
        color: '#4A3B2A',
    },
    paymentSection: {
        backgroundColor: '#FFF8ED',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '20px',
        border: '1px solid #F0DFC8',
    },
    paymentOptions: {
        display: 'flex',
        gap: '20px',
        marginTop: '10px',
    },
    paymentOption: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
    },
    warningMessage: {
        color: '#e74c3c',
        fontSize: '14px',
        marginTop: '10px',
    },
    itemsContainer: {
        border: '1px solid #F0DFC8',
        borderRadius: '10px',
        overflow: 'hidden',
    },
    cartItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px',
        borderBottom: '1px solid #F5E6CC',
        backgroundColor: '#FFFFFF',
        flexWrap: 'wrap',
    },
    itemDetails: {
        flex: 2,
    },
    itemActions: {
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    qtyBtn: {
        width: '30px',
        height: '30px',
        backgroundColor: '#E8720C',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
    },
    quantity: {
        minWidth: '30px',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    itemTotal: {
        minWidth: '80px',
        fontWeight: 'bold',
        color: '#5CA85C',
    },
    removeBtn: {
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        padding: '5px 12px',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    summary: {
        marginTop: '20px',
        padding: '20px',
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(232, 114, 12, 0.1)',
        textAlign: 'right',
        border: '1px solid #F0DFC8',
    },
    summaryButtons: {
        display: 'flex',
        gap: '15px',
        justifyContent: 'flex-end',
        marginTop: '15px',
    },
    clearBtn: {
        padding: '10px 20px',
        backgroundColor: '#B99E7E',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    checkoutBtn: {
        padding: '10px 25px',
        backgroundColor: '#E8720C',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
    },
    browseBtn: {
        marginTop: '20px',
        padding: '10px 25px',
        backgroundColor: '#E8720C',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
    },
    emptyContainer: {
        textAlign: 'center',
        padding: '60px',
    },
    modal: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(74, 59, 42, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        padding: '30px',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '400px',
        textAlign: 'center',
    },
    modalInput: {
        width: '100%',
        padding: '10px',
        margin: '15px 0',
        border: '1px solid #F0DFC8',
        borderRadius: '5px',
        fontSize: '16px',
    },
    modalButtons: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
    },
    cancelBtn: {
        padding: '10px 20px',
        backgroundColor: '#B99E7E',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    confirmBtn: {
        padding: '10px 20px',
        backgroundColor: '#5CA85C',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    errorText: {
        color: '#e74c3c',
        marginBottom: '10px',
    },
    modalHint: {
        marginTop: '15px',
        fontSize: '12px',
        color: '#B99E7E',
    },
};

export default Cart;
