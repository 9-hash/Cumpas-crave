import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile } from '../api/profile';

const Profile = () => {
    const { user: authUser } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        getProfile()
            .then((data) => {
                if (mounted) setProfileData(data);
            })
            .catch((err) => {
                if (mounted) setError(err);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    if (loading) return <div className="loading">Loading profile...</div>;
    if (error) return <div className="error">Error: {error.message}</div>;

    const user = profileData?.user || authUser;
    const student = profileData?.profile;

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>My Profile</h2>
            <div style={styles.card}>
                <div style={styles.section}>
                    <h3>Account Information</h3>
                    <div style={styles.infoRow}>
                        <span>Username:</span>
                        <strong>{user?.username}</strong>
                    </div>
                    <div style={styles.infoRow}>
                        <span>Email:</span>
                        <strong>{user?.email}</strong>
                    </div>
                    <div style={styles.infoRow}>
                        <span>Phone:</span>
                        <strong>{user?.phone || 'Not provided'}</strong>
                    </div>
                    <div style={styles.infoRow}>
                        <span>Role:</span>
                        <strong>{user?.role}</strong>
                    </div>
                </div>

                {student && (
                    <div style={styles.section}>
                        <h3>Student Information</h3>
                        <div style={styles.infoRow}>
                            <span>Full Name:</span>
                            <strong>{student.full_name}</strong>
                        </div>
                        <div style={styles.infoRow}>
                            <span>Registration No:</span>
                            <strong>{student.reg_no}</strong>
                        </div>
                        <div style={styles.infoRow}>
                            <span>Institution:</span>
                            <strong>{student.institution}</strong>
                        </div>
                        <div style={styles.infoRow}>
                            <span>Department:</span>
                            <strong>{student.department || 'Not specified'}</strong>
                        </div>
                        <div style={styles.infoRow}>
                            <span>Verification Status:</span>
                            <span style={{
                                ...styles.verificationBadge,
                                backgroundColor: student.verification_status === 'Approved' ? '#5CA85C' : '#F4A300'
                            }}>
                                {student.verification_status}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
    },
    title: {
        marginBottom: '20px',
        color: '#4A3B2A',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(232, 114, 12, 0.1)',
        border: '1px solid #F0DFC8',
    },
    section: {
        marginBottom: '25px',
        paddingBottom: '20px',
        borderBottom: '1px solid #F5E6CC',
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
    },
    verificationBadge: {
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: 'white',
    },
};

export default Profile;
