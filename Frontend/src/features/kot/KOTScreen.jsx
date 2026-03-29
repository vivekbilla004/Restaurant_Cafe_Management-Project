import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";
import { ChefHat, Clock, ArrowLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext"; // Added to protect the Exit button

const KOTScreen = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);

  const fetchKOTOrders = async () => {
    try {
      // 🔒 LOOPHOLE 1 CLOSED: We hit the specific Kitchen route.
      // The Database filters it, saving massive amounts of RAM and Bandwidth.
      const response = await api.get("/api/orders/kitchen");
      setOrders(response.data);
    } catch (err) {
      console.error("Failed to load tickets");
    }
  };

  useEffect(() => {
    fetchKOTOrders();
    // Refreshes every 5 seconds so cooks don't have to touch the screen
    const interval = setInterval(fetchKOTOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateKitchenStatus = async (orderId, newStatus) => {
    try {
      // 🔒 LOOPHOLE 2 CLOSED: Hit the strict kitchen-status route!
      // This prevents the kitchen from accidentally marking orders as "Paid"
      await api.put(`/api/orders/${orderId}/kitchen-status`, {
        status: newStatus,
      });
      toast.success(`Order marked as ${newStatus}`);
      fetchKOTOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Status update failed");
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
    <div className="p-8 h-screen bg-slate-950 overflow-y-auto">
      <Toaster position="top-right" />

      {/* KOT Header */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          {/* Only Owners/Managers get the back button. Cooks shouldn't leave this screen! */}
          {(user?.role === "Owner" || user?.role === "Manager") && (
            <button
              onClick={() => navigate("/dashboard")}
              className="text-slate-500 hover:text-white transition bg-slate-800 p-2 rounded-lg"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <ChefHat size={32} className="text-blue-500" /> Kitchen Display
            System
          </h1>
          {(user?.role === "Kitchen") && (
            <div className="flex gap-4">
              <button
                onClick={() => {
                  logout(); // Clears the token and user state
                  navigate("/login"); // Sends them back to login securely
                }}
                className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg transition-all border border-red-500/20 font-bold"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-4 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
            <span className="text-sm text-slate-300 font-semibold uppercase tracking-wider">
              New
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span>
            <span className="text-sm text-slate-300 font-semibold uppercase tracking-wider">
              Preparing
            </span>
          </div>
          
        </div>
      </div>

      {/* Ticket Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 items-start">
        {orders.length === 0 ? (
          <div className="col-span-full text-center py-32">
            <p className="text-slate-600 text-2xl font-black uppercase tracking-widest">
              No Active Orders
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className={`rounded-xl border-t-4 border-x border-b border-x-slate-800 border-b-slate-800 shadow-2xl overflow-hidden flex flex-col ${getCardStyle(order.status)}`}
            >
              <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-white">
                    {order.orderType === "DineIn"
                      ? `Table ${order.tableId?.tableNumber || order.table?.tableNumber || "?"}`
                      : order.orderType}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 uppercase mt-1">
                    #ORD-{order._id.slice(-4)}
                  </p>
                </div>
                <span className="bg-slate-950 px-2 py-1.5 rounded-md border border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 shadow-inner">
                  <Clock size={14} className="text-slate-500" />{" "}
                  {new Date(order.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="p-4 flex-1">
                <ul className="space-y-3">
                  {order.items?.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-start">
                      <span className="font-semibold text-slate-200 text-[15px]">
                        {item.menuItemId?.name || item.name || "Unknown Item"}
                      </span>
                      <span className="font-black text-lg text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        x{item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status Action Buttons */}
              <div className="p-3 bg-slate-950 border-t border-slate-800">
                {order.status === "Pending" || order.status === "Received" ? (
                  <button
                    onClick={() => updateKitchenStatus(order._id, "Preparing")}
                    className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-black rounded-lg transition text-sm uppercase tracking-wide"
                  >
                    Start Preparing
                  </button>
                ) : (
                  <button
                    onClick={() => updateKitchenStatus(order._id, "Ready")}
                    className="w-full py-3 bg-green-500 hover:bg-green-400 text-green-950 font-black rounded-lg transition text-sm uppercase tracking-wide"
                  >
                    Mark Ready
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default KOTScreen;
