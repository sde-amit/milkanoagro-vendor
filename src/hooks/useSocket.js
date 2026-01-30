import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores';
import socketService from '../services/socket';

export const useSocket = () => {
    const { isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated && user) {
            const token = localStorage.getItem('accessToken');
            if (token) {
                socketService.connect(token);
            }
        } else {
            socketService.disconnect();
        }

        return () => {
            // Don't disconnect on unmount, keep connection alive
            // socketService.disconnect();
        };
    }, [isAuthenticated, user]);

    const sendOTPAttempt = useCallback((phone, success, attempts) => {
        socketService.sendOTPVerificationAttempt(phone, success, attempts);
    }, []);

    const sendFormProgress = useCallback((step, progress, formData) => {
        socketService.sendFormProgress(step, progress, formData);
    }, []);

    const sendFileProgress = useCallback((fileName, progress, status) => {
        socketService.sendFileUploadProgress(fileName, progress, status);
    }, []);

    const sendSupportMessage = useCallback((message, type) => {
        socketService.sendSupportMessage(message, type);
    }, []);

    const markNotificationRead = useCallback((notificationId) => {
        socketService.markNotificationAsRead(notificationId);
    }, []);

    const startTyping = useCallback(() => {
        socketService.startTyping();
    }, []);

    const stopTyping = useCallback(() => {
        socketService.stopTyping();
    }, []);

    // Admin functions
    const updateVendorStatus = useCallback((vendorId, status, reason) => {
        socketService.updateVendorStatus(vendorId, status, reason);
    }, []);

    const sendAdminResponse = useCallback((userId, message, type) => {
        socketService.sendAdminResponse(userId, message, type);
    }, []);

    // Event listeners
    const onVendorStatusChanged = useCallback((callback) => {
        socketService.on('vendor_status_changed', callback);
        return () => socketService.off('vendor_status_changed', callback);
    }, []);

    const onOTPSent = useCallback((callback) => {
        socketService.on('otp_sent', callback);
        return () => socketService.off('otp_sent', callback);
    }, []);

    const onUploadProgress = useCallback((callback) => {
        socketService.on('upload_progress', callback);
        return () => socketService.off('upload_progress', callback);
    }, []);

    const onFilesUploaded = useCallback((callback) => {
        socketService.on('files_uploaded', callback);
        return () => socketService.off('files_uploaded', callback);
    }, []);

    const onAdminMessage = useCallback((callback) => {
        socketService.on('admin_message', callback);
        return () => socketService.off('admin_message', callback);
    }, []);

    const onMessageSent = useCallback((callback) => {
        socketService.on('message_sent', callback);
        return () => socketService.off('message_sent', callback);
    }, []);

    const onServerConnected = useCallback((callback) => {
        socketService.on('server_connected', callback);
        return () => socketService.off('server_connected', callback);
    }, []);

    const onServerDisconnected = useCallback((callback) => {
        socketService.on('server_disconnected', callback);
        return () => socketService.off('server_disconnected', callback);
    }, []);

    const onConnectionError = useCallback((callback) => {
        socketService.on('connection_error', callback);
        return () => socketService.off('connection_error', callback);
    }, []);

    const onSocketError = useCallback((callback) => {
        socketService.on('socket_error', callback);
        return () => socketService.off('socket_error', callback);
    }, []);

    return {
        // Connection status
        isConnected: socketService.isConnected,
        connectionStatus: socketService.getConnectionStatus(),

        // Actions
        sendOTPAttempt,
        sendFormProgress,
        sendFileProgress,
        sendSupportMessage,
        markNotificationRead,
        startTyping,
        stopTyping,

        // Admin actions
        updateVendorStatus,
        sendAdminResponse,

        // Event listeners
        onVendorStatusChanged,
        onOTPSent,
        onUploadProgress,
        onFilesUploaded,
        onAdminMessage,
        onMessageSent,
        onServerConnected,
        onServerDisconnected,
        onConnectionError,
        onSocketError,

        // Direct access to socket service
        socketService
    };
};

export default useSocket;