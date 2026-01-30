import { create } from 'zustand';
import { vendorAPI } from '../services/api';
import socketService from '../services/socket';

const useVendorStore = create((set, get) => ({
    // State
    profile: null,
    onboardingData: null,
    onboardingStatus: null,
    isLoading: false,
    error: null,

    // Form state
    currentStep: 'profile',
    formData: {
        // Profile Tab
        companyType: 'Private Limited Company',
        supplyTo: 'direct-store-delivery',
        state: 'haryana',
        city: 'gurgaon',
        multipleStore: 'store-1',

        // Entity Details
        nameOfAuthorizedPerson: '',
        nameOfEntity: '',
        nameOfEstablishment: '',
        typeOfSupplier: '',
        gstinNumber: '',
        mobileNo: '',
        emailId: '',

        // Registered Address
        buildingName: '',
        flatNo: '',
        wardNo: '',
        regState: '',
        regDist: '',
        regPincode: '',

        // Correspondence Address
        sameAsRegistered: false,
        corrBuildingName: '',
        corrFlatNo: '',
        corrWardNo: '',
        corrState: '',
        corrDist: '',
        corrPincode: '',

        // Contact Details
        contactPerson: '',
        designation: '',
        mobileNumber: '',
        emailAddress: '',

        // Tax Details
        gstinRegNo: '',
        vatCst: '',
        tinNo: '',
        importExportCode: '',

        // Bank Details
        accountNo: '',
        bankName: '',
        branch: '',
        ifscCode: '',

        // TGT Terms
        creditPeriod: '7-days',
        electronicCredit: 'yes',
        leadTimeDelivery: '1-3-days',
        buyingModule: '',
        marginPercent: '3%',

        // Product Details
        products: [
            {
                id: 1,
                productCategory: '',
                subCategory: '',
                microCategory: '',
                brand: '',
                productName: '',
                quantity: 1
            }
        ],

        // File uploads
        uploadedFiles: {}
    },

    // Actions
    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),

    clearError: () => set({ error: null }),

    setCurrentStep: (step) => set({ currentStep: step }),

    updateFormData: (data) => set((state) => {
        const newFormData = { ...state.formData, ...data };

        // Calculate completion percentage
        const totalFields = Object.keys(newFormData).length;
        const filledFields = Object.values(newFormData).filter(value =>
            value !== '' && value !== null && value !== undefined &&
            (Array.isArray(value) ? value.length > 0 : true)
        ).length;
        const completionPercentage = Math.round((filledFields / totalFields) * 100);

        // Send form progress via Socket.IO
        socketService.sendFormProgress(state.currentStep, completionPercentage, newFormData);

        return {
            formData: newFormData
        };
    }),

    resetFormData: () => set((state) => ({
        formData: {
            ...state.formData,
            // Reset to initial values
            nameOfAuthorizedPerson: '',
            nameOfEntity: '',
            nameOfEstablishment: '',
            // ... add other fields to reset
        }
    })),

    // Product management
    addProduct: () => set((state) => ({
        formData: {
            ...state.formData,
            products: [
                ...state.formData.products,
                {
                    id: Date.now(),
                    productCategory: '',
                    subCategory: '',
                    microCategory: '',
                    brand: '',
                    productName: '',
                    quantity: 0
                }
            ]
        }
    })),

    removeProduct: (productId) => set((state) => ({
        formData: {
            ...state.formData,
            products: state.formData.products.filter(p => p.id !== productId)
        }
    })),

    updateProduct: (productId, updates) => set((state) => ({
        formData: {
            ...state.formData,
            products: state.formData.products.map(p =>
                p.id === productId ? { ...p, ...updates } : p
            )
        }
    })),

    // API Actions
    registerVendor: async (vendorData) => {
        try {
            set({ isLoading: true, error: null });
            const response = await vendorAPI.register(vendorData);
            set({ isLoading: false });
            return response.data;
        } catch (error) {
            set({
                isLoading: false,
                error: error.response?.data?.message || 'Registration failed'
            });
            throw error;
        }
    },

    submitOnboarding: async (isDraft = false) => {
        try {
            const { formData } = get();
            set({ isLoading: true, error: null });

            // Ensure products is always an array
            const dataToSubmit = {
                ...formData,
                products: Array.isArray(formData.products) ? formData.products : [],
                // Ensure sameAsRegistered is a boolean
                sameAsRegistered: Boolean(formData.sameAsRegistered),
                // Add isDraft flag
                isDraft: isDraft
            };

            // Debug logging
            console.log('🔍 Frontend submitting:', {
                isDraft,
                productsCount: dataToSubmit.products.length,
                products: dataToSubmit.products,
                hasEmptyProducts: dataToSubmit.products.some(p =>
                    !p.productCategory || !p.subCategory || !p.brand || !p.productName
                )
            });

            // If it's a draft save and we have empty products, filter them out or mark them as optional
            if (isDraft) {
                // For draft saves, we can either filter out empty products or keep them as-is
                // Let's keep them as-is since the backend should handle this
                console.log('🔍 Draft save - keeping products as-is for backend to handle');
            }

            const response = await vendorAPI.submitOnboarding(dataToSubmit);

            // Store the onboarding data including the ID for future file uploads
            const onboardingData = response.data.data;

            set({
                isLoading: false,
                onboardingData: onboardingData
            });

            return response.data;
        } catch (error) {
            set({
                isLoading: false,
                error: error.response?.data?.message || 'Submission failed'
            });
            throw error;
        }
    },

    fetchProfile: async () => {
        try {
            set({ isLoading: true, error: null });
            const response = await vendorAPI.getProfile();
            const data = response.data.data;

            // Extract profile, onboarding, and products data
            const { profile, onboarding, products, uploadedFiles } = data;

            // Auto-fill form data with comprehensive profile information
            if (profile || onboarding) {
                const { formData } = get();
                const updatedFormData = {
                    ...formData,

                    // Basic user information from profile
                    mobileNo: profile?.contact_number || profile?.phone || formData.mobileNo,
                    emailId: profile?.email || profile?.user_email || formData.emailId,
                    mobileNumber: profile?.contact_number || profile?.phone || formData.mobileNumber,
                    emailAddress: profile?.email || profile?.user_email || formData.emailAddress,

                    // Entity details from profile
                    nameOfAuthorizedPerson: profile?.authorized_person_name || formData.nameOfAuthorizedPerson,
                    nameOfEntity: profile?.entity_name || formData.nameOfEntity,
                    typeOfSupplier: profile?.supplier_type || formData.typeOfSupplier,

                    // Address information from profile
                    state: profile?.state || formData.state,
                    city: profile?.city || formData.city,
                    regPincode: profile?.pincode || formData.regPincode,

                    // Onboarding specific data (if exists)
                    ...(onboarding && {
                        companyType: onboarding.company_type || formData.companyType,
                        supplyTo: onboarding.supply_to || formData.supplyTo,
                        multipleStore: onboarding.multiple_store || formData.multipleStore,

                        // Entity details from onboarding
                        nameOfEstablishment: onboarding.name_of_establishment || formData.nameOfEstablishment,
                        gstinNumber: onboarding.gstin_number || formData.gstinNumber,

                        // Registered address from onboarding
                        buildingName: onboarding.building_name || formData.buildingName,
                        flatNo: onboarding.flat_no || formData.flatNo,
                        wardNo: onboarding.ward_no || formData.wardNo,
                        regState: onboarding.reg_state || formData.regState,
                        regDist: onboarding.reg_dist || formData.regDist,

                        // Correspondence address
                        sameAsRegistered: onboarding.same_as_registered || formData.sameAsRegistered,
                        corrBuildingName: onboarding.corr_building_name || formData.corrBuildingName,
                        corrFlatNo: onboarding.corr_flat_no || formData.corrFlatNo,
                        corrWardNo: onboarding.corr_ward_no || formData.corrWardNo,
                        corrState: onboarding.corr_state || formData.corrState,
                        corrDist: onboarding.corr_dist || formData.corrDist,
                        corrPincode: onboarding.corr_pincode || formData.corrPincode,

                        // Contact details
                        contactPerson: onboarding.contact_person || formData.contactPerson,
                        designation: onboarding.designation || formData.designation,

                        // Tax details
                        gstinRegNo: onboarding.gstin_reg_no || formData.gstinRegNo,
                        vatCst: onboarding.vat_cst || formData.vatCst,
                        tinNo: onboarding.tin_no || formData.tinNo,
                        importExportCode: onboarding.import_export_code || formData.importExportCode,

                        // Bank details
                        accountNo: onboarding.account_no || formData.accountNo,
                        bankName: onboarding.bank_name || formData.bankName,
                        branch: onboarding.branch || formData.branch,
                        ifscCode: onboarding.ifsc_code || formData.ifscCode,

                        // TGT terms
                        creditPeriod: onboarding.credit_period || formData.creditPeriod,
                        electronicCredit: onboarding.electronic_credit || formData.electronicCredit,
                        leadTimeDelivery: onboarding.lead_time_delivery || formData.leadTimeDelivery,
                        buyingModule: onboarding.buying_module || formData.buyingModule,
                        marginPercent: onboarding.margin_percent || formData.marginPercent,
                    }),

                    // Products data (if exists)
                    ...(products && products.length > 0 && {
                        products: products.map(product => ({
                            id: product.id,
                            productCategory: product.product_category || '',
                            subCategory: product.sub_category || '',
                            microCategory: product.micro_category || '',
                            brand: product.brand || '',
                            productName: product.product_name || '',
                            quantity: product.quantity || 0
                        }))
                    }),

                    // Uploaded files data (if exists) - transform from backend format to frontend format
                    ...(uploadedFiles && Object.keys(uploadedFiles).length > 0 && {
                        uploadedFiles: Object.keys(uploadedFiles).reduce((acc, category) => {
                            const filesInCategory = uploadedFiles[category];
                            if (filesInCategory && filesInCategory.length > 0) {
                                // Take the first (most recent) file for each category
                                const file = filesInCategory[0];
                                acc[category] = {
                                    id: file.id,
                                    name: file.name,
                                    size: file.size,
                                    type: file.type,
                                    url: file.url, // This should be the signed URL from backend
                                    serverPath: file.serverPath,
                                    category: category
                                };
                            }
                            return acc;
                        }, {})
                    })
                };

                set({
                    isLoading: false,
                    profile: profile,
                    onboardingData: onboarding,
                    formData: updatedFormData
                });
            } else {
                set({
                    isLoading: false,
                    profile: profile,
                    onboardingData: onboarding
                });
            }

            return response.data;
        } catch (error) {
            set({
                isLoading: false,
                error: error.response?.data?.message || 'Failed to fetch profile'
            });
            throw error;
        }
    },

    updateProfile: async (profileData) => {
        try {
            set({ isLoading: true, error: null });
            const response = await vendorAPI.updateProfile(profileData);
            set({
                isLoading: false,
                profile: response.data.data
            });
            return response.data;
        } catch (error) {
            set({
                isLoading: false,
                error: error.response?.data?.message || 'Update failed'
            });
            throw error;
        }
    },

    fetchOnboardingStatus: async () => {
        try {
            set({ isLoading: true, error: null });
            const response = await vendorAPI.getOnboardingStatus();
            set({
                isLoading: false,
                onboardingStatus: response.data.data
            });
            return response.data;
        } catch (error) {
            set({
                isLoading: false,
                error: error.response?.data?.message || 'Failed to fetch status'
            });
            throw error;
        }
    },

    // Get current vendor onboarding ID
    getVendorOnboardingId: () => {
        const { onboardingData } = get();
        return onboardingData?.id || null;
    },
}));

export default useVendorStore;