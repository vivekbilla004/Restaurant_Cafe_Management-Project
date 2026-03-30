import React, { useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { X, Grid } from 'lucide-react';

const CategoryModal = ({ onClose, refreshData }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/menu/categories', { name });
      toast.success('Category Live!');
      refreshData();
      onClose();
    } catch (err) {
      toast.error('Failed to add');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Grid size={18} className="text-blue-600"/> New Category
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Category Name</label>
            <input
              type="text" autoFocus required
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
              placeholder="e.g., Starters, Main Course"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={onClose} className="order-2 sm:order-1 flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={loading} className="order-1 sm:order-2 flex-1 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition">
              {loading ? "CREATING..." : "CREATE CATEGORY"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CategoryModal;