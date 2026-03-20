// import React, { useState, useEffect } from "react";
// import api from "../../lib/api";
// import toast, { Toaster } from "react-hot-toast";
// import { Banknote, Plus, Calendar } from "lucide-react";
// import { useLocation } from "react-router-dom";

// const ExpenseManager = () => {
//   const [expenses, setExpenses] = useState([]);
//   const [totalExpenses, setTotalExpenses] = useState(0);
//   const [isLoading, setIsLoading] = useState(true);
//   const location = useLocation();
//   const [showModal, setShowModal] = useState(false);
//   const [formData, setFormData] = useState({
//     title: "",
//     amount: "",
//     category: "Rent",
//     date: new Date().toISOString().split("T")[0],
//   });

//   // Date Filters
//   const [startDate, setStartDate] = useState(
//     new Date(new Date().getFullYear(), new Date().getMonth(), 1)
//       .toISOString()
//       .split("T")[0],
//   );
//   const [endDate, setEndDate] = useState(
//     new Date().toISOString().split("T")[0],
//   );

//   const fetchExpenses = async () => {
//     setIsLoading(true);
//     try {
//       // Adding standard URL encoding just in case
//       const url = `/api/expenses?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
//       const res = await api.get(url);

//       setExpenses(res.data.expenses);
//       setTotalExpenses(res.data.totalExpenses);
//     } catch (err) {
//       toast.error("Failed to load expenses");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchExpenses();
//     window.addEventListener("focus", fetchExpenses);
//     return () => window.removeEventListener("focus", fetchExpenses);
//   }, [startDate, endDate, location.key]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       await api.post("/api/expenses", {
//         ...formData,
//         amount: Number(formData.amount),
//       });
//       toast.success("Expense recorded!");
//       setShowModal(false);
//       fetchExpenses();
//     } catch (err) {
//       toast.error("Failed to save expense");
//     }
//   };

//   const categories = [
//     "Rent",
//     "Salary",
//     "Purchase",
//     "Utility",
//     "Marketing",
//     "Other",
//   ];

//   return (
//     <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto bg-slate-50 font-sans">
//       <Toaster />
//       <div className="flex justify-between items-center mb-8">
//         <div>
//           <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
//             <Banknote className="text-red-500" /> Operational Expenses
//           </h1>
//         </div>
//         <button
//           onClick={() => setShowModal(true)}
//           className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition shadow-sm"
//         >
//           <Plus size={18} /> Log Expense
//         </button>
//       </div>

//       {/* Date Filter & Total */}
//       <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
//         <div className="flex items-center gap-3">
//           <input
//             type="date"
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//             className="p-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none"
//           />
//           <span className="text-slate-400 font-bold">to</span>
//           <input
//             type="date"
//             value={endDate}
//             onChange={(e) => setEndDate(e.target.value)}
//             className="p-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none"
//           />
//         </div>
//         <div className="text-right">
//           <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
//             Total Expenses (Selected Period)
//           </p>
//           <p className="text-3xl font-black text-red-600">
//             ₹{totalExpenses.toLocaleString()}
//           </p>
//         </div>
//       </div>

