import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";
import {
  Building2,
  DollarSign,
  Megaphone,
  UserPlus,
  ShieldCheck,
  Power,
  CheckCircle,
  LogOut,
  Activity,
  Search,
  X,
  Mail,
} from "lucide-react";
import { useAuth } from "../../store/AuthContext";
import { useNavigate } from "react-router-dom";

const SuperAdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");

  const [newClient, setNewClient] = useState({
    restaurantName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    plan: "Basic",
    password: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/admin/restaurants");
      setRestaurants(data);
    } catch (err) {
      toast.error("Failed to sync with Omicra Cloud");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (id, name) => {
    try {
      await api.put(`/api/admin/restaurants/${id}/status`);
      toast.success(`Access updated for ${name}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to change account status");
    }
  };

  const handlePlanChange = async (id, newPlan) => {
    try {
      await api.put(`/api/admin/restaurants/${id}/plan`, { plan: newPlan });
      toast.success(`Plan updated to ${newPlan}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to update subscription");
    }
  };

  const handleOnboard = async (e) => {
    e.preventDefault();
    const loadId = toast.loading("Provisioning Tenant...");
    try {
      await api.post("/api/admin/restaurants", newClient);
      toast.success(`${newClient.restaurantName} is now live!`, { id: loadId });
      setIsAddModalOpen(false);
      setNewClient({
        restaurantName: "",
        ownerName: "",
        email: "",
        phone: "",
        address: "",
        plan: "Basic",
        password: "",
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Onboarding failed", {
        id: loadId,
      });
    }
  };

  const pushUpdate = async (clear = false) => {
    try {
      await api.put("/api/admin/broadcast", { message: broadcastMsg, clear });
      toast.success(
        clear ? "Updates cleared" : "Broadcast pushed to all clients!",
      );
      setIsBroadcastModalOpen(false);
      setBroadcastMsg("");
    } catch (err) {
      toast.error("Failed to push update");
    }
  };

  const activeCount = restaurants.filter((r) => r.isActive).length;
  // Calculate MRR (Monthly Recurring Revenue) based on Pro plans
  const mrr =
    restaurants.filter((r) => r.isActive && r.plan === "Pro").length * 3499;
  const filtered = restaurants.filter(
    (r) =>
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <Toaster position="top-right" />

      {/* PROFESSIONAL NAV */}
      <nav className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <ShieldCheck size={20} />
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tight">
            OMICRA <span className="text-indigo-600">HQ</span>
          </span>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-red-600 transition-colors"
        >
          <span className="hidden sm:inline">Sign Out</span>{" "}
          <LogOut size={16} />
        </button>
      </nav>

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* KPI SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
          <StatBox
            icon={<DollarSign />}
            label="Monthly Revenue"
            value={`₹${mrr.toLocaleString()}`}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <StatBox
            icon={<Building2 />}
            label="Total Clients"
            value={restaurants.length}
            color="text-indigo-600"
            bg="bg-indigo-50"
          />
          <StatBox
            icon={<Activity />}
            label="Active Access"
            value={activeCount}
            color="text-blue-600"
            bg="bg-blue-50"
          />
        </div>

        {/* ACTION BAR */}
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search tenants by name or email..."
              className="w-full pl-12 pr-4 py-3 md:py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 sm:gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="flex-1 md:flex-none px-4 py-3 md:py-3.5 bg-white border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Megaphone size={16} />{" "}
              <span className="hidden sm:inline">Broadcast</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 md:flex-none px-6 py-3 md:py-3.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition active:scale-95"
            >
              <UserPlus size={16} /> New Client
            </button>
          </div>
        </div>

        {/* DATA AREA */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-bold">
            Syncing with Cloud...
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Tenant</th>
                    <th className="px-6 py-4">Admin Email</th>
                    <th className="px-6 py-4">Current Plan</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => (
                    <tr
                      key={r._id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {r.name}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">
                        {r.email}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={r.plan}
                          onChange={(e) =>
                            handlePlanChange(r._id, e.target.value)
                          }
                          className={`text-[10px] font-black px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition ${r.plan === "Pro" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}
                        >
                          <option value="Basic">BASIC TRIAL</option>
                          <option value="Pro">PRO SAAS</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider ${r.isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}
                        >
                          {r.isActive ? "Active" : "Locked"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(r._id, r.name)}
                          className={`p-2 rounded-xl transition-colors shadow-sm border ${r.isActive ? "bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200" : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"}`}
                          title={r.isActive ? "Lock Account" : "Unlock Account"}
                        >
                          {r.isActive ? (
                            <Power size={18} />
                          ) : (
                            <CheckCircle size={18} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold">
                  No tenants found.
                </div>
              ) : (
                filtered.map((r) => (
                  <div key={r._id} className="p-5 bg-white flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-slate-900 text-lg">
                          {r.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                          <Mail size={12} /> {r.email}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleStatus(r._id, r.name)}
                        className={`p-2.5 rounded-xl transition-colors shadow-sm border ${r.isActive ? "bg-white border-slate-200 text-slate-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}
                      >
                        {r.isActive ? (
                          <Power size={18} />
                        ) : (
                          <CheckCircle size={18} />
                        )}
                      </button>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Status
                        </p>
                        <span
                          className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${r.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                        >
                          {r.isActive ? "Live" : "Locked"}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          SaaS Plan
                        </p>
                        <select
                          value={r.plan}
                          onChange={(e) =>
                            handlePlanChange(r._id, e.target.value)
                          }
                          className={`text-[10px] font-black px-2 py-1 rounded-md border outline-none ${r.plan === "Pro" ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-white text-slate-600 border-slate-200"}`}
                        >
                          <option value="Basic">BASIC</option>
                          <option value="Pro">PRO SAAS</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- ADD CLIENT MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <UserPlus size={18} className="text-indigo-600" /> Provision
                Tenant
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 bg-white p-2 rounded-full shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleOnboard}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar"
            >
              <Input
                label="Restaurant Name"
                value={newClient.restaurantName}
                onChange={(v) =>
                  setNewClient({ ...newClient, restaurantName: v })
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Owner Name"
                  value={newClient.ownerName}
                  onChange={(v) => setNewClient({ ...newClient, ownerName: v })}
                />
                <Input
                  label="Admin Email"
                  type="email"
                  value={newClient.email}
                  onChange={(v) => setNewClient({ ...newClient, email: v })}
                />
              </div>

              <Input
                label="Set Initial Password"
                type="text"
                value={newClient.password}
                onChange={(v) => setNewClient({ ...newClient, password: v })}
              />

              <div className="pt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                  Initial Plan Tier
                </label>
                <select
                  className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50 font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  onChange={(e) =>
                    setNewClient({ ...newClient, plan: e.target.value })
                  }
                >
                  <option value="Basic">Basic (30-Day Trial)</option>
                  <option value="Pro">Pro (Active SaaS)</option>
                </select>
              </div>

              <div className="pt-4">
                <button className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition active:scale-95 flex justify-center items-center gap-2 text-sm">
                  DEPLOY INSTANCE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- BROADCAST MODAL --- */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-black flex items-center gap-2 text-slate-900">
                <Megaphone size={18} className="text-indigo-600" /> Global
                Broadcast
              </h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                Pushes message to all dashboards
              </p>
            </div>

            <div className="p-6">
              <textarea
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-sm text-slate-700 resize-none"
                placeholder="e.g. Omicra v2.0 is live! Refresh your browsers."
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
              />
              <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => pushUpdate(true)}
                  className="py-3 sm:py-0 px-4 text-xs font-black text-red-500 hover:bg-red-50 rounded-xl transition uppercase tracking-wider"
                >
                  Clear Current
                </button>
                <div className="flex-1 flex gap-2">
                  <button
                    onClick={() => setIsBroadcastModalOpen(false)}
                    className="flex-1 py-3 font-black text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs uppercase tracking-wider transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => pushUpdate(false)}
                    className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 text-xs uppercase tracking-wider transition active:scale-95"
                  >
                    PUSH LIVE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- HELPERS ---
const StatBox = ({ icon, label, value, color, bg }) => (
  <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 flex items-center gap-4 shadow-sm">
    <div
      className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${bg} ${color} flex items-center justify-center shadow-inner shrink-0`}
    >
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
        {value}
      </h3>
    </div>
  </div>
);

const Input = ({ label, value, onChange, type = "text" }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
      {label}
    </label>
    <input
      type={type}
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm text-slate-800 transition"
    />
  </div>
);

export default SuperAdminDashboard;
