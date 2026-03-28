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
    const verifySubscription = async () => {
      // SuperAdmins bypass the lock completely
      if (!user || user.role === 'SuperAdmin') {
        setIsLoading(false);
        return;
      }

      try {
        // Ask the backend for the ABSOLUTE TRUTH from the MongoDB Subscription Model
        const res = await api.get('/api/subscription/current');
        
        if (res.data.status === 'Expired') {
          setIsExpired(true);
        } else {
          setIsExpired(false);
        }
      } catch (err) {
        console.error("Subscription Guard Error:", err);
        // If the API fails (or returns 402 Payment Required), lock the doors to be safe
        setIsExpired(true);
      } finally {
        setIsLoading(false);
      }
    };

    verifySubscription();
  }, [location.pathname, user]); // Re-check whenever they click a new sidebar link

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // ==========================================
  // THE REDIRECT LOCK
  // ==========================================
  if (isExpired) {
    // If they are expired, immediately teleport them to the Subscription Renewal page
    return <Navigate to="/subscription" replace />;
  }

  // If active, let them into the POS, Dashboard, etc!
  return <Outlet />;
};

export default SubscriptionGuard;