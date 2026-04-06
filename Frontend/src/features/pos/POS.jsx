import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";
import usePosStore from "../../store/posStore";
import { useAuth } from "../../store/AuthContext";
import {
  ShoppingBag,
  CheckCircle,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  X,
  ChevronUp,
  Send,
  Clock,
  Printer,
  MessageCircle,
  ClipboardList,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const POS = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [tables, setTables] = useState([]);

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

  const isWaiter = user?.role === "Waiter";
  const isCashier = user?.role === "Cashier";
  const restaurantName = user?.restaurantName || user?.name || "Our Restaurant";

  // Auto-switch default payment mode based on Order Type
  useEffect(() => {
    if (isWaiter) {
      setPaymentMode("Pay Later");
    } else if (orderType === "DineIn" && !runningOrderId) {
      setPaymentMode("Pay Later");
    } else if (paymentMode === "Pay Later" && orderType !== "DineIn") {
      setPaymentMode("Cash");
    }
  }, [orderType, runningOrderId, isWaiter]);

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
        if (!isWaiter) setPaymentMode("Cash");
        toast.success("Order Loaded", { id: loadToast });
        setIsCartOpen(true);
      } catch (err) {
        toast.error("Error loading table.", { id: loadToast });
        clearCart();
      }
    } else {
      clearCart();
      setSelectedTable(tableId);
      setPaymentMode("Pay Later");
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
      if (runningOrderId) {
        if (isWaiter) return toast.error("Waiters cannot settle bills.");
        if (paymentMode === "Pay Later")
          return toast.error("Please select a valid payment method to settle.");

        const res = await api.put(`/api/orders/${runningOrderId}/settle`, {
          paymentMode,
          discount,
          tax: taxAmount,
          finalAmount: finalTotal,
        });

        setLastOrder({
          ...res.data.order,
          subtotal,
          discount,
          taxAmount,
          finalTotal,
          paymentMode,
          date: new Date().toLocaleString(),
        });
        toast.success("Bill Settled & Table Cleared!", { id: loadingToast });
        setShowReceipt(true);
      } else {
        const isPayLater = paymentMode === "Pay Later" || isWaiter;

        const payload = {
          tableId: orderType === "DineIn" ? selectedTable : null,
          orderType,
          items: cart,
          discount,
          tax: taxAmount,
          paymentMode: isPayLater ? "Pending" : paymentMode,
        };

        const res = await api.post("/api/orders", payload);
        toast.success(isPayLater ? "Sent to Kitchen!" : "Bill Generated!", {
          id: loadingToast,
        });

        if (!isPayLater) {
          setLastOrder({
            orderId: res.data.orderId || res.data.order?._id,
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

  const sendWhatsAppReceipt = () => {
    if (!lastOrder) return;
    let text = `*${restaurantName.toUpperCase()}*\n`;
    text += `Order: #${(lastOrder.orderId || lastOrder._id || "").slice(-6).toUpperCase()}\n`;
    text += `Date: ${lastOrder.date}\n\n`;
    lastOrder.items.forEach((item) => {
      text += `${item.quantity}x ${item.name} - ₹${item.price * item.quantity}\n`;
    });
    text += `\nSubtotal: ₹${lastOrder.subtotal?.toFixed(2)}`;
    if (lastOrder.discount > 0)
      text += `\nDiscount: -₹${lastOrder.discount?.toFixed(2)}`;
    text += `\nTax (${taxRate}%): ₹${lastOrder.taxAmount?.toFixed(2)}`;
    text += `\n*Total: ₹${lastOrder.finalTotal?.toFixed(2)}*`;
    text += `\nPayment: ${lastOrder.paymentMode}\n\nThank you for visiting!`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const displayItems =
    activeCategory === "All"
      ? categories.flatMap((c) => c.items)
      : categories.find((c) => c._id === activeCategory)?.items || [];

  return (
    <>
      <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-slate-50 text-slate-800 overflow-hidden print:hidden">
        <Toaster position="top-right" />

        {/* --- LEFT: CATEGORIES (Desktop Only) --- */}
        <div className="hidden md:flex flex-col w-[18%] lg:w-[15%] bg-white border-r border-slate-200 z-10 shadow-sm">
          {!isCashier && !isWaiter ? (
            <div
              className="p-4 bg-slate-900 text-white flex items-center gap-2 cursor-pointer hover:bg-slate-800 transition"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft size={20} />{" "}
              <span className="font-bold">EXIT POS</span>
            </div>
          ) : (
            <div className="p-4 bg-slate-900 text-slate-400 flex items-center gap-2 cursor-not-allowed select-none">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
              <span className="font-bold text-xs lg:text-sm tracking-wider uppercase">
                Register Open
              </span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
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
        <div className="flex-1 flex flex-col w-full md:w-[47%] lg:w-[55%] relative h-full">
          <div className="px-3 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 shadow-sm">
            <div className="flex w-full sm:w-auto justify-between items-center gap-2">
              {!isCashier && (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="md:hidden p-2 bg-slate-100 rounded-lg text-slate-700"
                >
                  <ArrowLeft size={20} />
                </button>
              )}

              <button
                onClick={() => navigate("/tables")}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 text-sm transition"
              >
                Floor Plan
              </button>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto hide-scrollbar">
              {["DineIn", "Parcel", "Online"].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setOrderType(type);
                    setSelectedTable("");
                    clearCart();
                  }}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-black transition whitespace-nowrap ${orderType === type ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="md:hidden flex overflow-x-auto p-3 gap-2 bg-white border-b border-slate-200 shrink-0 hide-scrollbar">
            <button
              onClick={() => setActiveCategory("All")}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-bold border-2 transition ${activeCategory === "All" ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-slate-600 border-slate-200"}`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setActiveCategory(cat._id)}
                className={`shrink-0 px-5 py-2 rounded-full text-sm font-bold border-2 transition ${activeCategory === cat._id ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-slate-600 border-slate-200"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-24 md:pb-4 custom-scrollbar">
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

          {/* 🔥 FIX: Mobile Floating Bottom Button (Always Visible!) */}
          {!isCartOpen && (
            <div className="md:hidden absolute bottom-4 left-4 right-4 z-20">
              <button
                onClick={() => setIsCartOpen(true)}
                className={`w-full p-4 rounded-2xl shadow-2xl font-black flex justify-between items-center animate-in slide-in-from-bottom-4 transition-all ${cart.length > 0 ? "bg-blue-600 text-white" : "bg-slate-900 text-white"}`}
              >
                <div className="flex items-center gap-2">
                  {cart.length > 0 ? (
                    <>
                      <ShoppingBag size={20} /> {cart.length} ITEMS
                    </>
                  ) : (
                    <>
                      <ClipboardList size={20} /> OPEN ORDER PANEL
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {cart.length > 0
                    ? `₹${finalTotal.toFixed(2)}`
                    : "SELECT TABLE"}{" "}
                  <ChevronUp size={20} />
                </div>
              </button>
            </div>
          )}
        </div>

        {/* --- RIGHT: ORDER SUMMARY --- */}
        <div
          className={`fixed inset-y-0 right-0 z-[60] w-full bg-white border-l border-slate-200 shadow-2xl transform transition-transform duration-300 md:relative md:translate-x-0 md:w-[35%] lg:w-[30%] flex flex-col ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}
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
                className="p-2 text-red-400 hover:bg-slate-800 rounded-lg transition"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={() => setIsCartOpen(false)}
                className="md:hidden p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
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
                className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 shadow-sm"
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

          <div className="flex-1 overflow-y-auto p-2 bg-slate-50 custom-scrollbar">
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <ShoppingBag size={48} className="mb-2" />
                <p className="font-bold">Cart is empty</p>
              </div>
            )}
            {cart.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col p-3 mb-2 bg-white border border-slate-200 rounded-xl shadow-sm animate-in fade-in"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-slate-800 text-sm">
                    {item.name}
                  </p>
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
                      className="p-1 text-slate-600 bg-white rounded shadow-sm hover:text-red-500 transition"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-black text-sm w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                      className="p-1 text-slate-600 bg-white rounded shadow-sm hover:text-blue-600 transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-4 border-t border-slate-200 shrink-0 pb-6 md:pb-4">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Discount (₹)</span>
                {isWaiter ? (
                  <span>- ₹{discount.toFixed(2)}</span>
                ) : (
                  <div className="flex items-center gap-1">
                    <span>- ₹</span>
                    <input
                      type="number"
                      min="0"
                      value={discount === 0 ? "" : discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      className="w-16 px-2 py-1 border border-slate-200 rounded-md text-right font-black focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900 transition"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>GST ({taxRate}%)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="text-xl font-black text-slate-900">Total</span>
                <span className="text-2xl font-black text-blue-600">
                  ₹{finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {!isWaiter && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {!runningOrderId && (
                  <button
                    onClick={() => setPaymentMode("Pay Later")}
                    className={`py-3 md:py-2 rounded-xl text-xs font-black uppercase transition-all border-2 flex items-center justify-center gap-1 ${paymentMode === "Pay Later" ? "bg-orange-100 border-orange-500 text-orange-600 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
                  >
                    <Clock size={12} /> Later
                  </button>
                )}
                {["Cash", "UPI", "Card"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`py-3 md:py-2 rounded-xl text-xs font-black uppercase transition-all border-2 ${paymentMode === mode ? "bg-slate-900 border-slate-900 text-white shadow-md" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"} ${runningOrderId ? "col-span-1" : ""}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleCheckoutAction}
              className={`w-full py-4 text-white rounded-xl font-black text-lg transition flex justify-center items-center gap-2 shadow-xl active:scale-95 ${
                paymentMode === "Pay Later" || isWaiter
                  ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/30"
                  : runningOrderId
                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"
              }`}
            >
              {paymentMode === "Pay Later" || isWaiter ? (
                <>
                  <Send size={22} /> SEND TO KITCHEN
                </>
              ) : runningOrderId ? (
                <>
                  <CheckCircle size={22} /> SETTLE BILL (₹
                  {finalTotal.toFixed(2)})
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
      </div>

      {/* ========================================================
        RECEIPT MODAL (ON-SCREEN)
        ========================================================
      */}
      {showReceipt && lastOrder && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 print:hidden animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="bg-emerald-500 p-6 text-center text-white shrink-0 relative">
              <button
                onClick={() => setShowReceipt(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition"
              >
                <X size={20} />
              </button>
              <CheckCircle size={48} className="mx-auto mb-2 opacity-90" />
              <h2 className="text-2xl font-black tracking-tight">
                Payment Successful
              </h2>
              <p className="font-bold text-sm mt-1 bg-white/20 inline-block px-3 py-1 rounded-full">
                ₹{lastOrder.finalTotal?.toFixed(2)} via {lastOrder.paymentMode}
              </p>
            </div>

            <div className="p-6 flex-1 overflow-y-auto bg-slate-50 custom-scrollbar">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-sm relative">
                {/* Receipt Zig-Zag Top */}
                <div
                  className="absolute -top-2 left-0 right-0 h-2 bg-slate-50"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, white 50%, transparent 50%), linear-gradient(-135deg, white 50%, transparent 50%)",
                    backgroundSize: "10px 10px",
                    backgroundRepeat: "repeat-x",
                  }}
                ></div>

                <div className="text-center mb-5 border-b border-dashed border-slate-300 pb-5">
                  <h3 className="font-black text-xl text-slate-800 uppercase tracking-widest">
                    {restaurantName}
                  </h3>
                  <p className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-wider">
                    {lastOrder.date}
                  </p>
                  <p className="text-slate-500 font-bold text-xs font-mono mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded">
                    ORDER: #
                    {(lastOrder.orderId || lastOrder._id || "")
                      .slice(-6)
                      .toUpperCase()}
                  </p>
                </div>

                <div className="space-y-3 mb-5">
                  {lastOrder.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-slate-700 font-bold"
                    >
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-slate-300 pt-4 space-y-1.5">
                  <div className="flex justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <span>Subtotal</span>
                    <span>₹{lastOrder.subtotal?.toFixed(2)}</span>
                  </div>
                  {lastOrder.discount > 0 && (
                    <div className="flex justify-between text-red-500 text-xs font-bold uppercase tracking-wider">
                      <span>Discount</span>
                      <span>- ₹{lastOrder.discount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <span>GST</span>
                    <span>₹{lastOrder.taxAmount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 text-lg pt-3">
                    <span>TOTAL</span>
                    <span className="text-blue-600">
                      ₹{lastOrder.finalTotal?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-white border-t border-slate-100 shrink-0 space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-wider rounded-xl flex justify-center items-center gap-2 transition active:scale-95 border border-slate-200 shadow-sm"
                >
                  <Printer size={16} /> Print
                </button>
                <button
                  onClick={sendWhatsAppReceipt}
                  className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-xs uppercase tracking-wider rounded-xl flex justify-center items-center gap-2 transition active:scale-95 border border-emerald-200 shadow-sm"
                >
                  <MessageCircle size={16} /> WhatsApp
                </button>
              </div>
              <button
                onClick={() => setShowReceipt(false)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition active:scale-95 uppercase tracking-widest text-sm shadow-lg shadow-blue-200"
              >
                START NEW ORDER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
        PRINT-ONLY LAYOUT (Hidden on screen, visible to Printer)
        ========================================================
      */}
      {showReceipt && lastOrder && (
        <div className="hidden print:block absolute inset-0 bg-white z-[100] p-4 text-black font-mono text-sm w-[80mm]">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold uppercase">{restaurantName}</h1>
            <p className="text-xs">Date: {lastOrder.date}</p>
            <p className="text-xs">
              Order: #
              {(lastOrder.orderId || lastOrder._id || "")
                .slice(-6)
                .toUpperCase()}
            </p>
            <p className="text-xs">Type: {lastOrder.orderType || "Takeaway"}</p>
          </div>

          <div className="border-b border-black mb-2 border-dashed"></div>

          <table className="w-full text-xs mb-2">
            <thead>
              <tr className="border-b border-black border-dashed">
                <th className="text-left font-normal pb-1">Item</th>
                <th className="text-right font-normal pb-1">Qty</th>
                <th className="text-right font-normal pb-1">Amt</th>
              </tr>
            </thead>
            <tbody>
              {lastOrder.items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1">{item.name}</td>
                  <td className="text-right py-1">{item.quantity}</td>
                  <td className="text-right py-1">
                    {item.price * item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-black pt-2 border-dashed text-xs space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{lastOrder.subtotal?.toFixed(2)}</span>
            </div>
            {lastOrder.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-{lastOrder.discount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>{lastOrder.taxAmount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-1 mt-1 border-t border-black">
              <span>TOTAL:</span>
              <span>{lastOrder.finalTotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>Paid via:</span>
              <span>{lastOrder.paymentMode}</span>
            </div>
          </div>

          <div className="text-center mt-6 text-xs">
            <p>Thank you for visiting!</p>
            <p>Please come again.</p>
          </div>
        </div>
      )}
    </>
  );
};
export default POS;
