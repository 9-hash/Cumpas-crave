import React, { useEffect, useState, useCallback } from 'react';
import { getMyCafes } from '../api/cafes';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../api/menu';

const emptyForm = { name: '', description: '', price: '', category: '', preparation_time: '', image_url: '' };

const CafeManagementPage = () => {
    const [cafes, setCafes] = useState([]);
    const [selectedCafeId, setSelectedCafeId] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        getMyCafes()
            .then((data) => {
                setCafes(data || []);
                if (data && data.length > 0) setSelectedCafeId(data[0].id);
            })
            .catch((err) => setError(err))
            .finally(() => setLoading(false));
    }, []);

    const loadItems = useCallback(() => {
        if (!selectedCafeId) return;
        setItemsLoading(true);
        getMenuItems(selectedCafeId, { includeUnavailable: true })
            .then((data) => setItems(data || []))
            .catch((err) => setError(err))
            .finally(() => setItemsLoading(false));
    }, [selectedCafeId]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setFormError('');
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEditClick = (item) => {
        setEditingId(item.id);
        setFormData({
            name: item.name || '',
            description: item.description || '',
            price: item.price ?? '',
            category: item.category || '',
            preparation_time: item.preparation_time ?? '',
            image_url: item.image_url || '',
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!formData.name || formData.price === '') {
            setFormError('Name and price are required');
            return;
        }

        setSaving(true);
        try {
            if (editingId) {
                await updateMenuItem(editingId, {
                    ...formData,
                    price: Number(formData.price),
                    preparation_time: formData.preparation_time ? Number(formData.preparation_time) : null,
                });
            } else {
                await createMenuItem({
                    ...formData,
                    cafe_id: selectedCafeId,
                    price: Number(formData.price),
                    preparation_time: formData.preparation_time ? Number(formData.preparation_time) : null,
                });
            }
            resetForm();
            loadItems();
        } catch (err) {
            setFormError(err.message || 'Failed to save menu item');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (itemId) => {
        if (!window.confirm('Remove this menu item from the active menu?')) return;
        try {
            await deleteMenuItem(itemId);
            loadItems();
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    };

    const handleToggleAvailability = async (item) => {
        try {
            await updateMenuItem(item.id, { status: item.status === 'Available' ? 'Unavailable' : 'Available' });
            loadItems();
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        }
    };

    if (loading) return <div className="loading">Loading your cafes...</div>;
    if (error) return <div className="error">Error: {error.message}</div>;

    if (cafes.length === 0) {
        return (
            <div style={styles.container}>
                <h2>Cafe Management</h2>
                <p>You aren't assigned to any cafe yet. Ask an admin to assign you as an owner.</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Cafe Management</h2>

            {cafes.length > 1 && (
                <div style={styles.cafeSelector}>
                    <label>Cafe: </label>
                    <select
                        value={selectedCafeId || ''}
                        onChange={(e) => { setSelectedCafeId(Number(e.target.value)); resetForm(); }}
                        style={styles.select}
                    >
                        {cafes.map((cafe) => (
                            <option key={cafe.id} value={cafe.id}>{cafe.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div style={styles.formCard}>
                <h3>{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGrid}>
                        <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} style={styles.input} />
                        <input name="category" placeholder="Category" value={formData.category} onChange={handleChange} style={styles.input} />
                        <input name="price" type="number" step="0.01" placeholder="Price (ETB)" value={formData.price} onChange={handleChange} style={styles.input} />
                        <input name="preparation_time" type="number" placeholder="Prep time (min)" value={formData.preparation_time} onChange={handleChange} style={styles.input} />
                    </div>
                    <input name="image_url" placeholder="Image URL (optional)" value={formData.image_url} onChange={handleChange} style={styles.input} />
                    <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} style={styles.textarea} />
                    {formError && <p style={styles.errorText}>{formError}</p>}
                    <div style={styles.formButtons}>
                        <button type="submit" disabled={saving} style={styles.saveBtn}>
                            {saving ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={resetForm} style={styles.cancelBtn}>Cancel</button>
                        )}
                    </div>
                </form>
            </div>

            <h3 style={styles.listTitle}>Menu Items</h3>
            {itemsLoading ? (
                <div className="loading">Loading items...</div>
            ) : items.length === 0 ? (
                <p>No menu items yet — add one above.</p>
            ) : (
                <div style={styles.itemsList}>
                    {items.map((item) => (
                        <div key={item.id} style={styles.itemRow}>
                            <div style={styles.itemInfo}>
                                <strong style={styles.itemName}>{item.name}</strong> <span>ETB {item.price}</span>
                                <span style={styles.badge}>{item.status}</span>
                                <div style={styles.itemMeta}>{item.category}</div>
                            </div>
                            <div style={styles.itemActions}>
                                <button onClick={() => handleToggleAvailability(item)} style={styles.toggleBtn}>
                                    {item.status === 'Available' ? 'Mark Unavailable' : 'Mark Available'}
                                </button>
                                <button onClick={() => handleEditClick(item)} style={styles.editBtn}>Edit</button>
                                <button onClick={() => handleDelete(item.id)} style={styles.deleteBtn}>Delete</button>
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
    cafeSelector: { marginBottom: '20px' },
    select: { padding: '8px', borderRadius: '5px', border: '1px solid #F0DFC8', marginLeft: '10px' },
    formCard: { background: '#FFF8ED', border: '1px solid #F0DFC8', borderRadius: '10px', padding: '20px', marginBottom: '30px' },
    form: { display: 'flex', flexDirection: 'column', gap: '10px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' },
    input: { minWidth: 0, padding: '10px', borderRadius: '5px', border: '1px solid #F0DFC8' },
    textarea: { padding: '10px', borderRadius: '5px', border: '1px solid #F0DFC8', minHeight: '60px' },
    formButtons: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    saveBtn: { padding: '10px 20px', backgroundColor: '#E8720C', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' },
    cancelBtn: { padding: '10px 20px', backgroundColor: '#B99E7E', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap' },
    errorText: { color: '#e74c3c' },
    listTitle: { color: '#4A3B2A', marginBottom: '10px' },
    itemsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    itemRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', alignItems: 'center', padding: '15px', background: '#FFFFFF', border: '1px solid #F0DFC8', borderRadius: '8px', gap: '12px' },
    itemInfo: { minWidth: 0 },
    itemName: { display: 'inline-block', maxWidth: '100%', overflowWrap: 'anywhere' },
    itemMeta: { color: '#8C7A63', fontSize: '13px' },
    badge: { marginLeft: '10px', fontSize: '12px', padding: '2px 8px', borderRadius: '10px', background: '#FBE8CE', color: '#C25E00' },
    itemActions: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' },
    toggleBtn: { padding: '6px 12px', backgroundColor: '#B99E7E', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap' },
    editBtn: { padding: '6px 12px', backgroundColor: '#5CA85C', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap' },
    deleteBtn: { padding: '6px 12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap' },
};

export default CafeManagementPage;
