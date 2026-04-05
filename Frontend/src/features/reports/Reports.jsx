import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Receipt,
  Calculator,
  PiggyBank,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const Reports = () => {
  const [activeReport, setActiveReport] = useState("P&L");
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
    } else {
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

  // ==========================================
  // EXPORT ENGINE: PDF GENERATION
  // ==========================================
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(30, 58, 138); // Blue
      doc.text("OMICRA FINANCIAL REPORT", 14, 22);
      
      // Meta Data
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Report Type: ${activeReport}`, 14, 30);
      doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 35);
      doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 40);

      // Table Data
      const tableColumn = ["Metric", "Amount"];
      const tableRows = [
        ["Total Orders Processed", data.orders.toString()],
        ["Gross Sales Revenue", `Rs. ${data.revenue.toLocaleString()}`],
        ["GST Tax Collected", `Rs. ${data.taxCollected.toLocaleString()}`],
        ["Operating Expenses", `- Rs. ${data.expenses.toLocaleString()}`],
      ];

      // 🔥 FIX 2: Call autoTable as a standalone function, passing 'doc' as the first argument
      autoTable(doc, {
        startY: 50,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138] },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      });

      // Net Profit Box
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setTextColor(data.profit >= 0 ? 22 : 220, data.profit >= 0 ? 163 : 38, data.profit >= 0 ? 74 : 38); // Green or Red
      doc.text(`NET PROFIT: Rs. ${data.profit.toLocaleString()}`, 14, finalY);

      doc.save(`Omicra_${activeReport.replace(/\s+/g, '_')}_${startDate}.pdf`);
      toast.success("PDF Downloaded successfully!");
    } catch (error) {
      // Added a console log here just in case!
      console.error("PDF Generation Error:", error); 
      toast.error("Failed to generate PDF");
    }
  };

  // ==========================================
  // EXPORT ENGINE: EXCEL GENERATION
  // ==========================================
  const handleExportExcel = () => {
    try {
      const exportData = [
        { Metric: "Report Type", Value: activeReport },
        { Metric: "Start Date", Value: startDate },
        { Metric: "End Date", Value: endDate },
        { Metric: "", Value: "" }, // Blank Row
        { Metric: "Total Orders Processed", Value: data.orders },
        { Metric: "Gross Sales Revenue (Rs)", Value: data.revenue },
        { Metric: "GST Tax Collected (Rs)", Value: data.taxCollected },
        { Metric: "Operating Expenses (Rs)", Value: data.expenses },
        { Metric: "NET PROFIT (Rs)", Value: data.profit },
      ];

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Report");

      // Auto-size columns slightly
      worksheet["!cols"] = [{ wch: 30 }, { wch: 20 }];

      XLSX.writeFile(
        workbook,
        `Omicra_${activeReport.replace(/\s+/g, "_")}_${startDate}.xlsx`,
      );
      toast.success("Excel Downloaded successfully!");
    } catch (error) {
      toast.error("Failed to generate Excel file");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto bg-slate-50 font-sans pb-24 md:pb-8 custom-scrollbar">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
            <TrendingUp className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Financial Reports
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest mt-1">
              Ledgers, Taxes & P&L
            </p>
          </div>
        </div>

        <div className="flex w-full md:w-auto gap-2">
          <button
            onClick={handleExportPDF}
            className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-100 shadow-sm transition active:scale-95"
          >
            <FileText size={16} className="text-red-500" /> PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-100 shadow-sm transition active:scale-95"
          >
            <Download size={16} className="text-emerald-600" /> EXCEL
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8 flex flex-col xl:flex-row justify-between items-center gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full xl:w-auto overflow-x-auto hide-scrollbar">
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
              className={`shrink-0 px-5 py-2 rounded-lg text-sm font-black whitespace-nowrap transition-all ${activeReport === type ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-800"}`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
          <div className="flex w-full sm:w-auto items-center gap-2 border border-slate-200 px-4 py-2.5 rounded-xl bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-sm font-bold text-slate-700 outline-none bg-transparent"
            />
          </div>
          <span className="text-slate-400 font-black text-xs uppercase hidden sm:block">
            to
          </span>
          <div className="flex w-full sm:w-auto items-center gap-2 border border-slate-200 px-4 py-2.5 rounded-xl bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-sm font-bold text-slate-700 outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* REPORT CARD */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm font-bold uppercase tracking-widest">
            Crunching Numbers...
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="px-6 md:px-10 py-6 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-xl font-black">{activeReport} Statement</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                OMICRA FINANCIALS
              </p>
            </div>
            <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg font-bold text-blue-400 uppercase tracking-wider">
              {startDate} <span className="text-slate-500 mx-1">/</span>{" "}
              {endDate}
            </span>
          </div>

          <div className="p-6 md:p-10 space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-dashed border-slate-200 group">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                <Receipt size={20} />
              </div>
              <div className="flex-1">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Orders Processed
                </span>
                <span className="block font-black text-slate-900 text-xl">
                  {data.orders}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 pb-4 border-b border-dashed border-slate-200 group">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                <PiggyBank size={20} />
              </div>
              <div className="flex-1 flex justify-between items-center">
                <span className="block text-sm font-bold text-slate-700">
                  Gross Sales Revenue
                </span>
                <span className="font-black text-slate-900 text-xl">
                  ₹{data.revenue.toLocaleString()}
                </span>
              </div>
            </div>

            {(activeReport === "GST Report" || activeReport === "P&L") && (
              <div className="flex items-center gap-4 pb-4 border-b border-dashed border-slate-200 group">
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                  <Calculator size={20} />
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <span className="block text-sm font-bold text-slate-700">
                    GST Tax Collected
                  </span>
                  <span className="font-black text-slate-500 text-xl">
                    ₹{data.taxCollected.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {(activeReport === "P&L" || activeReport === "Monthly Sales") && (
              <div className="flex items-center gap-4 pb-4 border-b border-dashed border-slate-200">
                <div className="flex-1 flex justify-between items-center pl-16">
                  <span className="block text-sm font-bold text-slate-700">
                    Operating Expenses
                  </span>
                  <span className="font-black text-red-500 text-xl">
                    - ₹{data.expenses.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div
              className={`mt-8 flex flex-col sm:flex-row justify-between items-center p-6 rounded-2xl border-2 ${data.profit >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"} transform hover:-translate-y-1 transition-transform shadow-sm`}
            >
              <div>
                <span
                  className={`block text-[10px] font-black uppercase tracking-widest ${data.profit >= 0 ? "text-emerald-500" : "text-red-500"}`}
                >
                  Final Result
                </span>
                <span className="font-black text-slate-900 text-xl">
                  NET PROFIT
                </span>
              </div>
              <span
                className={`font-black text-4xl mt-2 sm:mt-0 ${data.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}
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
