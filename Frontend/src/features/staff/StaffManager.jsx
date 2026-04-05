// import React, { useState, useEffect } from "react";
// import api from "../../lib/api";
// import toast, { Toaster } from "react-hot-toast";
// import { Users, Plus, CheckSquare, Banknote, Mail } from "lucide-react";
// import StaffModal from "./StaffModal";
// import AttendanceModal from "./AttendanceModal";
// import { useNavigate } from "react-router-dom";

// const StaffManager = () => {
//   const [staffList, setStaffList] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const navigate = useNavigate();

//   const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
//   const [activeAttendanceStaff, setActiveAttendanceStaff] = useState(null);

//   const fetchStaff = async () => {
//     try {
//       setIsLoading(true);
//       const response = await api.get("/api/staff");
//       setStaffList(response.data);
//     } catch (err) {
//       toast.error("Failed to load staff records.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchStaff();
//   }, []);

//   const handleRunPayroll = async (staff) => {
//     const currentMonth = new Date().getMonth() + 1;
//     const currentYear = new Date().getFullYear();

//     if (
//       !window.confirm(
//         `Run payroll for ${staff.name} for Month ${currentMonth}/${currentYear}? This will log a business Expense.`,
//       )
//     )
//       return;

//     const loadingToast = toast.loading(
//       `Processing payroll for ${staff.name}...`,
//     );
//     try {
//       const calculatedPayout =
//         staff.estimatedPayout ||
//         Math.round((staff.salary / 30) * (staff.daysPresentThisMonth || 0));
//       const payload = {
//         month: currentMonth,
//         year: currentYear,
//         payoutAmount: calculatedPayout,
//       };

//       const response = await api.post(
//         `/api/staff/${staff._id}/payroll`,
//         payload,
//       );
//       toast.success(`Payroll processed! Payout: ₹${response.data.payout}`, {
//         id: loadingToast,
//       });

//       setTimeout(() => {
//         navigate("/expenses");
//       }, 1500);
//       fetchStaff();
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Failed to process payroll", {
//         id: loadingToast,
//       });
//     }
//   };

//   if (isLoading)
//     return (
//       <div className="flex flex-col items-center justify-center h-full pt-20 text-slate-400">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
//         <p className="text-lg font-bold">Loading HR Records...</p>
//       </div>
//     );

//   return (
//     <div className="p-4 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto bg-slate-50 font-sans pb-24 md:pb-8">
//       <Toaster position="top-right" />

//       {/* HEADER */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//         <div className="flex items-center gap-3">
//           <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
//             <Users className="text-white" size={24} />
//           </div>
//           <div>
//             <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
//               Staff & Payroll
//             </h1>
//             <p className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest mt-1">
//               Manage team & attendance
//             </p>
//           </div>
//         </div>

//         <button
//           onClick={() => setIsStaffModalOpen(true)}
//           className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm shadow-lg shadow-blue-200 transition active:scale-95"
//         >
//           <Plus size={18} /> ADD STAFF
//         </button>
//       </div>

