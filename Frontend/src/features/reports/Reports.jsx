import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";
import { FileText, Download, Calendar } from "lucide-react";
// Note: In a real environment, you run `npm install jspdf jspdf-autotable xlsx`
// to activate these export functions. They are mocked via Toast here to keep it lean.

const Reports = () => {
  const [activeReport, setActiveReport] = useState("P&L"); // Daily, Weekly, Monthly, GST, P&L
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [data, setData] = useState({
    revenue: 0,
    taxCollected: 0,
    orders: 0,
    expenses: 0,
    profit: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // --- Real-World Logic ---
  // When a user clicks "Daily", "Weekly", we automatically shift the Date Pickers!
  const handleReportTypeChange = (type) => {
    setActiveReport(type);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (type === "Daily Sales") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === "Weekly Sales") {
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      setStartDate(lastWeek.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (
      type === "Monthly Sales" ||
      type === "P&L" ||
      type === "GST Report"
    ) {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      setStartDate(firstDay);
      setEndDate(todayStr);
    }
  };

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(
          `/api/reports/sales?startDate=${startDate}&endDate=${endDate}`,
        );
        setData(res.data);
      } catch (err) {
        toast.error("Failed to fetch reports");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, [startDate, endDate]);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto bg-slate-50 font-sans">
      <Toaster />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Financial Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Export ledgers, tax documents, and Profit & Loss statements.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.success("PDF Export Started")}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 shadow-sm transition"
          >
            <FileText size={16} className="text-red-500" /> PDF
          </button>
          <button
            onClick={() => toast.success("Excel Export Started")}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 shadow-sm transition"
          >
            <Download size={16} className="text-emerald-600" /> Excel
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex bg-slate-100 p-1 rounded-lg w-full lg:w-auto overflow-x-auto">
          {[
            "Daily Sales",
            "Weekly Sales",
            "Monthly Sales",
            "GST Report",
            "P&L",
          ].map((type) => (
            <button
              key={type}
              onClick={() => handleReportTypeChange(type)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold whitespace-nowrap transition ${activeReport === type ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-slate-200 px-3 py-1.5 rounded-lg bg-white">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm font-bold text-slate-700 outline-none"
            />
          </div>
          <span className="text-slate-400 font-bold text-sm">to</span>
          <div className="flex items-center gap-2 border border-slate-200 px-3 py-1.5 rounded-lg bg-white">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm font-bold text-slate-700 outline-none"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-500 font-medium text-sm">
          Generating Report Data...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-3xl mx-auto">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-800 text-white flex justify-between items-center">
            <h3 className="font-bold">{activeReport} Statement</h3>
            <span className="text-xs bg-white/20 px-2 py-1 rounded font-medium">
              {startDate} to {endDate}
            </span>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-200">
              <span className="font-semibold text-slate-600 text-sm">
                Total Orders Processed
              </span>
              <span className="font-bold text-slate-900">{data.orders}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-200">
              <span className="font-semibold text-slate-600 text-sm">
                Gross Sales Revenue
              </span>
              <span className="font-black text-slate-900">
                ₹{data.revenue.toLocaleString()}
              </span>
            </div>

            {/* Specifically Highlights GST if that report is selected */}
            {(activeReport === "GST Report" || activeReport === "P&L") && (
              <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-200">
                <span className="font-semibold text-slate-600 text-sm">
                  GST Tax Collected
                </span>
                <span className="font-bold text-slate-500">
                  ₹{data.taxCollected.toLocaleString()}
                </span>
              </div>
            )}

            {(activeReport === "P&L" || activeReport === "Monthly Sales") && (
              <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-200">
                <span className="font-semibold text-slate-600 text-sm">
                  Operating Expenses
                </span>
                <span className="font-bold text-red-600">
                  -₹{data.expenses.toLocaleString()}
                </span>
              </div>
            )}

            <div
              className={`flex justify-between items-center p-4 rounded-xl border ${data.profit >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}
            >
              <span className="font-black text-slate-900">NET PROFIT</span>
              <span
                className={`font-black text-xl ${data.profit >= 0 ? "text-emerald-700" : "text-red-700"}`}
              >
                ₹{data.profit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Reports;
