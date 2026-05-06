import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, isCustomerUser } from '~/AuthContext';
import GlobalLoading from './GlobalLoading';
import { toast } from 'react-toastify';

interface Props {
  children: React.ReactNode;
}

const CustomerGuard: React.FC<Props> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.info('Vui lòng đăng nhập để tiếp tục thao tác này');
        navigate('/login-register', { replace: true });
      } else if (!isCustomerUser(user)) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        setIsChecking(false);
      }
    }
  }, [user, loading, navigate]);

  if (loading || isChecking) {
    return <GlobalLoading isLoading={true} />;
  }

  return <>{children}</>;
};

export default CustomerGuard;
