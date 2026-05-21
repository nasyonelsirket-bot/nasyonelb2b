import { Navigate, useLocation } from 'react-router-dom';
import { getMemberSession } from '@/utils/memberSession';

export default function AccountGuard({ children }) {
  const location = useLocation();
  const session = getMemberSession();

  if (!session?.id) {
    return <Navigate to="/giris" replace state={{ from: location.pathname }} />;
  }

  return children;
}
