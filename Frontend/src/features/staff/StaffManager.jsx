import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";
import { Users, Plus, CheckSquare, Banknote } from "lucide-react";
import StaffModal from "./StaffModal";
import AttendanceModal from "./AttendanceModal";
import { useNavigate } from "react-router-dom";

const StaffManager = () => {
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Modal States
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [activeAttendanceStaff, setActiveAttendanceStaff] = useState(null);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/staff");
      console.log("Fetched Staff Data:", response.data); // Debug log
      setStaffList(response.data);
    } catch (err) {
      toast.error("Failed to load staff records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // --- AUTOMATED PAYROLL LOGIC ---
  const handleRunPayroll = async (staff) => {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const currentYear = new Date().getFullYear();
    

    if (
      !window.confirm(
        `Run payroll for ${staff.name} for Month ${currentMonth}/${currentYear}? This will automatically log a business Expense.`,
      )
    )
      return;

    const loadingToast = toast.loading(
      `Processing payroll for ${staff.name}...`,
    );
    try {
      // THE FIX: We pass the pre-calculated payout from the UI to the backend
      const calculatedPayout =
        staff.estimatedPayout ||
        Math.round((staff.salary / 30) * (staff.daysPresentThisMonth || 0));
      const payload = {
        month: currentMonth,
        year: currentYear,
        payoutAmount: calculatedPayout, // <--- ADD THIS LINE
      };
      const response = await api.post(
        `/api/staff/${staff._id}/payroll`,
        payload,
      );
      toast.success(`Payroll processed! Payout: ₹${response.data.payout}`, {
        id: loadingToast,
      });
      setTimeout(() => {
        navigate('/expenses');
      }, 1000);
      // We don't necessarily need to refresh data here unless you want to show a "Paid" badge, but good for sync
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process payroll", {
        id: loadingToast,
      });
    }
  };

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20 text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg font-medium">Loading HR Records...</p>
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-blue-600" /> Staff & Payroll
          </h1>
          <p className="text-gray-500 mt-1">
            Manage employees, daily attendance, and automated salaries.
          </p>
        </div>

        <button
          onClick={() => setIsStaffModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition"
        >
          <Plus size={18} /> Add Staff
        </button>
      </div>

      {/* Staff Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Base Salary</th>
                <th className="px-6 py-4 font-semibold">
                  Attendance (This Mth)
                </th>
                <th className="px-6 py-4 font-semibold">Est. Payout</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                <th className="px-6 py-4 font-semibold text-right">email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staffList.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No staff members found. Add your first employee!
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr
                    key={staff._id}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{staff.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      ₹{staff.salary.toLocaleString()}
                    </td>

                    {/* Backend calculated this for us! */}
                    <td className="px-6 py-4">
                      <span className="font-bold text-green-600">
                        {staff.daysPresentThisMonth || 0}
                      </span>
                      <span className="text-gray-400 text-sm"> days</span>
                    </td>

                    <td className="px-6 py-4 font-bold text-gray-900">
                      ₹{(staff.estimatedPayout || 0).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setActiveAttendanceStaff(staff)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition"
                      >
                        <CheckSquare size={16} /> Mark Attd.
                      </button>
                      <button
                        onClick={() => handleRunPayroll(staff)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition"
                      >
                        <Banknote size={16} /> Pay
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {staff.email || "No system access"}
                    </td>
                    
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isStaffModalOpen && (
        <StaffModal
          onClose={() => setIsStaffModalOpen(false)}
          refreshData={fetchStaff}
        />
      )}
      {activeAttendanceStaff && (
        <AttendanceModal
          staff={activeAttendanceStaff}
          onClose={() => setActiveAttendanceStaff(null)}
          refreshData={fetchStaff}
        />
      )}
    </div>
  );
};

export default StaffManager;
