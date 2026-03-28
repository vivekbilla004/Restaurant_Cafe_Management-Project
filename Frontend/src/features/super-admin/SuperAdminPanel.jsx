import React, { useState } from 'react';
import { Activity, Users, Database, Power, Search, UploadCloud, DollarSign } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const SuperAdminPanel = () => {
  const [activeTab, setActiveTab] = useState('Tenants');

  // Mock SaaS Database
  const [tenants, setTenants] = useState([
    { id: 'TEN-001', name: 'Central Cafe', owner: 'Vivek', plan: 'Pro', status: 'Active', mrr: 3499, expiry: '2026-11-20' },
    { id: 'TEN-002', name: 'Burger Hub', owner: 'Rohit', plan: 'Basic', status: 'Expired', mrr: 0, expiry: '2026-03-15' },
    { id: 'TEN-003', name: 'Sushi Station', owner: 'Rahul', plan: 'Trial', status: 'Active', mrr: 0, expiry: '2026-04-05' }
  ]);

  const totalMRR = tenants.reduce((sum, t) => sum + t.mrr, 0);

  const toggleStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    setTenants(tenants.map(t => t.id === id ? { ...t, status: newStatus } : t));
    toast.success(`Tenant ${id} is now ${newStatus}`);
  };

  const pushSystemUpdate = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Deploying V1.2 to all tenants...',
        success: 'System Update Pushed Successfully!',
        error: 'Deployment failed.',
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans flex flex-col">
      <Toaster position="bottom-right" />
      
      {/* Top Navbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center"><Activity className="text-white" /></div>
          <div>
            <h1 className="text-xl font-black text-white tracking-widest uppercase">Omicra Command</h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Super Admin Portal</p>
          </div>
        </div>
        <button onClick={pushSystemUpdate} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-500/20 transition">
          <UploadCloud size={16} /> Push System Update
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-2">
          {['Tenants', 'Revenue & Logs', 'Plan Settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
          
          {/* SAAS KPIs */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><DollarSign size={14}/> Monthly Recurring Revenue</p>
              <h3 className="text-4xl font-black text-white">₹{totalMRR.toLocaleString()}</h3>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Users size={14}/> Active Restaurants</p>
              <h3 className="text-4xl font-black text-white">{tenants.filter(t => t.status === 'Active').length}</h3>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Database size={14}/> Server Status</p>
              <h3 className="text-4xl font-black text-emerald-400">99.9%</h3>
            </div>
          </div>

          {activeTab === 'Tenants' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Restaurant Management</h3>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
                  <input type="text" placeholder="Search tenants..." className="bg-slate-950 border border-slate-700 text-sm rounded-lg pl-9 pr-4 py-2 outline-none focus:border-blue-500 text-white" />
                </div>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-950 text-xs uppercase text-slate-500">
                    <th className="px-6 py-4 font-semibold">Tenant ID / Name</th>
                    <th className="px-6 py-4 font-semibold">Plan</th>
                    <th className="px-6 py-4 font-semibold">Expiry Date</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {tenants.map(tenant => (
                    <tr key={tenant.id} className="hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">{tenant.name}</p>
                        <p className="text-xs text-slate-500">{tenant.id} • Owner: {tenant.owner}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-blue-400">{tenant.plan}</td>
                      <td className="px-6 py-4 font-medium text-slate-400">{tenant.expiry}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold border ${tenant.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : tenant.status === 'Expired' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => toggleStatus(tenant.id, tenant.status)} className={`p-2 rounded-lg border transition ${tenant.status === 'Active' ? 'text-red-400 border-red-500/20 hover:bg-red-500/10' : 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'}`} title={tenant.status === 'Active' ? 'Deactivate' : 'Activate'}>
                          <Power size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab !== 'Tenants' && (
             <div className="h-64 flex items-center justify-center text-slate-600 font-bold uppercase tracking-widest border-2 border-dashed border-slate-800 rounded-2xl">
               {activeTab} Module Under Construction
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SuperAdminPanel;