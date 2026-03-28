import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { ShieldCheck, Zap, CheckCircle2, AlertTriangle, CreditCard, Loader } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Subscription = () => {
  const [subData, setSubData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the real data from your Mongoose Model
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await api.get('/api/subscription/current');
        setSubData(res.data);
      } catch (err) {
        toast.error('Failed to load billing data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubscription();
  }, []);

  const handleUpgrade = (planName) => {
    toast.loading(`Connecting to secure gateway for ${planName} plan...`);
    // Future: Connect Razorpay/Stripe here. Upon successful payment, 
    // your backend will create a new Subscription document with endDate + 30 days!
    setTimeout(() => {
      toast.dismiss();
      toast.error('Payment gateway not integrated in development mode.');
    }, 2000);
  };

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader className="animate-spin text-blue-600" size={40}/></div>;
  }

  const isPaid = subData?.plan === 'Pro';
  const isExpired = subData?.status === 'Expired';

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans h-full overflow-y-auto bg-slate-50">
      <Toaster />
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <ShieldCheck className="text-blue-600" size={32} /> Billing & Plans
        </h1>
        <p className="text-slate-500 mt-1">Manage your restaurant's subscription and billing details.</p>
      </div>

      {/* Dynamic Status Banner */}
      <div className={`p-6 rounded-2xl border mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm ${isPaid ? 'bg-emerald-50 border-emerald-200' : isExpired ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Plan</p>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900">{subData.plan}</h2>
            <span className={`px-2.5 py-1 text-xs font-bold rounded border uppercase ${isPaid ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : isExpired ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
              {subData.status}
            </span>
          </div>
        </div>
        
        <div className="text-left md:text-right">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Time Remaining</p>
          <div className="flex items-center gap-2">
            {subData.daysLeft <= 3 && !isExpired && <AlertTriangle size={18} className="text-amber-500" />}
            {isExpired && <AlertTriangle size={18} className="text-red-500" />}
            <h2 className={`text-2xl font-black ${isExpired ? 'text-red-600' : subData.daysLeft <= 3 ? 'text-amber-600' : 'text-slate-900'}`}>
              {isExpired ? '0 Days Left' : `${subData.daysLeft} Days Left`}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Renews/Expires: {new Date(subData.endDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* Basic/Trial Details */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-black text-slate-900 mb-2">Basic Features</h3>
          <p className="text-slate-500 text-sm font-medium mb-6">What you get during your trial.</p>
          <div className="mb-8">
            <span className="text-4xl font-black text-slate-900">Free</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            {['Cloud POS System', 'Kitchen Display (KOT)', 'Basic Menu Management', 'Daily Sales Report'].map((feat, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                <CheckCircle2 size={18} className="text-slate-400" /> {feat}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro Plan */}
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-bl-xl uppercase tracking-wider">Recommended</div>
          <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2"><Zap className="text-yellow-400" size={20}/> Omicra Pro</h3>
          <p className="text-slate-400 text-sm font-medium mb-6">Unlock the full Enterprise ERP engine.</p>
          <div className="mb-8">
            <span className="text-4xl font-black text-white">₹3,499</span><span className="text-slate-400 font-medium">/month</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            {['Everything in Basic', 'Inventory Auto-Deduction', 'Automated Staff Payroll', 'Advanced P&L Analytics', 'Unlimited Staff Accounts'].map((feat, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-300 font-medium text-sm">
                <CheckCircle2 size={18} className="text-emerald-400" /> {feat}
              </li>
            ))}
          </ul>
          <button onClick={() => handleUpgrade('Pro')} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition shadow-[0_0_20px_rgba(37,99,235,0.3)] flex justify-center items-center gap-2">
            <CreditCard size={18} /> {isPaid ? 'Renew Pro Plan' : 'Upgrade to Pro'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Subscription;