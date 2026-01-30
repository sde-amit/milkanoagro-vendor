import { create } from 'zustand';
import { uploadAPI } from '../services/api';
import socketService from '../services/socket';

const useUploadStore = create((set, get) => ({
    // State
    files: [],
    uploadProgress: {},
    isUploading: false,
    error: null,

    // Actions
    setError: (error) => set({ error }),

    clearError: () => set({ error: null }),

    setUploadProgress: (fileId, progress) => set((state) => ({
        uploadProgress: {
            ...state.uploadProgress,
            [fileId]: progress
        }
    })),

    clearUploadProgress: (fileId) => set((state) => {
        const newProgress = { ...state.uploadProgress };
        delete newProgress[fileId];
        return { uploadProgress: newProgress };
    }),

    // File management
    addFiles: (newFiles) => set((state) => ({
        files: [...state.files, ...newFiles]
    })),

    removeFile: (fileId) => set((state) => ({
        files: state.files.filter(f => f.id !== fileId)
    })),

    clearFiles: () => set({ files: [], uploadProgress: {} }),

    // API Actions
    uploadFiles: async (files, category, vendorOnboardingId) => {
        try {
            set({ isUploading: true, error: null });

            // Create file objects with progress tracking
            const fileObjects = files.map(file => ({
                id: Date.now() + Math.random(),
                file,
                name: file.name,
                size: file.size,
                type: file.type,
                status: 'uploading'
            }));

            // Add files to state
            get().addFiles(fileObjects);

            // Send initial upload progress via Socket.IO
            fileObjects.forEach(fileObj => {
                socketService.sendFileUploadProgress(fileObj.name, 0, 'starting');
            });

            const response = await uploadAPI.uploadFiles(files, category, vendorOnboardingId);

            // Send completion progress via Socket.IO
            fileObjects.forEach(fileObj => {
                socketService.sendFileUploadProgress(fileObj.name, 100, 'completed');
            });

            // Update file status to completed
            set((state) => ({
                files: state.files.map(f =>
                    fileObjects.some(fo => fo.id === f.id)
                        ? { ...f, status: 'completed' }
                        : f
                ),
                isUploading: false
            }));

            return response.data;
        } catch (error) {
            // Send failure progress via Socket.IO
            const fileObjects = get().files.filter(f => f.status === 'uploading');
            fileObjects.forEach(fileObj => {
                socketService.sendFileUploadProgress(fileObj.name, 0, 'failed');
            });

            // Update file status to failed
            set((state) => ({
                files: state.files.map(f =>
                    f.status === 'uploading'
                        ? { ...f, status: 'failed' }
                        : f
                ),
                isUploading: false,
                error: error.response?.data?.message || 'Upload failed'
            }));
            throw error;
        }
    },

    fetchUserFiles: async (params = {}) => {
        try {
            set({ error: null });
            const response = await uploadAPI.getUserFiles(params);
            set({ files: response.data.data.files });
            return response.data;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to fetch files' });
            throw error;
        }
    },

    deleteFile: async (fileId) => {
        try {
            set({ error: null });
            await uploadAPI.deleteFile(fileId);

            // Remove file from state
            get().removeFile(fileId);

            return true;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to delete file' });
            throw error;
        }
    },

    getDownloadUrl: async (fileId, expires = 3600) => {
        try {
            set({ error: null });
            const response = await uploadAPI.getDownloadUrl(fileId, expires);
            return response.data.data.downloadUrl;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to get download URL' });
            throw error;
        }
    },
}));

export default useUploadStore;