
import { Toaster } from 'react-hot-toast'
import './App.scss'
import './styles/z-index.css' // Import z-index management
import { Route, Routes } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import Layout from './components/layout/Layout'
import { LoadingSpinner } from './components/common'
import { useAuthStore } from './stores'

const Home = lazy(() => import('./pages/home/Home'))
const VendorOnboardingPage = lazy(() => import('./pages/vendorOnboarding/VendorOnboardingPage'))
const VendorOnboardingFormPage = lazy(() => import('./pages/vendorOnboardingForm/VendorOnboardingFormPage'))
const NotFound = lazy(() => import('./pages/notFound/NotFound'))

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <Toaster
        position="top-right"
        containerStyle={{
          zIndex: 99999, // Very high z-index to appear above modals
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            zIndex: 99999, // Ensure individual toasts also have high z-index
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
              zIndex: 99999,
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
              color: '#fff',
              zIndex: 99999,
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
          loading: {
            style: {
              background: '#3b82f6',
              color: '#fff',
              zIndex: 99999,
            },
          },
        }}
      />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path='/' element={<Layout />}>
            <Route path='/' element={<Home />} />
            <Route path='/vendor-onboarding' element={<VendorOnboardingPage />} />
            <Route path='/vendor-onboarding-form' element={<VendorOnboardingFormPage />} />
          </Route>
          <Route path='*' element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
