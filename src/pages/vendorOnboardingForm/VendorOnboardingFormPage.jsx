import VendorOnboardingForm from '../../components/vendorOnboardingForm/VendorOnboardingForm';
import { ProtectedRoute } from '../../components/common';

const VendorOnboardingFormPage = () => {
  return (
    <ProtectedRoute>
      <VendorOnboardingForm />
    </ProtectedRoute>
  );
};

export default VendorOnboardingFormPage;