//       {/* DATA AREA */}
//       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
//         {/* DESKTOP TABLE */}
//         <div className="hidden md:block overflow-x-auto">
//           <table className="w-full text-left">
//             <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
//               <tr>
//                 <th className="px-6 py-4">Employee</th>
//                 <th className="px-6 py-4">Role</th>
//                 <th className="px-6 py-4">Base Salary</th>
//                 <th className="px-6 py-4">Attendance (Mth)</th>
//                 <th className="px-6 py-4">Est. Payout</th>
//                 <th className="px-6 py-4 text-center">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100">
//               {staffList.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan="6"
//                     className="px-6 py-12 text-center text-slate-400 font-bold"
//                   >
//                     No staff members found.
//                   </td>
//                 </tr>
//               ) : (
//                 staffList.map((staff) => (
//                   <tr
//                     key={staff._id}
//                     className="hover:bg-slate-50 transition-colors"
//                   >
//                     <td className="px-6 py-4">
//                       <p className="font-bold text-slate-900">{staff.name}</p>
//                       <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
//                         <Mail size={10} /> {staff.email || "No Access"}
//                       </p>
//                     </td>
//                     <td className="px-6 py-4">
//                       <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">
//                         {staff.role}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 font-bold text-slate-600">
//                       ₹{staff.salary.toLocaleString()}
//                     </td>
//                     <td className="px-6 py-4">
//                       <span className="font-black text-emerald-600 text-lg">
//                         {staff.daysPresentThisMonth || 0}
//                       </span>
//                       <span className="text-slate-400 text-xs font-bold uppercase ml-1">
//                         days
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 font-black text-blue-600">
//                       ₹{(staff.estimatedPayout || 0).toLocaleString()}
//                     </td>
//                     <td className="px-6 py-4 text-center space-x-2 whitespace-nowrap">
//                       <button
//                         onClick={() => setActiveAttendanceStaff(staff)}
//                         className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-black uppercase transition"
//                       >
//                         <CheckSquare size={14} /> Attd.
//                       </button>
//                       <button
//                         onClick={() => handleRunPayroll(staff)}
//                         className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-black uppercase transition"
//                       >
//                         <Banknote size={14} /> Pay
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* MOBILE CARDS */}
//         <div className="md:hidden divide-y divide-slate-100">
//           {staffList.length === 0 ? (
//             <div className="p-8 text-center text-slate-400 font-bold">
//               No staff found.
//             </div>
//           ) : (
//             staffList.map((staff) => (
//               <div key={staff._id} className="p-4 bg-white">
//                 <div className="flex justify-between items-start mb-3">
//                   <div>
//                     <h3 className="font-black text-slate-900 text-lg">
//                       {staff.name}
//                     </h3>
//                     <span className="inline-block mt-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-wider">
//                       {staff.role}
//                     </span>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
//                       Base
//                     </p>
//                     <p className="font-bold text-slate-600">
//                       ₹{staff.salary.toLocaleString()}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex justify-between items-end bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
//                   <div>
//                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
//                       Attd (Month)
//                     </p>
//                     <p className="font-black text-emerald-600 text-xl leading-none">
//                       {staff.daysPresentThisMonth || 0}{" "}
//                       <span className="text-[10px] text-slate-400">DAYS</span>
//                     </p>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
//                       Est. Payout
//                     </p>
//                     <p className="font-black text-blue-600 text-xl leading-none">
//                       ₹{(staff.estimatedPayout || 0).toLocaleString()}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => setActiveAttendanceStaff(staff)}
//                     className="flex-1 flex justify-center items-center gap-2 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-black uppercase transition"
//                   >
//                     <CheckSquare size={16} /> Mark Attd
//                   </button>
//                   <button
//                     onClick={() => handleRunPayroll(staff)}
//                     className="flex-1 flex justify-center items-center gap-2 py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-black uppercase transition"
//                   >
//                     <Banknote size={16} /> Run Pay
//                   </button>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       {isStaffModalOpen && (
//         <StaffModal
//           onClose={() => setIsStaffModalOpen(false)}
//           refreshData={fetchStaff}
//         />
//       )}
//       {activeAttendanceStaff && (
//         <AttendanceModal
//           staff={activeAttendanceStaff}
//           onClose={() => setActiveAttendanceStaff(null)}
//           refreshData={fetchStaff}
//         />
//       )}
//     </div>
//   );
// };
// export default StaffManager;

import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";
import { Users, Plus, CheckSquare, Banknote, Mail, Trash2 } from "lucide-react";
import StaffModal from "./StaffModal";
import AttendanceModal from "./AttendanceModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext"; // Bring in auth to check if user is Owner

