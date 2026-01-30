import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.brightlayer.in/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await api.post('/auth/refresh', { refreshToken });
                    const { accessToken } = response.data.data;
                    localStorage.setItem('accessToken', accessToken);
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/vendor-onboarding';
            }
        }

        return Promise.reject(error);
    }
);

// Auth API calls
export const authAPI = {
    sendOTP: (phone, purpose = 'registration') =>
        api.post('/auth/send-otp', { phone, purpose }),

    verifyOTP: (phone, otp, purpose = 'registration') =>
        api.post('/auth/verify-otp', { phone, otp, purpose }),

    login: (phone, otp) =>
        api.post('/auth/login', { phone, otp }),

    logout: () =>
        api.post('/auth/logout'),

    refreshToken: (refreshToken) =>
        api.post('/auth/refresh', { refreshToken }),
};

// Vendor API calls
export const vendorAPI = {
    register: (vendorData) =>
        api.post('/vendor/register', vendorData),

    submitOnboarding: (formData) =>
        api.post('/vendor/onboarding', formData),

    getProfile: () =>
        api.get('/vendor/profile'),

    updateProfile: (profileData) =>
        api.put('/vendor/profile', profileData),

    getOnboardingStatus: () =>
        api.get('/vendor/onboarding-status'),
};

// Upload API calls
export const uploadAPI = {
    uploadFiles: (files, category, vendorOnboardingId) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        if (category) formData.append('category', category);
        if (vendorOnboardingId) formData.append('vendorOnboardingId', vendorOnboardingId);

        return api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    getUserFiles: (params) =>
        api.get('/upload/files', { params }),

    deleteFile: (fileId) =>
        api.delete(`/upload/${fileId}`),

    getDownloadUrl: (fileId, expires = 3600) =>
        api.get(`/upload/download/${fileId}?expires=${expires}`),
};

export default api;