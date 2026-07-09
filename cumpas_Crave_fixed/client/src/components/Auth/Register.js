import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import './Register.css';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        reg_no: '',
        institution: '',
        department: '',
        year_of_study: '',
        gender: ''
    });
    const [studentIdImage, setStudentIdImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [studentInfo, setStudentInfo] = useState(null);
    const fileInputRef = useRef(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.match('image.*')) {
                setError('Please upload an image file (JPEG, PNG)');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('File is too large! Maximum size is 5MB.');
                return;
            }
            
            setStudentIdImage(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = () => {
        if (!formData.username.trim()) {
            setError('Username is required');
            return false;
        }
        if (!formData.full_name.trim()) {
            setError('Full name is required');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!formData.password) {
            setError('Password is required');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        if (!formData.reg_no.trim()) {
            setError('Registration number is required');
            return false;
        }
        if (!formData.institution.trim()) {
            setError('Institution is required');
            return false;
        }
        if (!studentIdImage) {
            setError('Please upload your student ID card');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setError('');
        setLoading(true);

        try {
            // In production, you would upload the image to your backend
            // For now, we'll proceed with registration

            const { token, user } = await registerUser({
                username: formData.username,
                full_name: formData.full_name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone || '',
                reg_no: formData.reg_no,
                institution: formData.institution,
                department: formData.department || '',
                year_of_study: parseInt(formData.year_of_study) || null
            });

            login(token, user);
            setStudentInfo({
                name: formData.full_name,
                reg_no: formData.reg_no,
                institution: formData.institution,
                department: formData.department,
                idUploaded: Boolean(studentIdImage)
            });
            setShowSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 3000);
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="success-modal-overlay">
                <div className="success-modal">
                    <div className="success-icon">✓</div>
                    <h2>Registration Successful!</h2>
                    <p>Welcome to Campus Crave, {formData.full_name}!</p>
                    <div className="student-info-card">
                        <h3>Student Information</h3>
                        <p><strong>Name:</strong> {studentInfo?.name}</p>
                        <p><strong>Registration No:</strong> {studentInfo?.reg_no}</p>
                        <p><strong>Institution:</strong> {studentInfo?.institution}</p>
                        <p><strong>Department:</strong> {studentInfo?.department}</p>
                        {studentInfo?.idUploaded && (
                            <p><strong>Student ID:</strong> Uploaded</p>
                        )}
                    </div>
                    <p className="redirect-message">Redirecting to home page...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="register-container">
            <div className="register-wrapper">
                <div className="register-illustration">
                    <div className="illustration-content">
                        <h1>Campus Crave</h1>
                        <p>Join our exclusive student community. Upload your student ID and access student-only benefits.</p>
                        <div className="feature-list">
                            <div className="feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Secure student registration</span>
                            </div>
                            <div className="feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Student ID upload</span>
                            </div>
                            <div className="feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Instant status notification</span>
                            </div>
                            <div className="feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Exclusive student discounts</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="register-form-container">
                    <div className="form-header">
                        <i className="fas fa-graduation-cap"></i>
                        <h2>Student Registration</h2>
                    </div>
                    
                    <h1 className="form-title">Create Your Account</h1>
                    <p className="form-subtitle">Fill in your details and upload your student ID</p>

                    <form onSubmit={handleSubmit} className="register-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Full Name *</label>
                                <div className="input-icon">
                                    <i className="fas fa-user"></i>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Username *</label>
                                <div className="input-icon">
                                    <i className="fas fa-id-badge"></i>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="Choose a username"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Registration Number *</label>
                                <div className="input-icon">
                                    <i className="fas fa-id-card"></i>
                                    <input
                                        type="text"
                                        name="reg_no"
                                        value={formData.reg_no}
                                        onChange={handleChange}
                                        placeholder="e.g., CST/123/14"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Gender</label>
                                <div className="input-icon">
                                    <i className="fas fa-venus-mars"></i>
                                    <select name="gender" value={formData.gender} onChange={handleChange}>
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Email *</label>
                                <div className="input-icon">
                                    <i className="fas fa-envelope"></i>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <div className="input-icon">
                                    <i className="fas fa-phone"></i>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="Your phone number"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Password *</label>
                                <div className="input-icon">
                                    <i className="fas fa-lock"></i>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Create a password"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Confirm Password *</label>
                                <div className="input-icon">
                                    <i className="fas fa-lock"></i>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm your password"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Institution *</label>
                                <div className="input-icon">
                                    <i className="fas fa-university"></i>
                                    <input
                                        type="text"
                                        name="institution"
                                        value={formData.institution}
                                        onChange={handleChange}
                                        placeholder="Your university/college"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Department</label>
                                <div className="input-icon">
                                    <i className="fas fa-book"></i>
                                    <input
                                        type="text"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        placeholder="Your department"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Student ID Card *</label>
                            <div className="file-upload-area" onClick={() => fileInputRef.current.click()}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />
                                {imagePreview ? (
                                    <div className="image-preview">
                                        <img src={imagePreview} alt="Student ID Preview" />
                                        <button type="button" className="remove-image" onClick={(e) => {
                                            e.stopPropagation();
                                            setImagePreview(null);
                                            setStudentIdImage(null);
                                        }}>✕</button>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder">
                                        <i className="fas fa-cloud-upload-alt"></i>
                                        <p>Click to upload your Student ID Card</p>
                                        <p className="file-info">Supported formats: JPG, PNG | Max size: 5MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {studentIdImage && (
                            <div className="ocr-success">
                                <i className="fas fa-check-circle"></i>
                                <div>
                                    <strong>Student ID uploaded</strong>
                                    <p>Your ID image is attached for review.</p>
                                </div>
                            </div>
                        )}

                        {error && <div className="error-message">{error}</div>}

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="submit-btn"
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-user-plus"></i>
                                    Register Student
                                </>
                            )}
                        </button>

                        <p className="login-link">
                            Already have an account? <Link to="/login">Login here</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
