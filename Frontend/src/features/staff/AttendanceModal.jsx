import React, { useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { X, CalendarCheck } from 'lucide-react';

const AttendanceModal = ({ staff, onClose, refreshData }) => {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [status, setStatus] = useState('Present');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadToast = toast.loading("Saving...");
    try {
      await api.post(`/api/staff/${staff._id}/attendance`, { date, status });
      toast.success(`Attendance logged!`, { id: loadToast });
      refreshData();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log attendance', { id: loadToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <CalendarCheck size={20} className="text-blue-600"/> Mark Attendance
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 bg-white rounded-full shadow-sm"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</p>
            <p className="font-bold text-slate-900">{staff.name}</p>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
            <input type="date" max={today} required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {['Present', 'Half-Day', 'Absent'].map(opt => (
                <button key={opt} type="button" onClick={() => setStatus(opt)} className={`py-3 text-xs font-black uppercase tracking-wider rounded-xl border-2 transition-all ${status === opt ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-slate-900 text-white font-black rounded-xl text-sm transition active:scale-95 shadow-lg shadow-slate-900/20">
            {loading ? "SAVING..." : "SAVE RECORD"}
          </button>
        </form>
      </div>
    </div>
  );
};
export default AttendanceModal;