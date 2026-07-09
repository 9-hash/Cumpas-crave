import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import MockPayment from './components/MockPayment';
import AdminDashboard from './pages/AdminDashboard';
import CafeManagementPage from './pages/CafeManagementPage';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/cafe/:cafeId" element={<MenuPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/mock-payment" element={<MockPayment />} />
                    <Route path="/payment/success" element={<MockPayment />} />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute roles={['admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/cafe-management"
                        element={
                            <ProtectedRoute roles={['owner', 'admin']}>
                                <CafeManagementPage />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
