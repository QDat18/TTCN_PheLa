import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, isAdminUser } from '~/AuthContext';
import GlobalLoading from './GlobalLoading';

interface Props {
  children: React.ReactNode;
}

const AdminGuard: React.FC<Props> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || !isAdminUser(user)) {
        navigate('/admin', { replace: true });
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

export default AdminGuard;
