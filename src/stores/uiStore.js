import { create } from 'zustand';

const useUIStore = create((set) => ({
    // Modal states
    modals: {
        otp: {
            isOpen: false,
            contactNumber: '',
            title: 'SUBMIT OTP',
            purpose: 'registration'
        },
        success: {
            isOpen: false,
            title: 'Thank you!',
            message: 'Your submission has been sent',
            autoClose: true,
            autoCloseDelay: 3000
        }
    },

    // Loading states
    loading: {
        global: false,
        otp: false,
        form: false,
        upload: false
    },

    // Actions
    openModal: (modalType, config = {}) => set((state) => ({
        modals: {
            ...state.modals,
            [modalType]: {
                ...state.modals[modalType],
                isOpen: true,
                ...config
            }
        }
    })),

    closeModal: (modalType) => set((state) => ({
        modals: {
            ...state.modals,
            [modalType]: {
                ...state.modals[modalType],
                isOpen: false
            }
        }
    })),

    setLoading: (loadingType, isLoading) => set((state) => ({
        loading: {
            ...state.loading,
            [loadingType]: isLoading
        }
    })),

}));

export default useUIStore;