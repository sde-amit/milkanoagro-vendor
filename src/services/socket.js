import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.listeners = new Map();
    }

    connect(token) {
        if (this.socket?.connected) {
            return this.socket;
        }

        const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://api.brightlayer.in';

        this.socket = io(SOCKET_URL, {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling'],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        this.setupEventListeners();
        return this.socket;
    }

    setupEventListeners() {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            // Removed toast message for connection
        });

        this.socket.on('connected', (data) => {
            this.emit('server_connected', data);
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;

            if (reason === 'io server disconnect') {
                // Server disconnected, try to reconnect
                this.socket.connect();
            }

            // Removed toast message for disconnection
            this.emit('server_disconnected', { reason });
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error.message);
            this.reconnectAttempts++;

            // Removed toast message for connection errors
            this.emit('connection_error', error);
        });

        // Vendor status updates
        this.socket.on('vendor_status_changed', (data) => {
            const statusMessages = {
                approved: 'Your vendor application has been approved! 🎉',
                rejected: 'Your vendor application was rejected. Please contact support.',
                pending: 'Your vendor application is under review.',
                suspended: 'Your vendor account has been suspended.'
            };

            const message = statusMessages[data.status] || 'Your vendor status has been updated.';

            if (data.status === 'approved') {
                toast.success(message);
            } else if (data.status === 'rejected') {
                toast.error(message);
            } else {
                toast(message);
            }

            this.emit('vendor_status_changed', data);
        });

        // OTP events
        this.socket.on('otp_sent', (data) => {
            toast.success(`OTP sent to ${data.phone}`);
            this.emit('otp_sent', data);
        });

        // File upload events
        this.socket.on('upload_progress_update', (data) => {
            this.emit('upload_progress', data);
        });

        this.socket.on('files_uploaded', (data) => {
            toast.success(`${data.filesCount} files uploaded successfully`);
            this.emit('files_uploaded', data);
        });

        // Admin messages
        this.socket.on('admin_message', (data) => {
            toast.info(`Admin: ${data.message}`);
            this.emit('admin_message', data);
        });

        // Support messages
        this.socket.on('message_sent', (data) => {
            toast.success('Message sent to support');
            this.emit('message_sent', data);
        });

        // Error handling
        this.socket.on('error', (error) => {
            console.error('❌ Socket error:', error);
            toast.error(error.message || 'Socket error occurred');
            this.emit('socket_error', error);
        });

        // Form progress tracking
        this.socket.on('form_progress_saved', (data) => {
            this.emit('form_progress_saved', data);
        });
    }

    // Event emitter functionality
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in socket event listener for ${event}:`, error);
                }
            });
        }
    }

    // Socket.IO methods
    sendOTPVerificationAttempt(phone, success, attempts) {
        if (this.socket?.connected) {
            this.socket.emit('otp_verification_attempt', {
                phone,
                success,
                attempts
            });
        }
    }

    sendFormProgress(step, progress, formData) {
        if (this.socket?.connected) {
            this.socket.emit('form_progress', {
                step,
                progress,
                formData: formData ? { ...formData, sensitiveData: undefined } : undefined // Remove sensitive data
            });
        }
    }

    sendFileUploadProgress(fileName, progress, status) {
        if (this.socket?.connected) {
            this.socket.emit('file_upload_progress', {
                fileName,
                progress,
                status
            });
        }
    }

    sendSupportMessage(message, type = 'text') {
        if (this.socket?.connected) {
            this.socket.emit('support_message', {
                message,
                type
            });
        } else {
            toast.error('Not connected to server. Please try again.');
        }
    }

    startTyping() {
        if (this.socket?.connected) {
            this.socket.emit('typing_start');
        }
    }

    stopTyping() {
        if (this.socket?.connected) {
            this.socket.emit('typing_stop');
        }
    }

    // Admin methods (if user is admin)
    updateVendorStatus(vendorId, status, reason) {
        if (this.socket?.connected) {
            this.socket.emit('vendor_status_update', {
                vendorId,
                status,
                reason
            });
        }
    }

    sendAdminResponse(userId, message, type = 'text') {
        if (this.socket?.connected) {
            this.socket.emit('admin_response', {
                userId,
                message,
                type
            });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.listeners.clear();
        }
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            socketId: this.socket?.id,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;