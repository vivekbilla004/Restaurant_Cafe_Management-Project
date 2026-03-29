import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Building2, DollarSign, Megaphone, UserPlus, 
  ShieldCheck, Power, Lock, CheckCircle, LogOut,
  Activity, Search, Globe, X, CreditCard
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useNavigate } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");

  // New Restaurant Form
  const [newClient, setNewClient] = useState({
    restaurantName: '', ownerName: '', email: '', phone: '', address: '', plan: 'Basic', password: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/admin/restaurants');
      setRestaurants(data);
    } catch (err) {
      toast.error('Failed to sync with Omicra Cloud');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- CORE FUNCTIONALITIES ---

  const handleToggleStatus = async (id, name) => {
    try {
      await api.put(`/api/admin/restaurants/${id}/status`);
      toast.success(`Access updated for ${name}`);
      fetchData(); // Refresh list
    } catch (err) {
      toast.error('Failed to change account status');
    }
  };

  const handlePlanChange = async (id, newPlan) => {
    try {
      await api.put(`/api/admin/restaurants/${id}/plan`, { plan: newPlan });
      toast.success(`Plan updated to ${newPlan}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update subscription');
    }
  };

  const handleOnboard = async (e) => {
    e.preventDefault();
    const loadId = toast.loading("Provisioning Tenant...");
    try {
      await api.post('/api/admin/restaurants', newClient);
      toast.success(`${newClient.restaurantName} is now live!`, { id: loadId });
      setIsAddModalOpen(false);
      setNewClient({ restaurantName: '', ownerName: '', email: '', phone: '', address: '', plan: 'Basic', password: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Onboarding failed", { id: loadId });
    }
  };

  const pushUpdate = async (clear = false) => {
    try {
      await api.put('/api/admin/broadcast', { message: broadcastMsg, clear });
      toast.success(clear ? "Updates cleared" : "Broadcast pushed to all clients!");
      setIsBroadcastModalOpen(false);
      setBroadcastMsg("");
    } catch (err) {
      toast.error("Failed to push update");
    }
  };

  // --- ANALYTICS MATH ---
  const activeCount = restaurants.filter(r => r.isActive).length;
  const mrr = restaurants.filter(r => r.isActive && r.plan === 'Pro').length * 49;
  const filtered = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <Toaster position="top-right" />
      
      {/* PROFESSIONAL NAV */}
      <nav className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><ShieldCheck size={20}/></div>
          <span className="text-xl font-bold text-slate-800">Omicra <span className="text-indigo-600 underline decoration-2 underline-offset-4">HQ</span></span>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-red-600 transition-colors">
          <LogOut size={18}/> Sign Out
        </button>
      </nav>

      <div className="p-8 max-w-7xl mx-auto">
        {/* KPI SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatBox icon={<DollarSign/>} label="Monthly Revenue" value={`$${mrr}`} color="text-emerald-600" bg="bg-emerald-50" />
          <StatBox icon={<Building2/>} label="Total Clients" value={restaurants.length} color="text-indigo-600" bg="bg-indigo-50" />
          <StatBox icon={<Activity/>} label="Active Access" value={activeCount} color="text-blue-600" bg="bg-blue-50" />
        </div>

        {/* ACTION BAR */}
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
              type="text" placeholder="Search tenants..." 
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsBroadcastModalOpen(true)} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 flex items-center gap-2">
              <Megaphone size={18}/> Broadcast Update
            </button>
            <button onClick={() => setIsAddModalOpen(true)} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200">
              <UserPlus size={18}/> New Client
            </button>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Tenant</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(r => (
                <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{r.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{r.email}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={r.plan} 
                      onChange={(e) => handlePlanChange(r._id, e.target.value)}
                      className={`text-[10px] font-black px-2 py-1 rounded border outline-none cursor-pointer ${r.plan === 'Pro' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500'}`}
                    >
                      <option value="Basic">BASIC</option>
                      <option value="Pro">PRO SAAS</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {r.isActive ? 'ACTIVE' : 'LOCKED'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleToggleStatus(r._id, r.name)}
                      className={`p-2 rounded-lg transition-colors ${r.isActive ? 'text-slate-300 hover:text-red-500' : 'text-green-500 hover:bg-green-50'}`}
                    >
                      {r.isActive ? <Power size={20}/> : <CheckCircle size={20}/>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD CLIENT MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Provision New Tenant</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X/></button>
            </div>
            <form onSubmit={handleOnboard} className="p-8 grid grid-cols-2 gap-4">
              <div className="col-span-2"><Input label="Restaurant Name" value={newClient.restaurantName} onChange={v => setNewClient({...newClient, restaurantName: v})}/></div>
              <Input label="Owner Name" value={newClient.ownerName} onChange={v => setNewClient({...newClient, ownerName: v})}/>
              <Input label="Admin Email" type="email" value={newClient.email} onChange={v => setNewClient({...newClient, email: v})}/>
              <Input label="Set Password" type="text" value={newClient.password} onChange={v => setNewClient({...newClient, password: v})}/>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Initial Plan</label>
                <select className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold text-sm" onChange={e => setNewClient({...newClient, plan: e.target.value})}>
                  <option value="Basic">Basic (Trial)</option>
                  <option value="Pro">Pro (Paid)</option>
                </select>
              </div>
              <div className="col-span-2 pt-4"><button className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100">DEPLOY INSTANCE</button></div>
            </form>
          </div>
        </div>
      )}

      {/* --- BROADCAST MODAL --- */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6">
            <h2 className="text-xl font-black mb-2 flex items-center gap-2 text-slate-800"><Megaphone className="text-indigo-600"/> Push System Update</h2>
            <p className="text-xs text-slate-500 mb-4 font-medium uppercase tracking-wider">This message appears instantly on all client dashboards.</p>
            <textarea 
              className="w-full h-32 p-4 bg-slate-50 border rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium text-sm"
              placeholder="e.g. Omicra v2.0 is live! New KDS features added."
              value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => pushUpdate(true)} className="text-xs font-black text-red-500 hover:underline">Clear Banner</button>
              <div className="ml-auto flex gap-2">
                <button onClick={() => setIsBroadcastModalOpen(false)} className="px-4 py-2 font-bold text-slate-400">Cancel</button>
                <button onClick={() => pushUpdate(false)} className="px-6 py-2 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-md">PUSH LIVE</button>
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
  <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-4">
    <div className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center shadow-inner`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-3xl font-black text-slate-800">{value}</h3>
    </div>
  </div>
);

const Input = ({ label, value, onChange, type = "text" }) => (
  <div>
    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-wider">{label}</label>
    <input 
      type={type} required value={value} onChange={e => onChange(e.target.value)}
      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium text-sm"
    />
  </div>
);

export default SuperAdminDashboard;