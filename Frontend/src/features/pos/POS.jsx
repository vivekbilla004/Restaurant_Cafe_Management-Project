import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";
import usePosStore from "../../store/posStore";
import { useAuth } from "../../store/AuthContext";
import {
  ShoppingBag,
  Printer,
  SplitSquareHorizontal,
  CheckCircle,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  X,
  MessageCircle,
  ChevronUp,
  Send,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const POS = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [tables, setTables] = useState([]);

  // 🔥 FIX: Default to Pay Later if DineIn, otherwise Cash
  const [paymentMode, setPaymentMode] = useState("Pay Later");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const {
    cart,
    orderType,
    selectedTable,
    discount,
    taxRate,
    runningOrderId,
    setOrderType,
    setSelectedTable,
    setDiscount,
    addToCart,
    updateQuantity,
    clearCart,
    setRunningOrderId,
    loadExistingOrder,
  } = usePosStore();

  // Auto-switch default payment mode based on Order Type
  useEffect(() => {
    if (orderType === "DineIn" && !runningOrderId) {
      setPaymentMode("Pay Later");
    } else if (paymentMode === "Pay Later" && orderType !== "DineIn") {
      setPaymentMode("Cash");
    }
  }, [orderType, runningOrderId]);

  const fetchMasterData = async () => {
    try {
      const [menuRes, tablesRes] = await Promise.all([
        api.get("/api/menu/pos-data"),
        api.get("/api/tables"),
      ]);
      setCategories(menuRes.data);
      setTables(tablesRes.data);
    } catch (err) {
      toast.error("Failed to load POS data");
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const handleTableSelect = async (tableId) => {
    setSelectedTable(tableId);
    const tableInfo = tables.find((t) => t._id === tableId);

    if (tableInfo?.status === "Occupied") {
      const loadToast = toast.loading("Loading Table Order...");
      try {
        const res = await api.get(`/api/orders/table/${tableId}`);
        loadExistingOrder(res.data);
        // Force payment mode to Cash when loading an unpaid order (they can change it to UPI/Card)
        setPaymentMode("Cash");
        toast.success("Order Loaded", { id: loadToast });
        setIsCartOpen(true);
      } catch (err) {
        toast.error("Error loading table.", { id: loadToast });
        clearCart();
      }
    } else {
      clearCart();
      setSelectedTable(tableId);
      setPaymentMode("Pay Later"); // Fresh table defaults to Pay Later
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const taxAmount = (subtotal - discount) * (taxRate / 100);
  const finalTotal = subtotal - discount + taxAmount;

  const handleCheckoutAction = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (orderType === "DineIn" && !selectedTable)
      return toast.error("Select a table");

    const loadingToast = toast.loading("Processing...");

    try {
      // SCENARIO 1: Settle an Existing Order
      if (runningOrderId) {
        if (paymentMode === "Pay Later")
          return toast.error("Please select a valid payment method to settle.");
        const res = await api.put(`/api/orders/${runningOrderId}/settle`, {
          paymentMode,
          discount,
          tax: taxAmount,
          finalAmount: finalTotal,
        });
        setLastOrder({ ...res.data.order, date: new Date().toLocaleString() });
        toast.success("Bill Settled & Table Cleared!", { id: loadingToast });
        setShowReceipt(true);
      }
      // SCENARIO 2: Create a New Order
      else {
        const isPayLater =
          paymentMode === "Pay Later" || user?.role === "Waiter";

        const payload = {
          tableId: orderType === "DineIn" ? selectedTable : null,
          orderType,
          items: cart,
          discount,
          tax: taxAmount,
          // If Pay Later, send "Pending" to backend so it marks as Unpaid
          paymentMode: isPayLater ? "Pending" : paymentMode,
        };

        const res = await api.post("/api/orders", payload);
        toast.success(isPayLater ? "Sent to Kitchen!" : "Bill Generated!", {
          id: loadingToast,
        });

        if (!isPayLater) {
          setLastOrder({
            orderId: res.data.orderId,
            items: cart,
            subtotal,
            discount,
            taxAmount,
            finalTotal,
            paymentMode,
            date: new Date().toLocaleString(),
          });
          setShowReceipt(true);
        }
      }

      clearCart();
      fetchMasterData();
      setIsCartOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Transaction Failed", {
        id: loadingToast,
      });
    }
  };

  const displayItems =
    activeCategory === "All"
      ? categories.flatMap((c) => c.items)
      : categories.find((c) => c._id === activeCategory)?.items || [];

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-slate-50 text-slate-800 overflow-hidden print:hidden">
      <Toaster position="top-right" />

      {/* --- LEFT: CATEGORIES --- */}
      <div className="hidden md:flex flex-col w-[15%] bg-white border-r border-slate-200 z-10">
        <div
          className="p-4 bg-slate-900 text-white flex items-center gap-2 cursor-pointer hover:bg-slate-800"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={20} /> <span className="font-bold">EXIT POS</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <button
            onClick={() => setActiveCategory("All")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition ${activeCategory === "All" ? "bg-blue-600 text-white shadow-md" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat._id)}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition ${activeCategory === cat._id ? "bg-blue-600 text-white shadow-md" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* --- CENTER: ITEM GRID --- */}
      <div className="flex-1 flex flex-col w-full md:w-[55%] relative h-full">
        <div className="px-3 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="flex w-full sm:w-auto justify-between items-center gap-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="md:hidden p-2 bg-slate-100 rounded-lg text-slate-700"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={() => navigate("/tables")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 text-sm"
            >
              Floor Plan
            </button>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            {["DineIn", "Parcel", "Online"].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setOrderType(type);
                  setSelectedTable("");
                  clearCart();
                }}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-black transition ${orderType === type ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="md:hidden flex overflow-x-auto p-3 gap-2 bg-white border-b border-slate-200 shrink-0 hide-scrollbar">
          <button
            onClick={() => setActiveCategory("All")}
            className={`shrink-0 px-5 py-2 rounded-full text-sm font-bold border-2 transition ${activeCategory === "All" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat._id)}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-bold border-2 transition ${activeCategory === cat._id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-24 md:pb-4">
          {displayItems.map((item) => (
            <button
              key={item._id}
              onClick={() => {
                addToCart(item);
                toast.success(`Added ${item.name}`, {
                  icon: "🥘",
                  duration: 500,
                });
              }}
              className="bg-white p-3 rounded-2xl border-2 border-slate-100 shadow-sm hover:border-blue-500 flex flex-col h-28 text-left active:scale-95 transition-all"
            >
              <span className="font-bold text-slate-800 text-sm leading-tight flex-1 line-clamp-2">
                {item.name}
              </span>
              <span className="font-black text-slate-900 text-lg mt-1">
                ₹{item.price}
              </span>
            </button>
          ))}
        </div>

        {cart.length > 0 && !isCartOpen && (
          <div className="md:hidden absolute bottom-4 left-4 right-4 z-20">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-blue-600 text-white p-4 rounded-2xl shadow-2xl font-black flex justify-between items-center animate-in slide-in-from-bottom-4"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} /> {cart.length} ITEMS
              </div>
              <div className="flex items-center gap-2">
                ₹{finalTotal.toFixed(2)} <ChevronUp size={20} />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* --- RIGHT: ORDER SUMMARY --- */}
      <div
        className={`fixed inset-y-0 right-0 z-[60] w-full bg-white border-l border-slate-200 shadow-2xl transform transition-transform duration-300 md:relative md:translate-x-0 md:w-[30%] flex flex-col ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <h2 className="text-lg font-black flex items-center gap-2">
            <ShoppingBag size={20} className="text-blue-400" />
            {runningOrderId ? "Running Order" : "New Order"}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                clearCart();
                setIsCartOpen(false);
              }}
              className="p-2 text-red-400 hover:bg-slate-800 rounded-lg"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => setIsCartOpen(false)}
              className="md:hidden p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {orderType === "DineIn" && (
          <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0">
            <select
              value={selectedTable}
              onChange={(e) => handleTableSelect(e.target.value)}
              className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
            >
              <option value="" disabled>
                Select Table...
              </option>
              <optgroup label="Available Tables">
                {tables
                  .filter((t) => t.status === "Available")
                  .map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.tableNumber}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Occupied (Running Orders)">
                {tables
                  .filter((t) => t.status === "Occupied")
                  .map((t) => (
                    <option key={t._id} value={t._id}>
                      🔴 {t.tableNumber}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 bg-slate-50">
          {cart.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col p-3 mb-2 bg-white border border-slate-200 rounded-xl shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                <p className="font-black text-slate-900">
                  ₹{item.price * item.quantity}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400">
                  ₹{item.price} each
                </p>
                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => updateQuantity(item.menuItemId, -1)}
                    className="p-1 text-slate-600 bg-white rounded shadow-sm hover:text-red-500"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-black text-sm w-8 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.menuItemId, 1)}
                    className="p-1 text-slate-600 bg-white rounded shadow-sm hover:text-blue-600"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-4 border-t border-slate-200 shrink-0 pb-6 md:pb-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>GST ({taxRate}%)</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-xl font-black text-slate-900">Total</span>
              <span className="text-2xl font-black text-blue-600">
                ₹{finalTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {user?.role !== "Waiter" && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {/* 🔥 NEW: Added Pay Later to the grid. Hidden if settling an existing order */}
              {!runningOrderId && (
                <button
                  onClick={() => setPaymentMode("Pay Later")}
                  className={`py-3 md:py-2 rounded-xl text-xs font-black uppercase transition-all border-2 flex items-center justify-center gap-1 ${paymentMode === "Pay Later" ? "bg-orange-100 border-orange-500 text-orange-600" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
                >
                  <Clock size={12} /> Later
                </button>
              )}
              {["Cash", "UPI", "Card"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`py-3 md:py-2 rounded-xl text-xs font-black uppercase transition-all border-2 ${paymentMode === mode ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"} ${runningOrderId ? "col-span-1" : ""}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleCheckoutAction}
            className={`w-full py-4 text-white rounded-xl font-black text-lg transition flex justify-center items-center gap-2 shadow-xl active:scale-95 ${
              paymentMode === "Pay Later" || user?.role === "Waiter"
                ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
                : runningOrderId
                  ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
            }`}
          >
            {paymentMode === "Pay Later" || user?.role === "Waiter" ? (
              <>
                <Send size={22} /> SEND TO KITCHEN
              </>
            ) : runningOrderId ? (
              <>
                <CheckCircle size={22} /> SETTLE BILL (₹{finalTotal.toFixed(2)})
              </>
            ) : (
              <>
                <CheckCircle size={22} /> CHARGE (₹{finalTotal.toFixed(2)})
              </>
            )}
          </button>
        </div>
      </div>

      {isCartOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/60 z-[50]"
          onClick={() => setIsCartOpen(false)}
        ></div>
      )}

      {/* ... [RECEIPT MODAL] ... */}
    </div>
  );
};
export default POS;
