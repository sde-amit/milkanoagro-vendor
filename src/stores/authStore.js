import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';
import socketService from '../services/socket';

const useAuthStore = create(
    persist(
        (set, get) => ({
            // State
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            // Actions
            setLoading: (loading) => set({ isLoading: loading }),

            setError: (error) => set({ error }),

            clearError: () => set({ error: null }),

            setUser: (user) => set({
                user,
                isAuthenticated: !!user,
                error: null
            }),

            // Async Actions
            sendOTP: async (phone, purpose = 'registration') => {
                try {
                    set({ isLoading: true, error: null });
                    const response = await authAPI.sendOTP(phone, purpose);
                    set({ isLoading: false });
                    return response.data;
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error.response?.data?.message || 'Failed to send OTP'
                    });
                    throw error;
                }
            },

            verifyOTP: async (phone, otp, purpose = 'registration') => {
                try {
                    set({ isLoading: true, error: null });
                    const response = await authAPI.verifyOTP(phone, otp, purpose);

                    const { user, accessToken, refreshToken } = response.data.data;

                    // Store tokens
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);

                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null
                    });

                    // Connect to Socket.IO after successful authentication
                    socketService.connect(accessToken);

                    // Send OTP verification success event
                    socketService.sendOTPVerificationAttempt(phone, true, 1);

                    return response.data;
                } catch (error) {
                    // Send OTP verification failure event
                    socketService.sendOTPVerificationAttempt(phone, false, 1);

                    set({
                        isLoading: false,
                        error: error.response?.data?.message || 'Invalid OTP'
                    });
                    throw error;
                }
            },

            login: async (phone, otp) => {
                try {
                    set({ isLoading: true, error: null });
                    const response = await authAPI.login(phone, otp);

                    const { user, accessToken, refreshToken } = response.data.data;

                    // Store tokens
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);

                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null
                    });

                    // Connect to Socket.IO after successful login
                    socketService.connect(accessToken);

                    // Send OTP verification success event
                    socketService.sendOTPVerificationAttempt(phone, true, 1);

                    return response.data;
                } catch (error) {
                    // Send OTP verification failure event
                    socketService.sendOTPVerificationAttempt(phone, false, 1);

                    set({
                        isLoading: false,
                        error: error.response?.data?.message || 'Login failed'
                    });
                    throw error;
                }
            },

            logout: async () => {
                try {
                    await authAPI.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    // Disconnect from Socket.IO
                    socketService.disconnect();

                    // Clear tokens
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');

                    set({
                        user: null,
                        isAuthenticated: false,
                        error: null
                    });
                }
            },

            // Initialize auth state from localStorage
            initializeAuth: () => {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    // You might want to validate the token here
                    // For now, we'll assume it's valid if it exists
                    const userData = localStorage.getItem('userData');
                    if (userData) {
                        try {
                            const user = JSON.parse(userData);
                            set({ user, isAuthenticated: true });
                        } catch (error) {
                            console.error('Failed to parse user data:', error);
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('refreshToken');
                            localStorage.removeItem('userData');
                        }
                    }
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);

export default useAuthStore;