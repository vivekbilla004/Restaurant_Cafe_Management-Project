import React, { useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

const TableModal = ({ onClose, refreshData }) => {
  const [formData, setFormData] = useState({ tableNumber: '', capacity: 2 });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.capacity < 1) return toast.error('Capacity must be at least 1');

    setLoading(true);
    try {
      await api.post('/api/tables', formData);
      toast.success(`Table ${formData.tableNumber} added successfully!`);
      refreshData();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add table');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Add New Table</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Table Number / Name</label>
            <input 
              type="text" 
              required 
              autoFocus
              value={formData.tableNumber} 
              onChange={(e) => setFormData({...formData, tableNumber: e.target.value.toUpperCase()})} 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition uppercase" 
              placeholder="e.g., T-01 or BALCONY-1" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Seating Capacity</label>
            <div className="flex items-center gap-4">
              <input 
                type="number" 
                required 
                min="1" 
                value={formData.capacity} 
                onChange={(e) => setFormData({...formData, capacity: e.target.value})} 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
              />
              <span className="text-gray-500 font-medium whitespace-nowrap">Persons</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-70 flex justify-center items-center">
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Save Table'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableModal;