import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";
import { ChefHat, Clock, ArrowLeft, LogOut, AlertOctagon, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext";

const KOTScreen = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  
  // 🔥 NEW: State for the Out-Of-Stock Kitchen Alarm
  const [stockAlert, setStockAlert] = useState(null);

  const fetchKOTOrders = async () => {
    try {
      const response = await api.get("/api/orders/kitchen");
      setOrders(response.data);
    } catch (err) {
      console.error("Failed to load tickets");
    }
  };

  useEffect(() => {
    fetchKOTOrders();
    const interval = setInterval(fetchKOTOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateKitchenStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/api/orders/${orderId}/kitchen-status`, {
        status: newStatus,
      });
      toast.success(`Order marked as ${newStatus}`);
      fetchKOTOrders();
    } catch (err) {
      // 🔥 THE SHIELD: If backend says Out of Stock, trigger the Red Modal!
      if (err.response?.data?.code === 'OUT_OF_STOCK' || err.response?.status === 400) {
         setStockAlert({
           title: "INVENTORY DEPLETED",
           message: err.response?.data?.message || "You do not have enough raw materials to prepare this order.",
           orderId: orderId
         });
      } else {
        toast.error(err.response?.data?.message || "Status update failed");
      }
    }
  };

  const getCardStyle = (status) => {
    switch (status) {
      case "Pending":
      case "Received":
        return "border-t-red-500 bg-slate-900";
      case "Preparing":
        return "border-t-yellow-500 bg-slate-900";
      default:
        return "border-t-slate-700 bg-slate-900";
    }
  };

  return (
    <div className="p-4 md:p-8 h-[100dvh] bg-slate-950 overflow-y-auto font-sans custom-scrollbar">
      <Toaster position="top-right" />

      {/* KOT Header - Made Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 pb-4 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            {(user?.role === "Owner" || user?.role === "Manager") && (
              <button
                onClick={() => navigate("/dashboard")}
                className="text-slate-500 hover:text-white transition bg-slate-800 p-2 rounded-lg"
              >
                <ArrowLeft size={20} className="md:w-6 md:h-6" />
              </button>
            )}
            <h1 className="text-xl md:text-3xl font-black text-white flex items-center gap-2 md:gap-3 tracking-tight">
              <ChefHat className="text-blue-500 w-6 h-6 md:w-8 md:h-8" /> Kitchen Display
            </h1>
          </div>

          {(user?.role === "Kitchen") && (
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-all border border-red-500/20 font-bold text-sm md:text-base"
            >
              <LogOut size={16} className="md:w-5 md:h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>

        <div className="flex gap-3 md:gap-4 bg-slate-900 px-3 py-2 md:px-4 md:py-2 rounded-lg border border-slate-800 w-full sm:w-auto justify-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
            <span className="text-xs md:text-sm text-slate-300 font-semibold uppercase tracking-wider">
              New
            </span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span>
            <span className="text-xs md:text-sm text-slate-300 font-semibold uppercase tracking-wider">
              Preparing
            </span>
          </div>
        </div>
      </div>

      {/* Ticket Grid - Made Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 items-start pb-10">
        {orders.length === 0 ? (
          <div className="col-span-full text-center py-20 md:py-32">
            <p className="text-slate-600 text-xl md:text-2xl font-black uppercase tracking-widest">
              No Active Orders
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className={`rounded-xl border-t-4 border-x border-b border-x-slate-800 border-b-slate-800 shadow-2xl overflow-hidden flex flex-col ${getCardStyle(order.status)} animate-in fade-in zoom-in-95 duration-200`}
            >
              <div className="p-3 md:p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-start">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-white leading-tight">
                    {order.orderType === "DineIn"
                      ? `Table ${order.tableId?.tableNumber || order.table?.tableNumber || "?"}`
                      : order.orderType}
                  </h3>
                  <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mt-1">
                    #ORD-{order._id.slice(-4)}
                  </p>
                </div>
                <span className="bg-slate-950 px-2 py-1 md:py-1.5 rounded-md border border-slate-700 text-[10px] md:text-xs font-bold text-slate-300 flex items-center gap-1.5 shadow-inner whitespace-nowrap">
                  <Clock size={12} className="text-slate-500 md:w-[14px] md:h-[14px]" />{" "}
                  {new Date(order.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="p-3 md:p-4 flex-1 max-h-48 md:max-h-60 overflow-y-auto custom-scrollbar">
                <ul className="space-y-2 md:space-y-3">
                  {order.items?.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-start gap-2">
                      <span className="font-semibold text-slate-200 text-sm md:text-[15px] leading-tight">
                        {item.menuItemId?.name || item.name || "Unknown Item"}
                      </span>
                      <span className="font-black text-base md:text-lg text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700 shrink-0">
                        x{item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status Action Buttons */}
              <div className="p-2 md:p-3 bg-slate-950 border-t border-slate-800">
                {order.status === "Pending" || order.status === "Received" ? (
                  <button
                    onClick={() => updateKitchenStatus(order._id, "Preparing")}
                    className="w-full py-3 md:py-3.5 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-black rounded-lg transition text-xs md:text-sm uppercase tracking-wider md:tracking-wide shadow-[0_0_15px_rgba(234,179,8,0.15)] active:scale-95"
                  >
                    Start Preparing
                  </button>
                ) : (
                  <button
                    onClick={() => updateKitchenStatus(order._id, "Ready")}
                    className="w-full py-3 md:py-3.5 bg-green-500 hover:bg-green-400 text-green-950 font-black rounded-lg transition text-xs md:text-sm uppercase tracking-wider md:tracking-wide shadow-[0_0_15px_rgba(34,197,94,0.15)] active:scale-95"
                  >
                    Mark Ready
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 🔥 THE HARD-STOP ALARM MODAL 🔥 */}
      {stockAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-red-500 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(239,68,68,0.3)] overflow-hidden flex flex-col items-center text-center p-6 md:p-8 animate-in zoom-in-95 duration-200">
            <div className="bg-red-500/10 p-4 rounded-full mb-4">
              <AlertOctagon size={48} className="text-red-500 animate-pulse" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-2 uppercase">
              {stockAlert.title}
            </h2>
            <p className="text-sm md:text-base text-slate-400 font-medium mb-6 md:mb-8">
              {stockAlert.message}
              <br /><br />
              <span className="text-yellow-500 font-bold">Please inform the Manager immediately to cancel or modify this order.</span>
            </p>
            <button
              onClick={() => setStockAlert(null)}
              className="w-full py-3.5 md:py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl transition uppercase tracking-widest text-xs md:text-sm active:scale-95"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default KOTScreen;