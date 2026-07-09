import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route so it's only reachable by authenticated users with an
 * allowed role. Not logged in -> /login. Logged in but wrong role -> /.
 *
 * Usage: <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
 */
const ProtectedRoute = ({ roles, children }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="loading">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

    return children;
};

export default ProtectedRoute;