const StaffManager = () => {
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth(); // Need this to hide the delete button from Managers

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [activeAttendanceStaff, setActiveAttendanceStaff] = useState(null);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/staff");
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

  const handleRunPayroll = async (staff) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    if (
      !window.confirm(
        `Run payroll for ${staff.name} for Month ${currentMonth}/${currentYear}? This will log a business Expense.`,
      )
    )
      return;

    const loadingToast = toast.loading(
      `Processing payroll for ${staff.name}...`,
    );
    try {
      const payload = { month: currentMonth, year: currentYear }; // Backend calculates the rest!

      const response = await api.post(
        `/api/staff/${staff._id}/payroll`,
        payload,
      );
      toast.success(`Payroll processed! Payout: ₹${response.data.payout}`, {
        id: loadingToast,
      });

      setTimeout(() => {
        navigate("/expenses");
      }, 1500);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process payroll", {
        id: loadingToast,
      });
    }
  };

  // 🔥 NEW: The Ghost Employee Fix
  const handleDeleteStaff = async (staff) => {
    if (
      !window.confirm(
        `⚠️ WARNING: Are you sure you want to fire ${staff.name}? This will permanently delete their HR record and revoke their POS login access.`,
      )
    )
      return;

    const loadingToast = toast.loading(`Revoking access for ${staff.name}...`);
    try {
      await api.delete(`/api/staff/${staff._id}`);
      toast.success(`${staff.name} has been removed from the system.`, {
        id: loadingToast,
      });
      fetchStaff(); // Refresh the list
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove staff", {
        id: loadingToast,
      });
    }
  };

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20 text-slate-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg font-bold">Loading HR Records...</p>
      </div>
    );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto bg-slate-50 font-sans pb-24 md:pb-8">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
            <Users className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Staff & Payroll
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest mt-1">
              Manage team & attendance
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsStaffModalOpen(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm shadow-lg shadow-blue-200 transition active:scale-95"
        >
          <Plus size={18} /> ADD STAFF
        </button>
      </div>

      {/* DATA AREA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Base Salary</th>
                <th className="px-6 py-4">Attendance (Mth)</th>
                <th className="px-6 py-4">Est. Payout</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-slate-400 font-bold"
                  >
                    No staff members found.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr
                    key={staff._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{staff.name}</p>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <Mail size={10} /> {staff.email || "No Access"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600">
                      ₹{staff.salary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-emerald-600 text-lg">
                        {staff.daysPresentThisMonth || 0}
                      </span>
                      <span className="text-slate-400 text-xs font-bold uppercase ml-1">
                        days
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-blue-600">
                      ₹{(staff.estimatedPayout || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setActiveAttendanceStaff(staff)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-black uppercase transition"
                      >
                        <CheckSquare size={14} /> Attd.
                      </button>
                      <button
                        onClick={() => handleRunPayroll(staff)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-black uppercase transition"
                      >
                        <Banknote size={14} /> Pay
                      </button>
                      {/* 🔥 NEW: Delete Button (Only visible to Owner) */}
                      {user?.role === "Owner" && (
                        <button
                          onClick={() => handleDeleteStaff(staff)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-black uppercase transition ml-2"
                          title="Fire Staff"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden divide-y divide-slate-100">
          {staffList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold">
              No staff found.
            </div>
          ) : (
            staffList.map((staff) => (
              <div key={staff._id} className="p-4 bg-white relative">
                {/* 🔥 NEW: Mobile Delete Button (Only visible to Owner) */}
                {user?.role === "Owner" && (
                  <button
                    onClick={() => handleDeleteStaff(staff)}
                    className="absolute top-4 right-4 p-2 text-red-400 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                )}

                <div className="flex justify-between items-start mb-3 pr-10">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">
                      {staff.name}
                    </h3>
                    <span className="inline-block mt-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-wider">
                      {staff.role}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Attd (Month)
                    </p>
                    <p className="font-black text-emerald-600 text-xl leading-none">
                      {staff.daysPresentThisMonth || 0}{" "}
                      <span className="text-[10px] text-slate-400">DAYS</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Est. Payout
                    </p>
                    <p className="font-black text-blue-600 text-xl leading-none">
                      ₹{(staff.estimatedPayout || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveAttendanceStaff(staff)}
                    className="flex-1 flex justify-center items-center gap-2 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-black uppercase transition"
                  >
                    <CheckSquare size={16} /> Mark Attd
                  </button>
                  <button
                    onClick={() => handleRunPayroll(staff)}
                    className="flex-1 flex justify-center items-center gap-2 py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-black uppercase transition"
                  >
                    <Banknote size={16} /> Run Pay
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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
