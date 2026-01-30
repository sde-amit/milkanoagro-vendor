import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './vendorOnboarding.scss';
import Banner from '../banner/Banner';
import { CustomSelect, SuccessModal, OtpModal } from '../common';
import { useAuthStore, useVendorStore, useUIStore } from '../../stores';

const VendorOnboarding = () => {
    const navigate = useNavigate();

    // Zustand stores
    const {
        sendOTP,
        verifyOTP,
        login,
        isLoading: authLoading,
        error: authError,
        clearError
    } = useAuthStore();

    const {
        registerVendor,
        isLoading: vendorLoading
    } = useVendorStore();

    const {
        modals,
        openModal,
        closeModal
    } = useUIStore();

    // Local state
    const [contactNumber, setContactNumber] = useState('');
    const [otpValue, setOtpValue] = useState('');
    const [errors, setErrors] = useState({});
    const [showOtpForm, setShowOtpForm] = useState(false);
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [formData, setFormData] = useState({
        entityType: '',
        entityName: '',
        supplierType: '',
        state: '',
        city: '',
        pincode: '',
        authorizedPersonName: '',
        contactNumber: '',
        email: '',
        category: '',
        termsAccepted: false
    });

    const isLoading = authLoading || vendorLoading;

    // Validation functions
    const validateMobile = (mobile) => {
        const mobileRegex = /^\d{10}$/;
        return mobileRegex.test(mobile);
    };

    const handleContactNumberChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10); // Only digits, max 10
        setContactNumber(value);

        // Clear error when user starts typing
        if (errors.contactNumber) {
            setErrors(prev => ({ ...prev, contactNumber: '' }));
        }
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();

        if (!validateMobile(contactNumber)) {
            setErrors({ contactNumber: 'Please enter a valid 10-digit mobile number' });
            return;
        }

        try {
            await sendOTP(contactNumber, 'login');
            setShowOtpForm(true);
            setOtpValue('');
            setErrors({});
            toast.success('OTP sent successfully!');
        } catch (error) {
            // Extract error message properly from different possible error structures
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.originalError ||
                error.message ||
                'Failed to send OTP';
            toast.error(errorMessage);
        }
    };

    const handleRegister = () => {
        setShowRegisterForm(true);
        setShowOtpForm(false);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        // Validation for contact numbers - limit to 10 digits
        if (name === 'contactNumber' && e.target.type === 'tel') {
            processedValue = value.replace(/\D/g, '').slice(0, 10);
        }

        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        // Validate form data
        const newErrors = {};
        if (!formData.entityType) newErrors.entityType = 'Please select entity type';
        if (!formData.entityName) newErrors.entityName = 'Please enter entity name';
        if (!formData.supplierType) newErrors.supplierType = 'Please select supplier type';
        if (!formData.state) newErrors.state = 'Please select state';
        if (!formData.city) newErrors.city = 'Please select city';
        if (!formData.pincode) newErrors.pincode = 'Please enter pincode';
        if (!formData.authorizedPersonName) newErrors.authorizedPersonName = 'Please enter authorized person name';
        if (!formData.contactNumber) newErrors.contactNumber = 'Please enter contact number';
        if (!formData.email) newErrors.email = 'Please enter email';
        if (!formData.category) newErrors.category = 'Please select category';
        if (!formData.termsAccepted) newErrors.termsAccepted = 'Please accept the terms and conditions';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            // First register the vendor
            await registerVendor(formData);
            toast.success('Registration successful!');

            // Then send OTP for verification
            await sendOTP(formData.contactNumber, 'registration');

            // Open OTP modal
            openModal('otp', {
                contactNumber: formData.contactNumber,
                title: 'VERIFY REGISTRATION',
                purpose: 'registration'
            });

            toast.success('OTP sent to your phone number!');
        } catch (error) {
            // Extract error message properly from different possible error structures
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.originalError ||
                error.message ||
                'Registration failed';
            toast.error(errorMessage);
        }
    };

    const handleOtpModalSubmit = async (otpCode) => {
        try {
            const purpose = modals.otp.purpose || 'registration';
            const phone = modals.otp.contactNumber;

            if (purpose === 'registration') {
                await verifyOTP(phone, otpCode, 'registration');
                toast.success('Registration verified successfully!');
            } else {
                await login(phone, otpCode);
                toast.success('Login successful!');
                navigate('/vendor-onboarding-form');
            }

            closeModal('otp');
            setShowSuccessModal(true);

            // Auto close success modal after 3 seconds
            setTimeout(() => {
                setShowSuccessModal(false);
                if (purpose === 'registration') {
                    // Reset form after successful registration
                    setShowRegisterForm(false);
                    setShowOtpForm(false);
                }
            }, 3000);
        } catch (error) {
            // Extract error message properly from different possible error structures
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.originalError ||
                error.message ||
                'OTP verification failed';
            toast.error(errorMessage);
        }
    };

    const handleOtpModalClose = () => {
        closeModal('otp');
        clearError();
    };

    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
        setOtpValue(value);
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();

        if (!otpValue || otpValue.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        try {
            await login(contactNumber, otpValue);
            setShowOtpForm(false);
            setShowSuccessModal(true);
            toast.success('Login successful!');

            // Auto close success modal after 3 seconds and redirect
            setTimeout(() => {
                setShowSuccessModal(false);
                navigate('/vendor-onboarding-form');
            }, 3000);
        } catch (error) {
            // Extract error message properly from different possible error structures
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.originalError ||
                error.message ||
                'Invalid OTP';
            toast.error(errorMessage);
        }
    };

    const closeSuccessModal = () => {
        setShowSuccessModal(false);
        // Reset form or stay on current page instead of navigating away
        setShowRegisterForm(false);
        setShowOtpForm(false);
    };

    return (
        <>
            <Banner />
            <div className="vendor_onboarding_container">
                {/* Hero Section */}
                <div className="vendor_hero_section">
                    <div className="container">
                        <div className="vendor_hero_content">
                            <h2 className="vendor_title">Vendor OnBoarding</h2>
                            <h1 className="vendor_main_heading">
                                Are you a small farmer or a struggling entrepreneur—
                                <br />
                                looking for the right marketplace?
                            </h1>
                            <p className="vendor_description">
                                Milkano Agro India not only partners with leading FMCG Food and Non-Food companies but also empower individual farmers and entrepreneurs to
                                onboard us as sellers or suppliers on its online and offline platform—BigBonus.
                            </p>
                            <div className="vendor_cta">
                                <p className="vendor_cta_text">
                                    <strong>Join BigBonus to gain greater visibility, fair pricing, and consistent demand for your products. <br />BigBonus — Bringing your produce closer to consumers.</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Login/Register Section */}
                <div className="vendor_login_section">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-6 col-md-12">
                                <div className="login_form_container">
                                    {!showOtpForm && !showRegisterForm ? (
                                        // Contact Number Form (Always visible now)
                                        <>
                                            <h3 className="login_title">
                                                Login to OnBoard <span className="approved_user">(For Approved User)</span>
                                            </h3>

                                            <form onSubmit={handleContactSubmit} className="login_form">
                                                <div className="form_group">
                                                    <label htmlFor="contactNo">Contact No</label>
                                                    <input
                                                        type="tel"
                                                        id="contactNo"
                                                        value={contactNumber}
                                                        onChange={handleContactNumberChange}
                                                        placeholder="1234567890"
                                                        className={`form_input ${errors.contactNumber ? 'error' : ''}`}
                                                        maxLength="10"
                                                    />
                                                    {errors.contactNumber && <span className="error_message">{errors.contactNumber}</span>}
                                                </div>

                                                <button type="submit" className="submit_btn send_otp_btn" disabled={isLoading}>
                                                    {isLoading ? 'Sending...' : 'Send Otp'}
                                                </button>
                                            </form>

                                            <div className="register_section">
                                                <p className="register_text">Don't have an account?</p>
                                                <button onClick={handleRegister} className="register_btn">
                                                    Register Now
                                                </button>
                                            </div>
                                        </>
                                    ) : showOtpForm && !showRegisterForm ? (
                                        // OTP Form
                                        <>
                                            <h3 className="login_title">
                                                Login to OnBoard <span className="approved_user">(For Approved User)</span>
                                            </h3>

                                            <form onSubmit={handleOtpSubmit} className="otp_form">
                                                <div className="form_group">
                                                    <label htmlFor="otp">Enter OTP</label>
                                                    <input
                                                        type="text"
                                                        id="otp"
                                                        name="otp"
                                                        value={otpValue}
                                                        onChange={handleOtpChange}
                                                        placeholder="Enter OTP"
                                                        className="form_input otp_input_field"
                                                        maxLength="6"
                                                        autoComplete="off"
                                                        required
                                                    />
                                                </div>

                                                <p className="otp_message">
                                                    We have sent a SMS verification code to - <strong>{contactNumber}</strong>
                                                </p>

                                                <button type="submit" className="submit_btn verify_otp_btn" disabled={isLoading}>
                                                    {isLoading ? 'Verifying...' : 'Verify Otp'}
                                                </button>
                                            </form>

                                            <div className="register_section">
                                                <p className="register_text">Don't have an account?</p>
                                                <button onClick={handleRegister} className="register_btn">
                                                    Register Now
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        // Registration Form
                                        <>
                                            <form onSubmit={handleRegisterSubmit} className="register_form">
                                                <div className="form_row">
                                                    <div className="form_group">
                                                        <label htmlFor="entityType">I Am/We Are</label>
                                                        <CustomSelect
                                                            id="entityType"
                                                            name="entityType"
                                                            value={formData.entityType}
                                                            onChange={handleInputChange}
                                                            options={[
                                                                { value: "", label: "Select" },
                                                                { value: "Mandi Vendor/Company/FPO", label: "Mandi Vendor/Company/FPO" },
                                                                { value: "Individual Farmer", label: "Individual Farmer" },
                                                                { value: "Trader", label: "Trader" }
                                                            ]}
                                                        />
                                                    </div>

                                                    <div className="form_group">
                                                        <label htmlFor="entityName">Name of the Entity (as per GST/Udyam Certificate)</label>
                                                        <input
                                                            type="text"
                                                            id="entityName"
                                                            name="entityName"
                                                            value={formData.entityName}
                                                            onChange={handleInputChange}
                                                            placeholder="Enter entity name"
                                                            className="form_input"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form_row">
                                                    <div className="form_group">
                                                        <label htmlFor="supplierType">Type of Supplier</label>
                                                        <CustomSelect
                                                            id="supplierType"
                                                            name="supplierType"
                                                            value={formData.supplierType}
                                                            onChange={handleInputChange}
                                                            options={[
                                                                { value: "", label: "Select" },
                                                                { value: "Trader", label: "Trader" },
                                                                { value: "Manufacturer", label: "Manufacturer" },
                                                                { value: "Distributor", label: "Distributor" }
                                                            ]}
                                                        />
                                                    </div>

                                                    <div className="form_group">
                                                        <label htmlFor="state">State</label>
                                                        <CustomSelect
                                                            id="state"
                                                            name="state"
                                                            value={formData.state}
                                                            onChange={handleInputChange}
                                                            options={[
                                                                { value: "", label: "Select State" },
                                                                { value: "Haryana", label: "Haryana" },
                                                                { value: "Punjab", label: "Punjab" },
                                                                { value: "Uttar Pradesh", label: "Uttar Pradesh" },
                                                                { value: "Delhi", label: "Delhi" }
                                                            ]}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form_row">
                                                    <div className="form_group">
                                                        <label htmlFor="city">City</label>
                                                        <CustomSelect
                                                            id="city"
                                                            name="city"
                                                            value={formData.city}
                                                            onChange={handleInputChange}
                                                            options={[
                                                                { value: "", label: "Select City" },
                                                                { value: "Gurgaon", label: "Gurgaon" },
                                                                { value: "Delhi", label: "Delhi" },
                                                                { value: "Noida", label: "Noida" }
                                                            ]}
                                                        />
                                                    </div>

                                                    <div className="form_group">
                                                        <label htmlFor="pincode">Pincode</label>
                                                        <input
                                                            type="text"
                                                            id="pincode"
                                                            name="pincode"
                                                            value={formData.pincode}
                                                            onChange={handleInputChange}
                                                            placeholder="Enter pincode"
                                                            className="form_input"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form_row">
                                                    <div className="form_group">
                                                        <label htmlFor="authorizedPersonName">Name of the Authorized Person (as per Aadhar Card)</label>
                                                        <input
                                                            type="text"
                                                            id="authorizedPersonName"
                                                            name="authorizedPersonName"
                                                            value={formData.authorizedPersonName}
                                                            onChange={handleInputChange}
                                                            placeholder="Enter authorized person name"
                                                            className="form_input"
                                                        />
                                                    </div>

                                                    <div className="form_group">
                                                        <label htmlFor="contactNumber">Contact No. of Authorized Person (For Office Use Only)</label>
                                                        <input
                                                            type="tel"
                                                            id="contactNumber"
                                                            name="contactNumber"
                                                            value={formData.contactNumber}
                                                            onChange={handleInputChange}
                                                            placeholder="1234567890"
                                                            className={`form_input ${errors.contactNumber ? 'error' : ''}`}
                                                            maxLength="10"
                                                        />
                                                        {errors.contactNumber && <span className="error_message">{errors.contactNumber}</span>}
                                                    </div>
                                                </div>

                                                <div className="form_row">
                                                    <div className="form_group">
                                                        <label htmlFor="email">Email Id of the Authorised Person (For official use only)</label>
                                                        <input
                                                            type="email"
                                                            id="email"
                                                            name="email"
                                                            value={formData.email}
                                                            onChange={handleInputChange}
                                                            placeholder="contact@example.com"
                                                            className={`form_input ${errors.email ? 'error' : ''}`}
                                                            pattern="[a-z0-9._\%+-]+@[a-z0-9.-]+\.[a-z]{2,}"
                                                            title="Please enter a valid email address"
                                                        />
                                                        {errors.email && <span className="error_message">{errors.email}</span>}
                                                    </div>

                                                    <div className="form_group">
                                                        <label htmlFor="category">Category you deal with (Select multiple, if any)</label>
                                                        <CustomSelect
                                                            id="category"
                                                            name="category"
                                                            value={formData.category}
                                                            onChange={handleInputChange}
                                                            options={[
                                                                { value: "", label: "Select" },
                                                                { value: "Fruits", label: "Fruits" },
                                                                { value: "Vegetables", label: "Vegetables" },
                                                                { value: "Grains", label: "Grains" },
                                                                { value: "Dairy", label: "Dairy" }
                                                            ]}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form_group checkbox_group">
                                                    <label className="checkbox_label">
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox_input"
                                                            name="termsAccepted"
                                                            checked={formData.termsAccepted}
                                                            onChange={handleInputChange}
                                                        />
                                                        <span className="checkbox_text">
                                                            Once approved, you will be informed by a text message. Please Login again and fill the Onboarding Form.
                                                        </span>
                                                    </label>
                                                    {errors.termsAccepted && <span className="error_message">{errors.termsAccepted}</span>}
                                                </div>

                                                <button type="submit" className="submit_btn" disabled={isLoading}>
                                                    {isLoading ? 'Submitting...' : 'Submit Now'}
                                                </button>
                                            </form>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="col-lg-6 col-md-12">
                                <div className="vendor_image_container">
                                    <img
                                        src="https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                                        alt="Business Partnership"
                                        className="vendor_image"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Success Modal */}
                <SuccessModal
                    isOpen={showSuccessModal}
                    onClose={closeSuccessModal}
                    title="Thank you!"
                    message="Your submission has been sent"
                    autoClose={true}
                    autoCloseDelay={3000}
                />

                {/* OTP Modal */}
                <OtpModal
                    isOpen={modals.otp.isOpen}
                    onClose={handleOtpModalClose}
                    onSubmit={handleOtpModalSubmit}
                    contactNumber={modals.otp.contactNumber}
                    title={modals.otp.title}
                />
            </div>
        </>
    );
};

export default VendorOnboarding;