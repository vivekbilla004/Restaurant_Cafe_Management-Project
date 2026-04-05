import React, { useState } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { X, LayoutTemplate } from "lucide-react";

const TableModal = ({ onClose, refreshData }) => {
  const [formData, setFormData] = useState({ tableNumber: "", capacity: 2 });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.capacity < 1)
      return toast.error("Capacity must be at least 1");

    setLoading(true);
    const loadId = toast.loading("Adding table...");
    try {
      await api.post("/api/tables", formData);
      toast.success(`Table ${formData.tableNumber} added successfully!`, {
        id: loadId,
      });
      refreshData();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add table", {
        id: loadId,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <LayoutTemplate size={20} className="text-blue-600" /> Add New Table
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 bg-white rounded-full shadow-sm transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Table Number / Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={formData.tableNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tableNumber: e.target.value.toUpperCase(),
                })
              }
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-800 transition uppercase placeholder:normal-case placeholder:font-medium placeholder:text-slate-400"
              placeholder="e.g., T-01 or Balcony-1"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Seating Capacity
            </label>
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="number"
                required
                min="1"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
                className="w-full px-4 py-3 bg-transparent outline-none font-black text-slate-800 transition"
              />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4 whitespace-nowrap">
                Persons
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-sm transition uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-70 flex justify-center items-center uppercase tracking-wider"
            >
              {loading ? "Saving..." : "Save Table"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableModal;
