import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import toast from 'react-hot-toast';

const ProtectedRoute = ({ children, redirectTo = '/vendor-onboarding' }) => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            toast.error('Please login to access this page');
            navigate(redirectTo);
        }
    }, [isAuthenticated, isLoading, navigate, redirectTo]);

    // Show loading while checking authentication
    if (isLoading) {
        return (
            <div className="loading-container" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '50vh'
            }}>
                <div>Loading...</div>
            </div>
        );
    }

    // Don't render children if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    return children;
};

export default ProtectedRoute;