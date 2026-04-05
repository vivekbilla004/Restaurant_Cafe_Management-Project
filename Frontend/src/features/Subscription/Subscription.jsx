import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Loader,
  Lock,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../store/AuthContext"; // Need this for Role Check

const Subscription = () => {
  const { user } = useAuth();
  const [subData, setSubData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await api.get("/api/subscription/current");
        setSubData(res.data);
      } catch (err) {
        toast.error("Failed to load billing data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubscription();
  }, []);

  const handleUpgrade = (planName) => {
    toast.loading(`Connecting to secure gateway for ${planName} plan...`);
    setTimeout(() => {
      toast.dismiss();
      toast.error("Payment gateway not integrated in development mode.");
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <Loader className="animate-spin text-blue-600 mb-2" size={40} />
        <p className="font-bold text-sm uppercase tracking-widest">
          Loading Billing...
        </p>
      </div>
    );
  }

  const isPaid = subData?.plan === "Pro";
  const isExpired = subData?.status === "Expired";
  const isOwner = user?.role === "Owner";

  // 🔥 LOOPHOLE 3 UX FIX: The Waiter Lockout Screen
  if (isExpired && !isOwner) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="bg-red-100 p-6 rounded-full mb-6 animate-pulse">
          <Lock size={64} className="text-red-600" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">
          System Locked
        </h1>
        <p className="text-slate-500 font-medium max-w-md">
          The software license for this restaurant has expired. Please contact
          your Restaurant Owner or Manager to renew the subscription to resume
          operations.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto font-sans h-full overflow-y-auto bg-slate-50 pb-24">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
          <ShieldCheck className="text-white" size={28} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Billing & Plans
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest">
            Manage SaaS Subscription
          </p>
        </div>
      </div>

      {/* DYNAMIC STATUS BANNER */}
      <div
        className={`p-6 rounded-3xl border-2 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm transition-all ${isPaid ? "bg-emerald-50 border-emerald-200" : isExpired ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}
      >
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
            Current Plan
          </p>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-slate-900">
              {subData.plan}
            </h2>
            <span
              className={`px-3 py-1.5 text-[10px] font-black rounded-lg border uppercase tracking-wider ${isPaid ? "bg-emerald-100 text-emerald-700 border-emerald-200" : isExpired ? "bg-red-100 text-red-600 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}
            >
              {subData.status}
            </span>
          </div>
        </div>

        <div className="w-full md:w-auto text-left md:text-right border-t md:border-t-0 md:border-l border-slate-200/50 pt-4 md:pt-0 md:pl-6">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
            Time Remaining
          </p>
          <div className="flex items-center md:justify-end gap-2">
            {subData.daysLeft <= 3 && !isExpired && (
              <AlertTriangle
                size={20}
                className="text-amber-500 animate-bounce"
              />
            )}
            {isExpired && <AlertTriangle size={20} className="text-red-500" />}
            <h2
              className={`text-2xl font-black ${isExpired ? "text-red-600" : subData.daysLeft <= 3 ? "text-amber-600" : "text-slate-900"}`}
            >
              {isExpired ? "0 Days Left" : `${subData.daysLeft} Days Left`}
            </h2>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-black uppercase tracking-widest">
            {isExpired ? "Expired On: " : "Renews On: "}
            <span className="text-slate-700">
              {new Date(subData.endDate).toLocaleDateString()}
            </span>
          </p>
        </div>
      </div>

      {/* PRICING CARDS (Only visible to Owners/Managers who can pay) */}
      {isOwner && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Basic/Trial Details */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              Basic Features
            </h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">
              What you get during trial.
            </p>
            <div className="mb-8">
              <span className="text-4xl font-black text-slate-900">Free</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                "Cloud POS System",
                "Kitchen Display (KOT)",
                "Basic Menu Management",
                "Daily Sales Report",
              ].map((feat, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-slate-700 font-bold text-sm"
                >
                  <CheckCircle2 size={18} className="text-slate-300 shrink-0" />{" "}
                  {feat}
                </li>
              ))}
            </ul>
            <button
              disabled
              className="w-full py-3.5 bg-slate-100 text-slate-400 font-black rounded-xl text-sm uppercase tracking-wider cursor-not-allowed"
            >
              {subData.plan === "Trial" && !isExpired
                ? "Active Trial"
                : "Not Available"}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col relative overflow-hidden transform md:-translate-y-2">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-bl-2xl uppercase tracking-widest shadow-md">
              Recommended
            </div>
            <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
              <Zap className="text-yellow-400 fill-yellow-400" size={20} />{" "}
              Omicra Pro
            </h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">
              Full Enterprise Engine.
            </p>
            <div className="mb-8">
              <span className="text-4xl font-black text-white">₹3,499</span>
              <span className="text-slate-400 font-bold text-sm">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                "Everything in Basic",
                "Inventory Auto-Deduction",
                "Automated Staff Payroll",
                "Advanced P&L Analytics",
                "Unlimited Staff Accounts",
              ].map((feat, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-slate-300 font-bold text-sm"
                >
                  <CheckCircle2
                    size={18}
                    className="text-emerald-400 shrink-0"
                  />{" "}
                  {feat}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade("Pro")}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm uppercase tracking-wider transition shadow-lg shadow-blue-600/30 flex justify-center items-center gap-2 active:scale-95"
            >
              <CreditCard size={18} />{" "}
              {isPaid ? "RENEW PRO PLAN" : "UPGRADE TO PRO"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
