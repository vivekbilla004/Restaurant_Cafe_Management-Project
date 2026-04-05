import React, { useState } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { X, UserPlus, KeyRound } from "lucide-react";

const StaffModal = ({ onClose, refreshData }) => {
  const [formData, setFormData] = useState({
    name: "",
    role: "Waiter",
    salary: "",
    email: "",
    password: "omicra123",
  });
  const [loading, setLoading] = useState(false);

  const needsSystemAccess = [
    "Manager",
    "Cashier",
    "Waiter",
    "Kitchen",
  ].includes(formData.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.salary < 0) return toast.error("Salary cannot be negative");

    const payload = { ...formData, salary: Number(formData.salary) };
    if (!needsSystemAccess || !payload.email) {
      delete payload.email;
      delete payload.password;
    }

    setLoading(true);
    const loadToast = toast.loading("Adding staff...");
    try {
      const res = await api.post("/api/staff", payload);
      if (res.data.loginCreated) {
        toast.success(`${formData.name} added! Login: ${formData.email}`, {
          duration: 4000,
          id: loadToast,
        });
      } else {
        toast.success(`${formData.name} added successfully!`, {
          id: loadToast,
        });
      }
      refreshData();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add staff", {
        id: loadToast,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <UserPlus size={20} className="text-blue-600" /> Add Staff
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 bg-white rounded-full shadow-sm"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar"
        >
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Full Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
              placeholder="e.g., Rahul Sharma"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Role
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
              >
                <option value="Manager">Manager</option>
                <option value="Cashier">Cashier</option>
                <option value="Waiter">Waiter</option>
                <option value="Kitchen">Kitchen Staff</option>
                <option value="Cleaner">Cleaner (No Login)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Base Salary (₹)
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.salary}
                onChange={(e) =>
                  setFormData({ ...formData, salary: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                placeholder="15000"
              />
            </div>
          </div>

          {needsSystemAccess && (
            <div className="mt-2 p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound size={16} className="text-blue-600" />
                <p className="text-xs font-black text-blue-900 uppercase tracking-wider">
                  System Credentials
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Login Email
                </label>
                <input
                  type="email"
                  required={needsSystemAccess}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-800"
                  placeholder="waiter@omicra.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Initial Password
                </label>
                <input
                  type="text"
                  required={needsSystemAccess}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono font-bold text-blue-700"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-sm transition"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm shadow-lg shadow-blue-200 active:scale-95 transition flex justify-center items-center"
            >
              {loading ? "SAVING..." : "SAVE STAFF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default StaffModal;
