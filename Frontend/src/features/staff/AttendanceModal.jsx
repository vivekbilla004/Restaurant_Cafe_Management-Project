import React, { useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { X, CalendarCheck } from 'lucide-react';

const AttendanceModal = ({ staff, onClose, refreshData }) => {
  // Default to today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [status, setStatus] = useState('Present');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/api/staff/${staff._id}/attendance`, { date, status });
      toast.success(`Attendance logged for ${staff.name}`);
      refreshData();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-50/50">
          <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
            <CalendarCheck size={20} /> Mark Attendance
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-500 mb-2">Employee: <span className="font-bold text-gray-900">{staff.name}</span></p>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
            <input type="date" max={today} required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {['Present', 'Half-Day', 'Absent'].map(opt => (
                <button key={opt} type="button" onClick={() => setStatus(opt)} className={`py-2 text-sm font-medium rounded-lg border transition ${status === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4"><button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">Save Record</button></div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceModal;