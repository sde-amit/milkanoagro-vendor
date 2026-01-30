import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { IoChevronDown } from 'react-icons/io5';
import { FaCloudUploadAlt, FaDownload, FaUpload, FaPlus, FaMinus, FaEye, FaFileAlt, FaImage, FaFilePdf } from "react-icons/fa";
import './vendorOnboardingForm.scss';
import Banner from '../banner/Banner';
import { CustomSelect, OtpModal, SuccessModal } from '../common';
import { useAuthStore, useVendorStore, useUIStore } from '../../stores';
import { uploadAPI } from '../../services/api';

const VendorOnboardingForm = () => {
    const navigate = useNavigate();

    // Zustand stores
    const {
        isAuthenticated,
        user,
        sendOTP,
        verifyOTP
    } = useAuthStore();

    const {
        formData,
        updateFormData,
        addProduct,
        removeProduct,
        updateProduct,
        submitOnboarding,
        isLoading: vendorLoading
    } = useVendorStore();

    const {
        modals,
        openModal,
        closeModal
    } = useUIStore();

    // Local state
    const [activeTab, setActiveTab] = useState('profile');
    const [errors, setErrors] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            toast.error('Please login first');
            navigate('/vendor-onboarding');
        }
    }, [isAuthenticated, navigate]);

    // Fetch vendor profile data when component mounts
    useEffect(() => {
        const fetchVendorData = async () => {
            if (isAuthenticated && user) {
                try {
                    // Fetch vendor profile to auto-fill form
                    const { fetchProfile, fetchOnboardingStatus } = useVendorStore.getState();

                    // Try to fetch existing profile data
                    try {
                        const profileData = await fetchProfile();
                    } catch (error) {
                        // Profile might not exist yet, that's okay
                    }

                    // Try to fetch onboarding status
                    try {
                        await fetchOnboardingStatus();
                    } catch (error) {
                        // Onboarding might not exist yet, that's okay
                    }

                    // Auto-fill basic user information
                    updateFormData({
                        mobileNo: user.phone || '',
                        emailId: user.email || '',
                        mobileNumber: user.phone || '',
                        emailAddress: user.email || ''
                    });

                } catch (error) {
                    console.error('Error fetching vendor data:', error);
                }
            }
        };

        fetchVendorData();
    }, [isAuthenticated, user, updateFormData]);

    // Scroll to top when tab changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

    // Debug: Log uploaded files whenever they change
    useEffect(() => {
        if (formData.uploadedFiles) {
            Object.keys(formData.uploadedFiles).forEach(key => {
            });
        }
    }, [formData.uploadedFiles]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        let processedValue = value;

        // Validation for contact numbers - limit to 10 digits
        if ((name === 'mobileNo' || name === 'mobileNumber' || name === 'contactNumber') && type !== 'checkbox') {
            processedValue = value.replace(/\D/g, '').slice(0, 10);
        }

        const updateData = {
            [name]: type === 'checkbox' ? checked : processedValue
        };

        updateFormData(updateData);

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validation functions
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateMobile = (mobile) => {
        const mobileRegex = /^\d{10}$/; // Any 10-digit number
        return mobileRegex.test(mobile);
    };

    const validateForm = () => {
        const newErrors = {};

        // Email validations
        if (formData.emailId && !validateEmail(formData.emailId)) {
            newErrors.emailId = 'Please enter a valid email address';
        }
        if (formData.emailAddress && !validateEmail(formData.emailAddress)) {
            newErrors.emailAddress = 'Please enter a valid email address';
        }

        // Mobile number validations
        if (formData.mobileNo && !validateMobile(formData.mobileNo)) {
            newErrors.mobileNo = 'Please enter a valid 10-digit mobile number';
        }
        if (formData.mobileNumber && !validateMobile(formData.mobileNumber)) {
            newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleProductChange = (productId, field, value) => {
        updateProduct(productId, { [field]: value });
    };

    const handleQuantityChange = (productId, increment) => {
        const product = formData.products.find(p => p.id === productId);
        if (product) {
            const newQuantity = Math.max(0, product.quantity + increment);
            updateProduct(productId, { quantity: newQuantity });
        }
    };

    const addNewProduct = () => {
        addProduct();
    };

    const removeProductHandler = (productId) => {
        if (formData.products.length > 1) {
            removeProduct(productId);
        } else {
            toast.error('At least one product is required');
        }
    };

    const handleFileUpload = async (e, fieldName) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must not exceed 10MB');
            return;
        }

        // Check file type based on field name
        let allowedTypes;
        if (fieldName === 'productList') {
            allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Only CSV and Excel files are allowed for product list');
                return;
            }
        } else {
            allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Only PDF, JPG, JPEG, and PNG files are allowed');
                return;
            }
        }
        try {
            // Show upload progress
            toast.loading(`Uploading ${file.name}...`);

            // Get vendor onboarding ID from store
            const { getVendorOnboardingId } = useVendorStore.getState();
            const vendorOnboardingId = getVendorOnboardingId();
            // Upload file using the API service with category and vendor onboarding ID
            const response = await uploadAPI.uploadFiles([file], fieldName, vendorOnboardingId);
            // Update form data with uploaded file info
            const uploadedFile = response.data.data.files[0];
            const currentUploadedFiles = formData.uploadedFiles || {};

            const newFileData = {
                id: uploadedFile.id,
                name: uploadedFile.original_name,
                size: uploadedFile.file_size,
                type: uploadedFile.mime_type,
                url: uploadedFile.s3_url,
                serverPath: uploadedFile.file_path,
                category: fieldName
            };

            // Organize files by category for better structure
            const updatedFiles = {
                ...currentUploadedFiles,
                [fieldName]: newFileData
            };
            updateFormData({
                uploadedFiles: updatedFiles
            });

            toast.dismiss();
            toast.success(`${file.name} uploaded successfully`);

        } catch (error) {
            console.error('❌ File upload error:', error);
            toast.dismiss();
            toast.error(error.response?.data?.message || error.message || 'Failed to upload file');
        }
    };

    const handleFileView = async (fileData) => {
        if (!fileData) {
            console.error('❌ No file data provided');
            toast.error('File data not available');
            return;
        }

        try {
            // Show loading toast
            toast.loading(`Loading ${fileData.name}...`);

            let fileUrl = fileData.url;
            // If we have a file ID, fetch a fresh signed URL from the backend
            if (fileData.id) {
                try {
                    const response = await uploadAPI.getDownloadUrl(fileData.id);
                    fileUrl = response.data.data.downloadUrl;
                } catch (error) {
                    console.warn('⚠️ Could not get fresh signed URL, using stored URL:', error);
                    // Fallback to stored URL if API call fails
                }
            }

            // Check if we have a valid URL
            if (!fileUrl) {
                console.error('❌ No valid file URL available');
                toast.dismiss();
                toast.error('File URL not available');
                return;
            }
            // Open file in new tab
            window.open(fileUrl, '_blank');

            toast.dismiss();
            toast.success(`Opening ${fileData.name}`);

        } catch (error) {
            console.error('❌ Error viewing file:', error);
            toast.dismiss();
            toast.error('Failed to open file');
        }
    };

    const getFileIcon = (fileType, mimeType) => {
        if (mimeType?.includes('pdf')) {
            return <FaFilePdf className="file_type_icon pdf" />;
        } else if (mimeType?.includes('image')) {
            return <FaImage className="file_type_icon image" />;
        } else if (mimeType?.includes('csv') || mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) {
            return <FaFileAlt className="file_type_icon excel" />;
        }
    };

    const renderFileDisplay = (fieldName) => {
        const fileData = formData.uploadedFiles?.[fieldName];
        if (!fileData) return null;

        return (
            <div className="uploaded_file_info">
                <div className="file_details">
                    {getFileIcon('document', fileData.type)}
                    <span className="file_name_text">{fileData.name}</span>
                </div>
                <div className="file_actions">
                    <button
                        type="button"
                        className="file_action_btn view_btn"
                        onClick={() => handleFileView(fileData)}
                        title="View file"
                    >
                        <FaEye />
                    </button>
                    <button
                        type="button"
                        className="file_action_btn download_btn"
                        onClick={() => handleFileView(fileData)}
                        title="Download file"
                    >
                        <FaDownload />
                    </button>
                </div>
            </div>
        );
    };

    const handleSameAddressChange = (e) => {
        const isChecked = e.target.checked;
        const updates = {
            sameAsRegistered: isChecked,
            ...(isChecked && {
                corrBuildingName: formData.buildingName,
                corrFlatNo: formData.flatNo,
                corrWardNo: formData.wardNo,
                corrState: formData.regState,
                corrDist: formData.regDist,
                corrPincode: formData.regPincode
            })
        };
        updateFormData(updates);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            try {
                await submitOnboarding(false); // Pass false for final submission
                setShowSuccessModal(true);
                toast.success('Onboarding form submitted successfully!');

                // Auto close success modal after 3 seconds
                setTimeout(() => {
                    setShowSuccessModal(false);
                    navigate('/'); // Redirect to home or dashboard
                }, 3000);
            } catch (error) {
                // Extract error message properly from different possible error structures
                let errorMessage = error.response?.data?.message ||
                    error.response?.data?.originalError ||
                    error.message ||
                    'Failed to submit onboarding form';

                // Check if the error message is a JSON string and try to parse it
                if (typeof errorMessage === 'string' && errorMessage.startsWith('[')) {
                    try {
                        const parsedErrors = JSON.parse(errorMessage);
                        if (Array.isArray(parsedErrors)) {
                            // Format the validation errors into a readable message
                            const formattedErrors = parsedErrors.map(err => err.message).join(', ');
                            errorMessage = `Please fix the following errors: ${formattedErrors}`;
                        }
                    } catch (parseError) {
                        // If parsing fails, use the original message
                        console.warn('Could not parse error message as JSON:', parseError);
                    }
                }

                toast.error(errorMessage);
            }
        } else {
            toast.error('Please fix the validation errors');
        }
    };

    const handleSave = async () => {
        if (validateForm()) {
            try {
                toast.loading('Saving form data...');

                const result = await submitOnboarding(true); // Pass true for isDraft
                toast.dismiss();
                toast.success('Form data saved successfully!');
            } catch (error) {
                console.error('❌ Save error:', error);
                toast.dismiss();

                // Extract error message properly from different possible error structures
                let errorMessage = error.response?.data?.message ||
                    error.response?.data?.originalError ||
                    error.message ||
                    'Failed to save form data';

                // Check if the error message is a JSON string and try to parse it
                if (typeof errorMessage === 'string' && errorMessage.startsWith('[')) {
                    try {
                        const parsedErrors = JSON.parse(errorMessage);
                        if (Array.isArray(parsedErrors)) {
                            // Format the validation errors into a readable message
                            const formattedErrors = parsedErrors.map(err => err.message).join(', ');
                            errorMessage = `Please fix the following errors: ${formattedErrors}`;
                        }
                    } catch (parseError) {
                        // If parsing fails, use the original message
                        console.warn('Could not parse error message as JSON:', parseError);
                    }
                }

                toast.error(errorMessage);
            }
        } else {
            toast.error('Please fix the validation errors');
        }
    };

    const handleSaveAndNext = async () => {
        if (validateForm()) {
            try {
                // First, save the onboarding form data
                toast.loading('Saving form data...');

                const result = await submitOnboarding(true); // Pass true for isDraft
                toast.dismiss();
                toast.success('Form data saved successfully!');

                // Then send OTP for verification
                const phoneNumber = formData.mobileNo || user?.phone;
                await sendOTP(phoneNumber, 'verification');
                // Open OTP modal
                openModal('otp', {
                    contactNumber: phoneNumber,
                    title: 'VERIFY TO CONTINUE',
                    purpose: 'verification'
                });
                toast.success('OTP sent to your phone!');
            } catch (error) {
                console.error('❌ Save and Next error:', error);
                toast.dismiss();
                toast.error(error.message || 'Failed to save form data');
            }
        } else {
            toast.error('Please fix the validation errors');
        }
    };

    const handleOtpModalSubmit = async (otpCode) => {
        try {
            const phoneNumber = modals.otp.contactNumber;
            const purpose = modals.otp.purpose || 'verification';
            // Verify the OTP
            await verifyOTP(phoneNumber, otpCode, purpose);

            closeModal('otp');
            toast.success('Verification successful!');
            // Check the purpose to determine next action
            if (purpose === 'verification') {
                // For Save and Next - redirect to product details
                // Force tab switch with multiple approaches
                setActiveTab('documents');

                // Also scroll to top to ensure user sees the tab change
                window.scrollTo({ top: 0, behavior: 'smooth' });

                toast.success('Redirecting to Product Details...');

                // Add a delay to ensure state update and log the result
                setTimeout(() => {
                    // Force a re-render by updating the state again if needed
                    setActiveTab(prev => {
                        return 'documents';
                    });
                }, 200);
            } else {
                // For regular save - show success modal
                setShowSuccessModal(true);
                setTimeout(() => {
                    setShowSuccessModal(false);
                }, 3000);
            }
        } catch (error) {
            console.error('❌ OTP verification error:', error);
            toast.error(error.message || 'OTP verification failed');
        }
    };

    const handleOtpModalClose = () => {
        closeModal('otp');
    };

    const closeSuccessModal = () => {
        setShowSuccessModal(false);
        setActiveTab('documents');
    };

    return (
        <>
            <Banner />
            <div className="container onboarding_form_container">
                <div className="form_wrapper">
                    <div className="form_header">
                        <div className="logo_section">
                            <img src="/src/assets/logo.png" alt="Milkano Agro India" className="company_logo" />
                            <div className="company_info">
                                <h2>Milkano Agro India</h2>
                                <p>ONBOARDING FORM</p>
                            </div>
                        </div>
                    </div>

                    <div className="form_tabs">
                        <button
                            className={`tab_button ${activeTab === 'profile' ? 'active' : ''} ${activeTab === 'documents' ? 'completed' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            Profile
                        </button>

                        <button
                            className={`tab_button ${activeTab === 'documents' ? 'active' : ''}`}
                            onClick={() => setActiveTab('documents')}
                        >
                            Product Details
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="onboarding_form">
                        {activeTab === 'profile' && (
                            <>
                                {/* Profile Section */}
                                <div className="form_section profile_section">
                                    <div className="form_row">
                                        <div className="form_group">
                                            <label>I Am/We Are</label>
                                            <input
                                                type="text"
                                                name="companyType"
                                                value={formData.companyType}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="Private Limited Company"
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Supply To</label>
                                            <CustomSelect
                                                name="supplyTo"
                                                value={formData.supplyTo || ''}
                                                onChange={handleInputChange}
                                                options={[
                                                    { value: "direct-store-delivery", label: "Direct Store Delivery (DSD)/WHS Full form" },
                                                    { value: "warehouse", label: "Warehouse" },
                                                    { value: "retail", label: "Retail" }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                    <div className="form_row">
                                        <div className="form_group">
                                            <label>State</label>
                                            <CustomSelect
                                                name="state"
                                                value={formData.state}
                                                onChange={handleInputChange}
                                                options={[
                                                    { value: "haryana", label: "Haryana" },
                                                    { value: "punjab", label: "Punjab" },
                                                    { value: "delhi", label: "Delhi" },
                                                    { value: "uttar-pradesh", label: "Uttar Pradesh" }
                                                ]}
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>City</label>
                                            <CustomSelect
                                                name="city"
                                                value={formData.city || ''}
                                                onChange={handleInputChange}
                                                options={[
                                                    { value: "gurgaon", label: "Gurgaon" },
                                                    { value: "faridabad", label: "Faridabad" },
                                                    { value: "noida", label: "Noida" }
                                                ]}
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Select Multiple Store (DSD)</label>
                                            <CustomSelect
                                                name="multipleStore"
                                                value={formData.multipleStore || ''}
                                                onChange={handleInputChange}
                                                options={[
                                                    { value: "store-1", label: "Store 1" },
                                                    { value: "store-2", label: "Store 2" },
                                                    { value: "store-3", label: "Store 3" }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Details of the Entity Section */}
                                <div className="form_section">
                                    <h3 className="section_title">Details of the Entity</h3>
                                    <div className="form_row">
                                        <div className="form_group">
                                            <label>Name of the Authorized Person</label>
                                            <input
                                                type="text"
                                                name="nameOfAuthorizedPerson"
                                                value={formData.nameOfAuthorizedPerson}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="Vinayak"
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Name of The Entity</label>
                                            <input
                                                type="text"
                                                name="nameOfEntity"
                                                value={formData.nameOfEntity}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="Sri Ram & Company"
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Name of Establishment</label>
                                            <input
                                                type="text"
                                                name="nameOfEstablishment"
                                                value={formData.nameOfEstablishment}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="Farmhouse/Firm"
                                            />
                                        </div>
                                    </div>
                                    <div className="form_row">
                                        <div className="form_group">
                                            <label>Type of Supplier</label>
                                            <input
                                                type="text"
                                                name="typeOfSupplier"
                                                value={formData.typeOfSupplier}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="GSTIN 15 Digit"
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Mobile No.</label>
                                            <input
                                                type="tel"
                                                name="mobileNo"
                                                value={formData.mobileNo}
                                                onChange={handleInputChange}
                                                className={`form_input ${errors.mobileNo ? 'error' : ''}`}
                                                placeholder="1234567890"
                                                maxLength="10"
                                            />
                                            {errors.mobileNo && <span className="error_message">{errors.mobileNo}</span>}
                                        </div>
                                    </div>
                                    <div className="form_row">
                                        <div className="form_group full_width">
                                            <label>Email ID</label>
                                            <input
                                                type="email"
                                                name="emailId"
                                                value={formData.emailId}
                                                onChange={handleInputChange}
                                                className={`form_input ${errors.emailId ? 'error' : ''}`}
                                                placeholder="vinayak.singh@gmail.com"
                                                pattern="[a-z0-9._\%+-]+@[a-z0-9.-]+\.[a-z]{2,}"
                                                title="Please enter a valid email address"
                                            />
                                            {errors.emailId && <span className="error_message">{errors.emailId}</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Registered Address Section */}
                                <div className="form_section">
                                    <h3 className="section_title">Registered Address of the Entity (as per GST/Udyam Certificate)</h3>
                                    <div className="form_row">
                                        <div className="form_group">
                                            <label>Building Name</label>
                                            <input
                                                type="text"
                                                name="buildingName"
                                                value={formData.buildingName}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="301"
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Flat No.</label>
                                            <input
                                                type="text"
                                                name="flatNo"
                                                value={formData.flatNo}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="2 Floor"
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Ward No.</label>
                                            <input
                                                type="text"
                                                name="wardNo"
                                                value={formData.wardNo}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="C Block"
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>State</label>
                                            <CustomSelect
                                                name="regState"
                                                value={formData.regState}
                                                onChange={handleInputChange}
                                                options={[
                                                    { value: "haryana", label: "Haryana" },
                                                    { value: "punjab", label: "Punjab" },
                                                    { value: "delhi", label: "Delhi" }
                                                ]}
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Dist</label>
                                            <CustomSelect
                                                name="regDist"
                                                value={formData.regDist}
                                                onChange={handleInputChange}
                                                options={[
                                                    { value: "gurgaon", label: "Gurgaon" },
                                                    { value: "faridabad", label: "Faridabad" }
                                                ]}
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Pincode</label>
                                            <CustomSelect
                                                name="regPincode"
                                                value={formData.regPincode}
                                                onChange={handleInputChange}
                                                options={[
                                                    { value: "122001", label: "122001" },
                                                    { value: "122002", label: "122002" }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Correspondence Address Section */}
                                <div className="form_section">
                                    <h3 className="section_title">Correspondence Address</h3>
                                    <div className="checkbox_section">
                                        <label className="checkbox_label">
                                            <input
                                                type="checkbox"
                                                name="sameAsRegistered"
                                                checked={formData.sameAsRegistered}
                                                onChange={handleSameAddressChange}
                                            />
                                            <span>Select if Correspondence Address & Reg. Address Are same</span>
                                        </label>
                                    </div>
                                    <div className="form_row">
                                        <div className="form_group">
                                            <label>Building Name</label>
                                            <input
                                                type="text"
                                                name="corrBuildingName"
                                                value={formData.corrBuildingName}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="301"
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Flat No.</label>
                                            <input
                                                type="text"
                                                name="corrFlatNo"
                                                value={formData.corrFlatNo}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="2 Floor"
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Ward No.</label>
                                            <input
                                                type="text"
                                                name="corrWardNo"
                                                value={formData.corrWardNo}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="C Block"
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>State</label>
                                            <CustomSelect
                                                name="corrState"
                                                value={formData.corrState}
                                                onChange={handleInputChange}
                                                options={[
                                                    { value: "haryana", label: "Haryana" },
                                                    { value: "punjab", label: "Punjab" },
                                                    { value: "delhi", label: "Delhi" }
                                                ]}
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Dist</label>
                                            <CustomSelect
                                                name="corrDist"
                                                value={formData.corrDist}
                                                onChange={handleInputChange}
                                                options={[
                                                    { value: "gurgaon", label: "Gurgaon" },
                                                    { value: "faridabad", label: "Faridabad" }
                                                ]}
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Pincode</label>
                                            <CustomSelect
                                                name="corrPincode"
                                                value={formData.corrPincode}
                                                onChange={handleInputChange}
                                                options={[
                                                    { value: "122001", label: "122001" },
                                                    { value: "122002", label: "122002" }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Details Section */}
                                <div className="form_section">
                                    <h3 className="section_title">Contact Details (To be Used for Future Communication)</h3>
                                    <div className="form_row">
                                        <div className="form_group">
                                            <label>Contact Person</label>
                                            <input
                                                type="text"
                                                name="contactPerson"
                                                value={formData.contactPerson}
                                                onChange={handleInputChange}
                                                className="form_input"
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Designation</label>
                                            <input
                                                type="text"
                                                name="designation"
                                                value={formData.designation}
                                                onChange={handleInputChange}
                                                className="form_input"
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Mobile Number</label>
                                            <input
                                                type="tel"
                                                name="mobileNumber"
                                                value={formData.mobileNumber}
                                                onChange={handleInputChange}
                                                className={`form_input ${errors.mobileNumber ? 'error' : ''}`}
                                                placeholder="1234567890"
                                                maxLength="10"
                                            />
                                            {errors.mobileNumber && <span className="error_message">{errors.mobileNumber}</span>}
                                        </div>
                                        <div className="form_group">
                                            <label>Email Address</label>
                                            <input
                                                type="email"
                                                name="emailAddress"
                                                value={formData.emailAddress}
                                                onChange={handleInputChange}
                                                className={`form_input ${errors.emailAddress ? 'error' : ''}`}
                                                placeholder="contact@example.com"
                                                pattern="[a-z0-9._\%+-]+@[a-z0-9.-]+\.[a-z]{2,}"
                                                title="Please enter a valid email address"
                                            />
                                            {errors.emailAddress && <span className="error_message">{errors.emailAddress}</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Tax Details Section */}
                                <div className="form_section">
                                    <h3 className="section_title">Tax Details</h3>
                                    <div className="form_row">
                                        <div className="form_group">
                                            <label>GSTIN Reg. No. (If Applicable)</label>
                                            <input
                                                type="text"
                                                name="gstinRegNo"
                                                value={formData.gstinRegNo || ''}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="GSTIN"
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>VAT/CST</label>
                                            <input
                                                type="text"
                                                name="vatCst"
                                                value={formData.vatCst || ''}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="VAT/CST"
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>TIN No.</label>
                                            <input
                                                type="text"
                                                name="tinNo"
                                                value={formData.tinNo || ''}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="TIN NUMBER"
                                            />
                                        </div>
                                    </div>
                                    <div className="form_row">
                                        <div className="form_group full_width">
                                            <label>Import Export Code (If Applicable)</label>
                                            <input
                                                type="text"
                                                name="importExportCode"
                                                value={formData.importExportCode || ''}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="IEC CODE"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Details Section */}
                                <div className="form_section">
                                    <h3 className="section_title">Bank Details</h3>
                                    <div className="form_row">
                                        <div className="form_group">
                                            <label>Account No.</label>
                                            <input
                                                type="text"
                                                name="accountNo"
                                                value={formData.accountNo || ''}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="ACCOUNT NUMBER"
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Name of Bank</label>
                                            <input
                                                type="text"
                                                name="bankName"
                                                value={formData.bankName || ''}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="BANK NAME"
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Branch</label>
                                            <input
                                                type="text"
                                                name="branch"
                                                value={formData.branch || ''}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="BRANCH"
                                            />
                                        </div>
                                    </div>
                                    <div className="form_row">
                                        <div className="form_group full_width">
                                            <label>IFSC Code</label>
                                            <input
                                                type="text"
                                                name="ifscCode"
                                                value={formData.ifscCode || ''}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="IFSC CODE"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* TGT (Terms of Trade) Section */}
                                <div className="form_section">
                                    <h3 className="section_title">TOT (Terms of Trade)</h3>
                                    <div className="form_row tgt_row">
                                        <div className="form_group">
                                            <label>Credit Period</label>
                                            <CustomSelect
                                                name="creditPeriod"
                                                value={formData.creditPeriod || ''}
                                                onChange={handleInputChange}
                                                options={[
                                                    { value: "7-days", label: "7 Days" },
                                                    { value: "15-days", label: "15 Days" },
                                                    { value: "30-days", label: "30 Days" }
                                                ]}
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Open For Electronic Credit?</label>
                                            <CustomSelect
                                                name="electronicCredit"
                                                value={formData.electronicCredit || ''}
                                                onChange={handleInputChange}
                                                options={[
                                                    { value: "yes", label: "Yes" },
                                                    { value: "no", label: "No" }
                                                ]}
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Lead Time For Delivery</label>
                                            <CustomSelect
                                                name="leadTimeDelivery"
                                                value={formData.leadTimeDelivery || ''}
                                                onChange={handleInputChange}
                                                options={[
                                                    { value: "1-3-days", label: "1-3 Days" },
                                                    { value: "3-5-days", label: "3-5 Days" },
                                                    { value: "5-7-days", label: "5-7 Days" }
                                                ]}
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Buying Module</label>
                                            <CustomSelect
                                                name="buyingModule"
                                                value={formData.buyingModule || ''}
                                                onChange={handleInputChange}
                                                options={[
                                                    { value: "margin-on-msp", label: "Margin On MSP" },
                                                    { value: "cost-on-product", label: "Cost On Product" },
                                                    { value: "markup-margin", label: "Markup Margin" },
                                                    { value: "markdown-margin", label: "Markdown Margin" }
                                                ]}
                                            />
                                        </div>
                                        <div className="form_group">
                                            <label>Margin %</label>
                                            <input
                                                type="text"
                                                name="marginPercent"
                                                value={formData.marginPercent || ''}
                                                onChange={handleInputChange}
                                                className="form_input"
                                                placeholder="3%"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* KYC Details Of The Authorized Person Section */}
                                <div className="form_section">
                                    <h3 className="section_title">KYC Details Of The Authorized Person</h3>
                                    <div className="kyc_upload_row">
                                        <div className="upload_group">
                                            <label>Aadhar Card (Front)</label>
                                            <div className="upload_box">
                                                <input
                                                    type="file"
                                                    name="aadharFront"
                                                    onChange={(e) => handleFileUpload(e, 'aadharFront')}
                                                    className="file_input"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                                <div className="upload_content">
                                                    <span className="upload_icon"><FaCloudUploadAlt /></span>
                                                    <span>Upload</span>
                                                </div>
                                            </div>
                                            {renderFileDisplay('aadharFront')}
                                        </div>
                                        <div className="upload_group">
                                            <label>Aadhar Card (Back)</label>
                                            <div className="upload_box">
                                                <input
                                                    type="file"
                                                    name="aadharBack"
                                                    onChange={(e) => handleFileUpload(e, 'aadharBack')}
                                                    className="file_input"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                                <div className="upload_content">
                                                    <span className="upload_icon"><FaCloudUploadAlt /></span>
                                                    <span>Upload</span>
                                                </div>
                                            </div>
                                            {renderFileDisplay('aadharBack')}
                                        </div>
                                        <div className="upload_group">
                                            <label>PAN Card</label>
                                            <div className="upload_box">
                                                <input
                                                    type="file"
                                                    name="panCardAuthorized"
                                                    onChange={(e) => handleFileUpload(e, 'panCardAuthorized')}
                                                    className="file_input"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                                <div className="upload_content">
                                                    <span className="upload_icon"><FaCloudUploadAlt /></span>
                                                    <span>Upload</span>
                                                </div>
                                            </div>
                                            {renderFileDisplay('panCardAuthorized')}
                                        </div>
                                        <div className="upload_group">
                                            <label>Authorized Person Photo</label>
                                            <div className="upload_box">
                                                <input
                                                    type="file"
                                                    name="personPhoto"
                                                    onChange={(e) => handleFileUpload(e, 'personPhoto')}
                                                    className="file_input"
                                                    accept=".jpg,.jpeg,.png"
                                                />
                                                <div className="upload_content">
                                                    <span className="upload_icon"><FaCloudUploadAlt /></span>
                                                    <span>Upload</span>
                                                </div>
                                            </div>
                                            {renderFileDisplay('personPhoto')}
                                        </div>
                                        <div className="upload_group">
                                            <label>Board Of Resolution</label>
                                            <div className="upload_box">
                                                <input
                                                    type="file"
                                                    name="boardResolution"
                                                    onChange={(e) => handleFileUpload(e, 'boardResolution')}
                                                    className="file_input"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                                <div className="upload_content">
                                                    <span className="upload_icon"><FaCloudUploadAlt /></span>
                                                    <span>Upload</span>
                                                </div>
                                            </div>
                                            {renderFileDisplay('boardResolution')}
                                        </div>
                                    </div>
                                </div>

                                {/* KYC & Other Details Of The Firm Section */}
                                <div className="form_section">
                                    <h3 className="section_title">KYC & Other Details Of The Firm</h3>
                                    <div className="kyc_upload_row">
                                        <div className="upload_group">
                                            <label>PAN Card</label>
                                            <div className="upload_box">
                                                <input
                                                    type="file"
                                                    name="panCardFirm"
                                                    onChange={(e) => handleFileUpload(e, 'panCardFirm')}
                                                    className="file_input"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                                <div className="upload_content">
                                                    <span className="upload_icon"><FaCloudUploadAlt /></span>
                                                    <span>Upload</span>
                                                </div>
                                            </div>
                                            {renderFileDisplay('panCardFirm')}
                                        </div>
                                        <div className="upload_group">
                                            <label>Pass Book / Cancel Cheque</label>
                                            <div className="upload_box">
                                                <input
                                                    type="file"
                                                    name="passbookCancelCheque"
                                                    onChange={(e) => handleFileUpload(e, 'passbookCancelCheque')}
                                                    className="file_input"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                                <div className="upload_content">
                                                    <span className="upload_icon"><FaCloudUploadAlt /></span>
                                                    <span>Upload</span>
                                                </div>
                                            </div>
                                            {renderFileDisplay('passbookCancelCheque')}
                                        </div>
                                        <div className="upload_group">
                                            <label>GST Certificate</label>
                                            <div className="upload_box">
                                                <input
                                                    type="file"
                                                    name="gstCertificate"
                                                    onChange={(e) => handleFileUpload(e, 'gstCertificate')}
                                                    className="file_input"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                                <div className="upload_content">
                                                    <span className="upload_icon"><FaCloudUploadAlt /></span>
                                                    <span>Upload</span>
                                                </div>
                                            </div>
                                            {renderFileDisplay('gstCertificate')}
                                        </div>
                                        <div className="upload_group">
                                            <label>FSSAI Certificate</label>
                                            <div className="upload_box">
                                                <input
                                                    type="file"
                                                    name="fssaiCertificate"
                                                    onChange={(e) => handleFileUpload(e, 'fssaiCertificate')}
                                                    className="file_input"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                                <div className="upload_content">
                                                    <span className="upload_icon"><FaCloudUploadAlt /></span>
                                                    <span>Upload</span>
                                                </div>
                                            </div>
                                            {renderFileDisplay('fssaiCertificate')}
                                        </div>
                                        <div className="upload_group">
                                            <label>APMC Certificate</label>
                                            <div className="upload_box">
                                                <input
                                                    type="file"
                                                    name="apmcCertificate"
                                                    onChange={(e) => handleFileUpload(e, 'apmcCertificate')}
                                                    className="file_input"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                                <div className="upload_content">
                                                    <span className="upload_icon"><FaCloudUploadAlt /></span>
                                                    <span>Upload</span>
                                                </div>
                                            </div>
                                            {renderFileDisplay('apmcCertificate')}
                                        </div>
                                        <div className="upload_group">
                                            <label>MOA/AOA/COI Certificate</label>
                                            <div className="upload_box">
                                                <input
                                                    type="file"
                                                    name="moaAoaCoiCertificate"
                                                    onChange={(e) => handleFileUpload(e, 'moaAoaCoiCertificate')}
                                                    className="file_input"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                                <div className="upload_content">
                                                    <span className="upload_icon"><FaCloudUploadAlt /></span>
                                                    <span>Upload</span>
                                                </div>
                                            </div>
                                            {renderFileDisplay('moaAoaCoiCertificate')}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'documents' && (
                            <>
                                {/* Product Details You Deal With Section */}
                                <div className="form_section product_details_section mt-3">
                                    <h3 className="section_title mb-3">Product Details You Deal With</h3>

                                    <div className="product_details_content">
                                        {formData.products.map((product, index) => (
                                            <div key={product.id} className="product_item">
                                                {/* First Row - Product Category, Sub Category, Micro Category */}
                                                <div className="row mb-4">
                                                    <div className="col-lg-4 col-md-4 col-sm-12 mb-3">
                                                        <div className="form_group">
                                                            <label className="form_label" style={{ color: "#6B46C1" }}>Product Category</label>
                                                            <CustomSelect
                                                                name="productCategory"
                                                                value={product.productCategory}
                                                                onChange={(e) => handleProductChange(product.id, 'productCategory', e.target.value)}
                                                                options={[
                                                                    { value: "", label: "Select Product Category" },
                                                                    { value: "FMCG Food", label: "FMCG Food" },
                                                                    { value: "Fresh Produce", label: "Fresh Produce" },
                                                                    { value: "Dairy", label: "Dairy" },
                                                                    { value: "Beverages", label: "Beverages" }
                                                                ]}
                                                                className="form_select"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-lg-4 col-md-4 col-sm-12 mb-3">
                                                        <div className="form_group">
                                                            <label className="form_label" style={{ color: "#6B46C1" }}>Sub Category</label>
                                                            <CustomSelect
                                                                name="subCategory"
                                                                value={product.subCategory}
                                                                onChange={(e) => handleProductChange(product.id, 'subCategory', e.target.value)}
                                                                options={[
                                                                    { value: "", label: "Select Sub Category" },
                                                                    { value: "Chocolate & Candies", label: "Chocolate & Candies" },
                                                                    { value: "Household Cookies", label: "Household Cookies" },
                                                                    { value: "Snacks", label: "Snacks" },
                                                                    { value: "Biscuits", label: "Biscuits" }
                                                                ]}
                                                                className="form_select"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-lg-4 col-md-4 col-sm-12 mb-3">
                                                        <div className="form_group">
                                                            <label className="form_label" style={{ color: "#6B46C1" }}>Micro Category</label>
                                                            <CustomSelect
                                                                name="microCategory"
                                                                value={product.microCategory}
                                                                onChange={(e) => handleProductChange(product.id, 'microCategory', e.target.value)}
                                                                options={[
                                                                    { value: "", label: "Select Micro Category" },
                                                                    { value: "Chocolate", label: "Chocolate" },
                                                                    { value: "Vanilla", label: "Vanilla" },
                                                                    { value: "Strawberry", label: "Strawberry" }
                                                                ]}
                                                                className="form_select"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Second Row - Brand, Product Name, Action Buttons */}
                                                <div className="row mb-4">
                                                    <div className="col-lg-4 col-md-4 col-sm-12 mb-3">
                                                        <div className="form_group">
                                                            <label className="form_label" style={{ color: "#6B46C1" }}>Brand</label>
                                                            <CustomSelect
                                                                name="brand"
                                                                value={product.brand}
                                                                onChange={(e) => handleProductChange(product.id, 'brand', e.target.value)}
                                                                options={[
                                                                    { value: "", label: "Select Brand" },
                                                                    { value: "Cadbury", label: "Cadbury" },
                                                                    { value: "Nestle", label: "Nestle" },
                                                                    { value: "Britannia", label: "Britannia" },
                                                                    { value: "Parle", label: "Parle" }
                                                                ]}
                                                                className="form_select"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-lg-4 col-md-4 col-sm-12 mb-3">
                                                        <div className="form_group">
                                                            <label className="form_label" style={{ color: "#6B46C1" }}>Product Name</label>
                                                            <CustomSelect
                                                                name="productName"
                                                                value={product.productName}
                                                                onChange={(e) => handleProductChange(product.id, 'productName', e.target.value)}
                                                                options={[
                                                                    { value: "", label: "Select Product Name" },
                                                                    { value: "Cadbury Chocolate 50g", label: "Cadbury Chocolate 50g" },
                                                                    { value: "Nestle KitKat", label: "Nestle KitKat" },
                                                                    { value: "Dairy Milk", label: "Dairy Milk" }
                                                                ]}
                                                                className="form_select"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-lg-4 col-md-4 col-sm-12 mb-3">
                                                        <div className="form_group_action">
                                                            <div className="product_action_buttons">
                                                                <button
                                                                    type="button"
                                                                    className="action_btn remove_btn"
                                                                    onClick={() => removeProductHandler(product.id)}
                                                                    disabled={formData.products.length === 1}
                                                                >
                                                                    <i className="fas fa-trash-alt"></i>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="action_btn add_btn"
                                                                    onClick={addNewProduct}
                                                                >
                                                                    <i className="fas fa-plus"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Buttons Section */}
                                <div className="form_section action_buttons_section">
                                    <div className="action_buttons_container">
                                        <div className="left_buttons">
                                            <button
                                                type="button"
                                                className="action_btn sample_download_btn"
                                                onClick={() => {
                                                    // Create a sample CSV/Excel file for download
                                                    const sampleData = "Product Category,Sub Category,Micro Category,Brand,Product Name,Quantity\nFMCG Food,Chocolate & Candies,Chocolate,Cadbury,Dairy Milk,100\nFresh Produce,Fruits,Citrus,Local,Orange,50";
                                                    const blob = new Blob([sampleData], { type: 'text/csv' });
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = 'product_sample.csv';
                                                    a.click();
                                                    window.URL.revokeObjectURL(url);
                                                    toast.success('Sample file downloaded');
                                                }}
                                            >
                                                <FaDownload className="btn_icon" />
                                                Sample Download
                                            </button>

                                            <div className="upload_btn_wrapper">
                                                <input
                                                    type="file"
                                                    id="productFileUpload"
                                                    onChange={(e) => handleFileUpload(e, 'productList')}
                                                    className="file_input_hidden"
                                                    accept=".csv,.xlsx,.xls"
                                                    style={{ display: 'none' }}
                                                />
                                                <button
                                                    type="button"
                                                    className="action_btn upload_btn"
                                                    onClick={() => document.getElementById('productFileUpload').click()}
                                                >
                                                    <FaUpload className="btn_icon" />
                                                    Upload
                                                </button>
                                            </div>

                                            <div className="file_status">
                                                {formData.uploadedFiles?.productList ? (
                                                    <>
                                                        <i className="fas fa-check-circle" style={{ color: '#28a745' }}></i>
                                                        <span style={{ color: '#28a745' }}>
                                                            {formData.uploadedFiles.productList.name}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="file_action_btn view_btn"
                                                            onClick={() => handleFileView(formData.uploadedFiles.productList)}
                                                            title="View file"
                                                            style={{ marginLeft: '8px' }}
                                                        >
                                                            <FaEye />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-cloud" style={{ color: "#fff" }}></i>
                                                        <span className='text-light'>No File selected</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Declaration Section */}
                                <div className="form_section declaration_section">
                                    <div className="declaration_content">
                                        <h3 className="" style={{ color: "#6B46C1", fontSize: "20px", marginBottom: "10px", letterSpacing: "1.4px" }}>Declaration</h3>
                                        <p className="declaration_text">
                                            I hereby declare that all the information submitted by me in the vendor onboarding form is true, correct, and complete to the best of my knowledge and belief. No information has been concealed or misrepresented. I understand that if any information is found to be false, misleading, or fraudulent, I shall be held legally responsible and liable for all consequences arising therefrom.
                                        </p>
                                        <div className="declaration_buttons">
                                            <button
                                                type="button"
                                                className="declaration_btn save_btn"
                                                onClick={handleSave}
                                                disabled={vendorLoading}
                                            >
                                                {vendorLoading ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                type="button"
                                                className="declaration_btn submit_btn"
                                                onClick={handleSubmit}
                                                disabled={vendorLoading}
                                            >
                                                {vendorLoading ? 'Submitting...' : 'Submit For Approval'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Action Buttons for Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="form_section profile_action_buttons_section">
                                <div className="profile_action_buttons">
                                    <button
                                        type="button"
                                        className="profile_btn save_btn"
                                        onClick={handleSave}
                                        disabled={vendorLoading}
                                    >
                                        {vendorLoading ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        type="button"
                                        className="profile_btn save_next_btn"
                                        onClick={handleSaveAndNext}
                                        disabled={vendorLoading}
                                    >
                                        {vendorLoading ? 'Processing...' : 'Save And Next'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* OTP Modal */}
                <OtpModal
                    isOpen={modals.otp.isOpen}
                    onClose={handleOtpModalClose}
                    onSubmit={handleOtpModalSubmit}
                    contactNumber={modals.otp.contactNumber}
                    title={modals.otp.title}
                />

                {/* Success Modal */}
                <SuccessModal
                    isOpen={showSuccessModal}
                    onClose={closeSuccessModal}
                    title="Thank you!"
                    message="Your submission has been sent."
                    autoClose={true}
                    autoCloseDelay={3000}
                />
            </div>
        </>
    );
};

export default VendorOnboardingForm;