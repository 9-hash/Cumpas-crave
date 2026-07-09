import React, { useEffect, useState } from 'react';
import { getCafes, toggleCafeStatus, deleteCafe, createCafe } from '../api/cafes';

const emptyForm = { name: '', description: '', location: '', contact_phone: '' };

const AdminDashboard = () => {
    const [cafes, setCafes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [formError, setFormError] = useState('');
    const [creating, setCreating] = useState(false);

    const loadCafes = () => {
        setLoading(true);
        getCafes(false) // include inactive cafes too — admin needs to see everything
            .then((data) => setCafes(data || []))
            .catch((err) => setError(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadCafes();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleCreate = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!formData.name || !formData.location) {
            setFormError('Name and location are required');
            return;
        }
        setCreating(true);
        try {
            await createCafe(formData);
            setFormData(emptyForm);
            loadCafes();
        } catch (err) {
            setFormError(err.message || 'Failed to create cafe');
        } finally {
            setCreating(false);
        }
    };

    const handleToggle = async (cafeId) => {
        try {
            await toggleCafeStatus(cafeId);
            loadCafes();
        } catch (err) {
            alert('Failed to toggle status: ' + err.message);
        }
    };

    const handleDelete = async (cafeId) => {
        if (!window.confirm('Delete this cafe? This cannot be undone.')) return;
        try {
            await deleteCafe(cafeId);
            loadCafes();
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    };

    if (loading) return <div className="loading">Loading cafes...</div>;
    if (error) return <div className="error">Error: {error.message}</div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Admin Dashboard</h2>

            <div style={styles.formCard}>
                <h3>Add New Cafe</h3>
                <form onSubmit={handleCreate} style={styles.form}>
                    <div style={styles.formGrid}>
                        <input name="name" placeholder="Cafe name" value={formData.name} onChange={handleChange} style={styles.input} />
                        <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} style={styles.input} />
                        <input name="contact_phone" placeholder="Contact phone" value={formData.contact_phone} onChange={handleChange} style={styles.input} />
                    </div>
                    <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} style={styles.textarea} />
                    {formError && <p style={styles.errorText}>{formError}</p>}
                    <button type="submit" disabled={creating} style={styles.saveBtn}>
                        {creating ? 'Creating...' : 'Create Cafe'}
                    </button>
                </form>
            </div>

            <h3 style={styles.listTitle}>All Cafes ({cafes.length})</h3>
            {cafes.length === 0 ? (
                <p>No cafes yet.</p>
            ) : (
                <div style={styles.cafeList}>
                    {cafes.map((cafe) => (
                        <div key={cafe.id} style={styles.cafeRow}>
                            <div style={styles.cafeInfo}>
                                <strong style={styles.cafeName}>{cafe.name}</strong>
                                <span style={{ ...styles.badge, ...(cafe.is_active ? styles.badgeActive : styles.badgeInactive) }}>
                                    {cafe.is_active ? 'Active' : 'Inactive'}
                                </span>
                                <div style={styles.cafeMeta}>{cafe.location}</div>
                            </div>
                            <div style={styles.actions}>
                                <button onClick={() => handleToggle(cafe.id)} style={styles.toggleBtn}>
                                    {cafe.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button onClick={() => handleDelete(cafe.id)} style={styles.deleteBtn}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { maxWidth: '960px', margin: '0 auto', padding: '96px 20px 32px' },
    title: { color: '#4A3B2A', marginBottom: '20px' },
    formCard: { background: '#FFF8ED', border: '1px solid #F0DFC8', borderRadius: '10px', padding: '20px', marginBottom: '30px' },
    form: { display: 'flex', flexDirection: 'column', gap: '10px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' },
    input: { minWidth: 0, padding: '10px', borderRadius: '5px', border: '1px solid #F0DFC8' },
    textarea: { padding: '10px', borderRadius: '5px', border: '1px solid #F0DFC8', minHeight: '60px' },
    errorText: { color: '#e74c3c' },
    saveBtn: { padding: '10px 20px', backgroundColor: '#E8720C', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', alignSelf: 'flex-start', whiteSpace: 'nowrap' },
    listTitle: { color: '#4A3B2A', marginBottom: '10px' },
    cafeList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    cafeRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', alignItems: 'center', padding: '15px', background: '#FFFFFF', border: '1px solid #F0DFC8', borderRadius: '8px', gap: '12px' },
    cafeInfo: { minWidth: 0 },
    cafeName: { display: 'inline-block', maxWidth: '100%', overflowWrap: 'anywhere' },
    cafeMeta: { color: '#8C7A63', fontSize: '13px' },
    badge: { marginLeft: '10px', fontSize: '12px', padding: '2px 8px', borderRadius: '10px' },
    badgeActive: { background: '#e6f4ea', color: '#2e7d32' },
    badgeInactive: { background: '#fdecea', color: '#e74c3c' },
    actions: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' },
    toggleBtn: { padding: '6px 12px', backgroundColor: '#B99E7E', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap' },
    deleteBtn: { padding: '6px 12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap' },
};

export default AdminDashboard;
