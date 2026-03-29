import React, { useState } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { X, UserPlus, KeyRound } from "lucide-react";

const StaffModal = ({ onClose, refreshData }) => {
  // Added email and a default password to the state
  const [formData, setFormData] = useState({
    name: "",
    role: "Waiter",
    salary: "",
    email: "",
    password: "omicra123", // Default easy password
  });
  const [loading, setLoading] = useState(false);

  // Roles that actually need to log into the software
  const needsSystemAccess = [
    "Manager",
    "Cashier",
    "Waiter",
    "Kitchen",
  ].includes(formData.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.salary < 0) return toast.error("Salary cannot be negative");

    // If they don't need system access (like a Cleaner), wipe the email/password
    const payload = { ...formData, salary: Number(formData.salary) };
    if (!needsSystemAccess || !payload.email) {
      delete payload.email;
      delete payload.password;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/staff", payload);

      // Check the backend response to see if a login was actually created
      if (res.data.loginCreated) {
        toast.success(
          `${formData.name} added! Login: ${formData.email} / ${formData.password}`,
          { duration: 5000 },
        );
      } else {
        toast.success(`${formData.name} added to staff HR successfully!`);
      }

      refreshData();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UserPlus size={20} className="text-blue-600" /> Add Staff Member
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Basic HR Info */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
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
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="e.g., Rahul Sharma"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Role
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer"
              >
                <option value="Manager">Manager</option>
                <option value="Cashier">Cashier</option>
                <option value="Waiter">Waiter</option>
                <option value="Kitchen">Kitchen Staff</option>
                <option value="Cleaner">Cleaner (No System Access)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="15000"
              />
            </div>
          </div>

          {/* System Access / Login Credentials */}
          {needsSystemAccess && (
            <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound size={16} className="text-blue-600" />
                <p className="text-sm font-bold text-blue-900">
                  System Login Credentials
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Login Email
                </label>
                <input
                  type="email"
                  required={needsSystemAccess}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="manager@restaurant.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Initial Password (They can use this to log in)
                </label>
                <input
                  type="text"
                  required={needsSystemAccess}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-blue-700"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex justify-center items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "Save Staff"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffModal;
