import React, { useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { X, UserPlus } from 'lucide-react';

const StaffModal = ({ onClose, refreshData }) => {
  const [formData, setFormData] = useState({ name: '', role: 'Waiter', salary: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.salary < 0) return toast.error('Salary cannot be negative');

    setLoading(true);
    try {
      await api.post('/api/staff', { ...formData, salary: Number(formData.salary) });
      toast.success(`${formData.name} added to staff successfully!`);
      refreshData();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add staff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UserPlus size={20} className="text-blue-600"/> Add Staff Member
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input type="text" required autoFocus value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="e.g., Rahul Sharma" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
              <select required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer">
                <option value="Manager">Manager</option>
                <option value="Cashier">Cashier</option>
                <option value="Waiter">Waiter</option>
                <option value="Kitchen">Kitchen Staff</option>
                <option value="Cleaner">Cleaner</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Base Salary (₹)</label>
              <input type="number" required min="1" value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="15000" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex justify-center items-center">
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Save Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffModal;