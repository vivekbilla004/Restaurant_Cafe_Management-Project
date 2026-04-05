import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../store/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Users,
  LayoutDashboard,
  Link as LinkIcon,
  CheckCircle,
  ArrowRight,
  X,
  CalendarDays,
  Coffee,
  AlertCircle,
} from "lucide-react";
import TableModal from "./TableModal";
import usePosStore from "../../store/posStore";

const TablesManager = () => {
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setSelectedTable, setOrderType, clearCart } = usePosStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTable, setActiveTable] = useState(null);

  const [isMergeMode, setIsMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState([]);
  const [reserveForm, setReserveForm] = useState({ name: "", time: "" });

  const isCashier = user?.role === "Cashier";
  const isFloorStaff = ["Owner", "Manager", "Waiter"].includes(user?.role);
  const isAdmin = ["Owner", "Manager"].includes(user?.role);

  const fetchTables = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/tables");
      setTables(response.data);
    } catch (err) {
      toast.error("Failed to load floor plan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const toggleMergeSelection = (tableId) => {
    if (selectedForMerge.includes(tableId)) {
      setSelectedForMerge(selectedForMerge.filter((id) => id !== tableId));
    } else {
      setSelectedForMerge([...selectedForMerge, tableId]);
    }
  };

  const executeMerge = async () => {
    if (selectedForMerge.length < 2)
      return toast.error("Select at least 2 tables to merge.");
    const loadingToast = toast.loading("Merging tables...");
    try {
      await api.post("/api/tables/merge", { tableIds: selectedForMerge });
      toast.success("Tables merged successfully!", { id: loadingToast });
      setIsMergeMode(false);
      setSelectedForMerge([]);
      fetchTables();
    } catch (err) {
      toast.error("Failed to merge tables", { id: loadingToast });
    }
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    if (!reserveForm.name || !reserveForm.time)
      return toast.error("Name and time required.");
    const loadToast = toast.loading("Adding reservation...");
    try {
      await api.put(`/api/tables/${activeTable._id}/reserve`, {
        reservationName: reserveForm.name,
        reservationTime: reserveForm.time,
      });
      toast.success(`Reserved for ${reserveForm.name}`, { id: loadToast });
      setActiveTable(null);
      setReserveForm({ name: "", time: "" });
      fetchTables();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reserve table", {
        id: loadToast,
      });
    }
  };

  const updateStatus = async (status) => {
    try {
      await api.put(`/api/tables/${activeTable._id}/status`, { status });
      toast.success(`Table marked as ${status}`);
      setActiveTable(null);
      fetchTables();
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const jumpToPOS = (tableId) => {
    clearCart();
    setOrderType("DineIn");
    setSelectedTable(tableId);
    navigate("/pos");
  };

  const getTableStyle = (table) => {
    const isSelected = selectedForMerge.includes(table._id);
    const base = isSelected
      ? "ring-4 ring-blue-500 shadow-2xl scale-105 "
      : "hover:-translate-y-1 hover:shadow-lg ";

    if (table.mergedWith && table.mergedWith.length > 0)
      return base + "bg-indigo-50 border-indigo-200 text-indigo-800";

    switch (table.status) {
      case "Available":
        return base + "bg-emerald-50 border-emerald-200 text-emerald-800";
      case "Occupied":
        return (
          base +
          "bg-red-50 border-red-200 text-red-800 shadow-red-500/20 shadow-md"
        );
      case "Reserved":
        return base + "bg-amber-50 border-amber-200 text-amber-800";
      default:
        return base + "bg-white border-slate-200 text-slate-800";
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto bg-slate-50 font-sans pb-24 md:pb-8 custom-scrollbar">
      <Toaster position="top-right" />

      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Floor Plan
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest mt-1">
              Live Table Management
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {isAdmin && (
            <>
              {isMergeMode ? (
                <div className="flex gap-2 w-full md:w-auto animate-in slide-in-from-right">
                  <button
                    onClick={() => {
                      setIsMergeMode(false);
                      setSelectedForMerge([]);
                    }}
                    className="flex-1 md:flex-none px-4 py-3 bg-white border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-50 transition shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeMerge}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition active:scale-95"
                  >
                    <CheckCircle size={16} /> Merge Selected
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsMergeMode(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-50 transition shadow-sm active:scale-95"
                >
                  <LinkIcon size={16} /> Merge
                </button>
              )}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition active:scale-95"
              >
                <Plus size={16} /> Add Table
              </button>
            </>
          )}
        </div>
      </div>

      {/* QUICK STATUS LEGEND */}
      <div className="flex flex-wrap gap-3 md:gap-6 mb-6 px-2">
        <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
          <span className="w-3 h-3 rounded-full bg-emerald-400"></span>{" "}
          Available
        </div>
        <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
          <span className="w-3 h-3 rounded-full bg-red-500"></span> Occupied
          (Eating)
        </div>
        <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
          <span className="w-3 h-3 rounded-full bg-amber-400"></span> Reserved
        </div>
        <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
          <span className="w-3 h-3 rounded-full bg-indigo-400"></span> Merged
        </div>
      </div>

      {/* INTERACTIVE TABLE GRID */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="font-bold text-sm uppercase tracking-widest">
            Loading Floor Plan...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {tables.map((table) => (
            <div
              key={table._id}
              onClick={() => {
                if (isMergeMode) toggleMergeSelection(table._id);
                else setActiveTable(table);
              }}
              className={`relative cursor-pointer border-2 rounded-3xl p-5 flex flex-col items-center justify-center aspect-square transition-all duration-200 ${getTableStyle(table)}`}
            >
              {table.mergedWith && table.mergedWith.length > 0 && (
                <LinkIcon
                  size={16}
                  className="absolute top-4 left-4 opacity-60"
                />
              )}

              <h3 className="text-3xl md:text-4xl font-black tracking-tight mb-2 drop-shadow-sm">
                {table.tableNumber}
              </h3>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 backdrop-blur-md rounded-full text-xs font-black shadow-sm">
                <Users size={14} className="opacity-70" /> {table.capacity}
              </div>

              {table.status === "Reserved" && table.reservationName && (
                <div className="absolute inset-x-0 bottom-3 px-2 flex flex-col items-center">
                  <span className="w-full text-[10px] font-black uppercase truncate bg-amber-100 border border-amber-200 text-amber-900 rounded px-1 py-0.5 text-center">
                    {table.reservationName}
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 mt-0.5 bg-white/50 px-2 rounded-full">
                    {new Date(table.reservationTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ACTION MODAL (Smart Router) */}
      {activeTable && !isMergeMode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Header */}
            <div
              className={`px-6 py-5 border-b border-white/20 flex justify-between items-center ${activeTable.status === "Occupied" ? "bg-red-600 text-white" : activeTable.status === "Available" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}
            >
              <div>
                <h2 className="text-2xl font-black">
                  Table {activeTable.tableNumber}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
                  {activeTable.status}
                </p>
              </div>
              <button
                onClick={() => setActiveTable(null)}
                className="p-2 hover:bg-black/10 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* --- SCENARIO 1: TABLE IS OCCUPIED (Eating) --- */}
              {activeTable.status === "Occupied" && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <Coffee size={32} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-sm font-bold text-slate-700">
                      Guests are currently dining.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Open in POS to add items or settle bill.
                    </p>
                  </div>
                  <button
                    onClick={() => jumpToPOS(activeTable._id)}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm uppercase tracking-wider flex justify-center items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition"
                  >
                    Open in POS <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {/* --- SCENARIO 2: TABLE IS AVAILABLE --- */}
              {activeTable.status === "Available" && (
                <div className="space-y-6">
                  {/* CASHIER LOCKOUT: Cashiers don't start dine-in orders */}
                  {isCashier ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <AlertCircle
                        size={32}
                        className="mx-auto text-slate-400 mb-2"
                      />
                      <p className="text-sm font-bold text-slate-700">
                        Table is empty.
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Waiters handle seating and new orders.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => jumpToPOS(activeTable._id)}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm uppercase tracking-wider flex justify-center items-center gap-2 shadow-lg shadow-emerald-200 active:scale-95 transition"
                    >
                      Start New Order <ArrowRight size={18} />
                    </button>
                  )}

                  {/* Floor Staff can add reservations */}
                  {isFloorStaff && (
                    <div className="border-t border-slate-100 pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <CalendarDays size={18} className="text-slate-400" />
                        <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">
                          Future Reservation
                        </h3>
                      </div>
                      <form onSubmit={handleReserve} className="space-y-3">
                        <input
                          type="text"
                          placeholder="Customer Name"
                          required
                          value={reserveForm.name}
                          onChange={(e) =>
                            setReserveForm({
                              ...reserveForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                        />
                        <input
                          type="datetime-local"
                          required
                          value={reserveForm.time}
                          onChange={(e) =>
                            setReserveForm({
                              ...reserveForm,
                              time: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-slate-700"
                        />
                        <button
                          type="submit"
                          className="w-full py-3.5 bg-amber-500 text-white font-black rounded-xl hover:bg-amber-600 shadow-md transition text-sm uppercase tracking-wider active:scale-95"
                        >
                          Reserve Table
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* --- SCENARIO 3: TABLE IS RESERVED --- */}
              {activeTable.status === "Reserved" && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">
                      Reserved For
                    </p>
                    <p className="text-lg font-black text-amber-900">
                      {activeTable.reservationName}
                    </p>
                    <p className="text-sm font-bold text-amber-700 mt-1">
                      {new Date(activeTable.reservationTime).toLocaleString()}
                    </p>
                  </div>

                  {isFloorStaff && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => jumpToPOS(activeTable._id)}
                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md transition active:scale-95"
                      >
                        Seat Guests
                      </button>
                      <button
                        onClick={() => updateStatus("Available")}
                        className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-xl text-xs uppercase tracking-wider hover:bg-slate-50 transition active:scale-95"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <TableModal
          onClose={() => setIsAddModalOpen(false)}
          refreshData={fetchTables}
        />
      )}
    </div>
  );
};

export default TablesManager;