//       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
//         {isLoading ? (
//           <div className="p-10 text-center text-slate-500">Loading...</div>
//         ) : (
//           <table className="w-full text-left">
//             <thead>
//               <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
//                 <th className="px-6 py-4 font-semibold">Date</th>
//                 <th className="px-6 py-4 font-semibold">Expense Title</th>
//                 <th className="px-6 py-4 font-semibold">Category</th>
//                 <th className="px-6 py-4 font-semibold text-right">Amount</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100">
//               {expenses.length === 0 ? (
//                 <tr>
//                   <td colSpan="4" className="p-8 text-center text-slate-400">
//                     No expenses recorded for this period.
//                   </td>
//                 </tr>
//               ) : (
//                 expenses.map((exp) => (
//                   <tr key={exp._id} className="hover:bg-slate-50">
//                     <td className="px-6 py-4 font-medium text-slate-600 text-sm">
//                       {new Date(exp.date).toLocaleDateString()}
//                     </td>
//                     <td className="px-6 py-4 font-bold text-slate-900 text-sm">
//                       {exp.title}
//                     </td>
//                     <td className="px-6 py-4">
//                       <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-bold border border-slate-200">
//                         {exp.category}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 font-black text-slate-900 text-right">
//                       ₹{exp.amount.toLocaleString()}
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {/* Add Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
//             <h2 className="text-lg font-bold text-slate-900 mb-6">
//               Log New Expense
//             </h2>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <input
//                 type="text"
//                 required
//                 value={formData.title}
//                 onChange={(e) =>
//                   setFormData({ ...formData, title: e.target.value })
//                 }
//                 className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-medium"
//                 placeholder="Description (e.g., Staff Salary)"
//               />
//               <input
//                 type="number"
//                 required
//                 value={formData.amount}
//                 onChange={(e) =>
//                   setFormData({ ...formData, amount: e.target.value })
//                 }
//                 className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-medium"
//                 placeholder="Amount (₹)"
//               />
//               <select
//                 value={formData.category}
//                 onChange={(e) =>
//                   setFormData({ ...formData, category: e.target.value })
//                 }
//                 className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-medium"
//               >
//                 {categories.map((c) => (
//                   <option key={c}>{c}</option>
//                 ))}
//               </select>
//               <input
//                 type="date"
//                 required
//                 value={formData.date}
//                 onChange={(e) =>
//                   setFormData({ ...formData, date: e.target.value })
//                 }
//                 className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-medium"
//               />
//               <div className="flex gap-2 pt-2">
//                 <button
//                   type="button"
//                   onClick={() => setShowModal(false)}
//                   className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 text-sm"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 text-sm"
//                 >
//                   Save Expense
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
// export default ExpenseManager;

import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";
import { Banknote, Plus, Calendar } from "lucide-react";
import { useLocation } from "react-router-dom"; // THE MAGIC AUTO-REFRESH HOOK

const ExpenseManager = () => {
  const location = useLocation(); // Detects when you click the Sidebar tab
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "Rent",
    date: new Date().toISOString().split("T")[0],
  });

  // Default to 1st of the month to Today
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(
        `/api/expenses?startDate=${startDate}&endDate=${endDate}`,
      );
      setExpenses(res.data.expenses);
      setTotalExpenses(res.data.totalExpenses);
    } catch (err) {
      toast.error("Failed to load expenses");
    } finally {
      setIsLoading(false);
    }
  };

  // THE FIX: location.key forces the page to grab fresh data from the DB
  // every single time you navigate to this screen!
  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate, location.key]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/expenses", {
        ...formData,
        amount: Number(formData.amount),
      });
      toast.success("Expense recorded!");
      setShowModal(false);
      setFormData({
        title: "",
        amount: "",
        category: "Rent",
        date: new Date().toISOString().split("T")[0],
      });
      fetchExpenses(); // Refresh table immediately after manual add
    } catch (err) {
      toast.error("Failed to save expense");
    }
  };

  const categories = [
    "Rent",
    "Salary",
    "Purchase",
    "Utility",
    "Marketing",
    "Other",
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto bg-slate-50 font-sans">
      <Toaster />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Banknote className="text-red-500" /> Operational Expenses
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition shadow-sm"
        >
          <Plus size={18} /> Log Expense
        </button>
      </div>

      {/* Date Filter & Total */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none"
          />
          <span className="text-slate-400 font-bold">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none"
          />
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Total Expenses
          </p>
          <p className="text-3xl font-black text-red-600">
            ₹{totalExpenses.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500">
            Loading Ledgers...
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Expense Title</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-400">
                    No expenses recorded for this period.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-600 text-sm">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                      {exp.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-bold border border-slate-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 text-right">
                      ₹{exp.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">
              Log New Expense
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-medium"
                placeholder="Description (e.g., Electricity)"
              />
              <input
                type="number"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-medium"
                placeholder="Amount (₹)"
              />
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-medium"
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-medium"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 text-sm"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManager;
