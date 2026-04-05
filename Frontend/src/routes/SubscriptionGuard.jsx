import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../store/AuthContext';

const SubscriptionGuard = () => {
  const { user } = useAuth();
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // 🔥 LOOPHOLE 2 FIX: Prevent Infinite Loop!
    if (location.pathname === '/subscription') {
      setIsLoading(false);
      return;
    }

    const verifySubscription = async () => {
      if (!user || user.role === 'SuperAdmin') {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get('/api/subscription/current');
        setIsExpired(res.data.status === 'Expired');
      } catch (err) {
        console.error("Subscription Guard Error:", err);
        setIsExpired(true); // Default to locked if API fails/402
      } finally {
        setIsLoading(false);
      }
    };

    verifySubscription();
  }, [user]); // 🔥 LOOPHOLE 1 FIX: Removed location.pathname! Only runs on initial load/login.

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <Loader className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="font-bold tracking-widest uppercase text-xs text-slate-400">Verifying License...</p>
      </div>
    );
  }

  // ==========================================
  // 🔥 LOOPHOLE 3 FIX: Role-Based Lockout
  // ==========================================
  if (isExpired && location.pathname !== '/subscription') {
    return <Navigate to="/subscription" replace />;
  }

  return <Outlet />;
};

export default SubscriptionGuard;