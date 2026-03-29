import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const POS = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [tables, setTables] = useState([]);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const { user } = useAuth();

  // --- NEW LOOPHOLE FIX STATES ---
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState(null); // Stores the bill data to show on the receipt
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [splitCount, setSplitCount] = useState(2);

  const {
    cart,
    orderType,
    selectedTable,
    discount,
    taxRate,
    setOrderType,
    setSelectedTable,
    setDiscount,
    addToCart,
    updateQuantity,
    clearCart,
  } = usePosStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, tablesRes] = await Promise.all([
          api.get("/api/menu/pos-data"),
          api.get("/api/tables"),
        ]);
        setCategories(menuRes.data);
        setTables(tablesRes.data.filter((t) => t.status === "Available"));
      } catch (err) {
        toast.error("Failed to load master data");
      }
    };
    fetchData();
  }, []);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const taxAmount = (subtotal - discount) * (taxRate / 100);
  const finalTotal = subtotal - discount + taxAmount;

  // --- LOOPHOLE FIX: GENERATE BILL & SHOW RECEIPT ---
  const handleGenerateBill = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (orderType === "DineIn" && !selectedTable)
      return toast.error("Select a table for Dine-In");

    const loadingToast = toast.loading("Processing Transaction...");
    try {
      const payload = {
        tableId: orderType === "DineIn" ? selectedTable : null,
        orderType,
        items: cart,
        discount,
        tax: taxAmount,
        paymentMode,
      };

      const res = await api.post("/api/orders", payload);

      if (paymentMode !== "Pending") {
        // We mark it PAID, but we do NOT change the kitchen status so it stays 'Pending'
        await api.put(`/api/orders/${res.data.orderId}/status`, {
          paymentStatus: "Paid",
          paymentMode,
        });
      }
      toast.success("Bill Generated Successfully!", { id: loadingToast });

      // Save data for the receipt modal BEFORE clearing the cart
      setLastOrder({
        orderId: res.data.orderId || "NEW",
        items: [...cart],
        subtotal,
        discount,
        taxAmount,
        finalTotal,
        paymentMode,
        date: new Date().toLocaleString(),
      });

      clearCart();
      setShowReceipt(true); // Open the receipt modal
    } catch (err) {
      toast.error("Transaction Failed", { id: loadingToast });
    }
  };

  const handlePrintReceipt = () => {
    window.print(); // We will use CSS media queries to only print the modal
  };

  const handleWhatsAppReceipt = () => {
    if (!lastOrder) return;
    let text = `*OMICRA INVOICE*\nOrder: #${lastOrder.orderId.slice(-4)}\nDate: ${lastOrder.date}\n\n*Items:*\n`;
    lastOrder.items.forEach((item) => {
      text += `${item.name} x${item.quantity} - Rs.${item.price * item.quantity}\n`;
    });
    text += `\nSubtotal: Rs.${lastOrder.subtotal.toFixed(2)}`;
    if (lastOrder.discount > 0) text += `\nDiscount: -Rs.${lastOrder.discount}`;
    text += `\nGST: Rs.${lastOrder.taxAmount.toFixed(2)}\n*Total: Rs.${lastOrder.finalTotal.toFixed(2)}*\n\nThank you for visiting!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const displayItems =
    activeCategory === "All"
      ? categories.flatMap((c) => c.items)
      : categories.find((c) => c._id === activeCategory)?.items || [];

  return (
    <>
      <Toaster />
      {/* --- STANDARD POS UI --- */}
      <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-800 font-sans print:hidden">
        {/* LEFT: Categories Panel (15%) */}
        <div className="w-[15%] bg-white border-r border-gray-200 flex flex-col z-10">
          <div
            className="p-4 bg-slate-900 text-white flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={20} className="text-slate-400" />
            <span className="font-bold tracking-wide">EXIT POS</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <button
              onClick={() => setActiveCategory("All")}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition ${activeCategory === "All" ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-600 hover:bg-slate-50"}`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setActiveCategory(cat._id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition ${activeCategory === cat._id ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-600 hover:bg-slate-50"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* CENTER: Item Grid (55%) */}
        <div className="w-[55%] flex flex-col bg-slate-50">
          <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Menu Grid</h2> 
            {(user?.role === "Waiter" ||
              user?.role === "Manager" ||
              user?.role === "Owner") && (
              <button
                onClick={() => navigate("/tables")}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition"
              >
                <ArrowLeft size={18} /> Floor Plan
              </button>
            )}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              {["DineIn", "Parcel", "Online"].map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${orderType === type ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 lg:grid-cols-4 gap-4 content-start">
            {displayItems.map((item) => (
              <button
                key={item._id}
                onClick={() => addToCart(item)}
                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-400 hover:shadow flex flex-col h-28 text-left active:scale-95 group"
              >
                <span className="font-semibold text-slate-700 text-sm leading-tight flex-1 group-hover:text-blue-700">
                  {item.name}
                </span>
                <span className="font-bold text-slate-900">₹{item.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Order Summary (30%) */}
        <div className="w-[30%] bg-white border-l border-gray-200 flex flex-col shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.05)] z-10">
          <div className="p-4 bg-slate-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShoppingBag size={20} className="text-blue-600" /> Current Order
            </h2>
            <button
              onClick={clearCart}
              className="text-slate-400 hover:text-red-600 transition"
            >
              <Trash2 size={20} />
            </button>
          </div>

          {orderType === "DineIn" && (
            <div className="p-4 border-b border-gray-100 bg-white">
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none"
              >
                <option value="" disabled>
                  Select Table...
                </option>
                {tables.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.tableNumber} ({t.capacity} pax)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2">
            {cart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                No items in cart
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.menuItemId}
                  className="flex items-center justify-between p-3 border-b border-slate-50"
                >
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-slate-800 text-sm">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">₹{item.price}</p>
                  </div>
                  <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-sm">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                      className="p-1 text-slate-500 hover:bg-slate-100"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-bold text-sm w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                      className="p-1 text-blue-600 hover:bg-blue-50"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="w-16 text-right font-bold text-slate-800 text-sm">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-50 p-5 border-t border-slate-200">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-slate-600 font-medium">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-600 font-medium">
                <span>Discount (₹)</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-20 p-1 text-right border border-slate-200 rounded outline-none"
                />
              </div>
              <div className="flex justify-between text-sm text-slate-600 font-medium">
                <span>GST ({taxRate}%)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-black text-slate-900 pt-3 border-t border-slate-200 mt-2">
                <span>Total</span>
                <span className="text-blue-700">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {["Cash", "UPI", "Card"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 rounded-lg text-sm font-bold transition border ${paymentMode === mode ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-600"}`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() =>
                  finalTotal > 0
                    ? setShowSplitBill(true)
                    : toast.error("Cart is empty")
                }
                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold flex justify-center items-center gap-2 hover:bg-slate-100"
              >
                <SplitSquareHorizontal size={16} /> Split Bill
              </button>
            </div>

            <button
              onClick={handleGenerateBill}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition flex justify-center items-center gap-2 shadow-lg"
            >
              <CheckCircle size={20} /> Charge ₹{finalTotal.toFixed(2)}
            </button>
          </div>
        </div>
      </div>

      {/* --- LOOPHOLE FIX 1: THE RECEIPT MODAL --- */}
      {showReceipt && lastOrder && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col print:shadow-none print:w-full">
            {/* Modal Header (Hidden during print) */}
            <div className="bg-slate-800 px-4 py-3 flex justify-between items-center print:hidden">
              <h3 className="text-white font-bold">Transaction Complete</h3>
              <button
                onClick={() => setShowReceipt(false)}
                className="text-slate-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Actual Printable Receipt */}
            <div
              id="printable-receipt"
              className="p-6 bg-white text-slate-800 font-mono text-sm"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black uppercase tracking-wider">
                  OMICRA CAFE
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Order #{lastOrder.orderId.slice(-4)} | {lastOrder.date}
                </p>
                <p className="text-xs font-bold mt-1 uppercase border border-slate-300 inline-block px-2 py-0.5 rounded">
                  {lastOrder.paymentMode}
                </p>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-3 mb-3 space-y-2">
                {lastOrder.items.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between">
                    <span>
                      {item.name}{" "}
                      <span className="text-slate-500">x{item.quantity}</span>
                    </span>
                    <span>{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right">
                <p>Subtotal: {lastOrder.subtotal.toFixed(2)}</p>
                {lastOrder.discount > 0 && (
                  <p>Discount: -{lastOrder.discount.toFixed(2)}</p>
                )}
                <p>GST (5%): {lastOrder.taxAmount.toFixed(2)}</p>
                <p className="text-xl font-black mt-2 pt-2 border-t border-slate-300">
                  TOTAL: ₹{lastOrder.finalTotal.toFixed(2)}
                </p>
              </div>
              <div className="text-center mt-8 text-xs text-slate-500">
                Thank you! Please visit again.
              </div>
            </div>

            {/* Actions (Hidden during print) */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-3 print:hidden">
              <button
                onClick={handlePrintReceipt}
                className="py-2.5 bg-slate-800 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-slate-700"
              >
                <Printer size={16} /> Print
              </button>
              <button
                onClick={handleWhatsAppReceipt}
                className="py-2.5 bg-green-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-green-600"
              >
                <MessageCircle size={16} /> WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LOOPHOLE FIX 2: SPLIT BILL CALCULATOR --- */}
      {showSplitBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">
                Split Bill Equal
              </h2>
              <button
                onClick={() => setShowSplitBill(false)}
                className="text-slate-400 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-center mb-6">
              <p className="text-sm text-slate-500 font-medium">
                Total Bill Amount
              </p>
              <p className="text-3xl font-black text-slate-900">
                ₹{finalTotal.toFixed(2)}
              </p>
            </div>

            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2 rounded-xl mb-6">
              <button
                onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:bg-slate-100"
              >
                <Minus size={18} />
              </button>
              <div className="text-center">
                <span className="text-xl font-black">{splitCount}</span>
                <p className="text-xs text-slate-500 font-bold uppercase">
                  Ways
                </p>
              </div>
              <button
                onClick={() => setSplitCount(splitCount + 1)}
                className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:bg-slate-100"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center mb-6">
              <p className="text-sm text-blue-600 font-bold mb-1">
                Each Person Pays
              </p>
              <p className="text-2xl font-black text-blue-700">
                ₹{(finalTotal / splitCount).toFixed(2)}
              </p>
            </div>

            <button
              onClick={() => setShowSplitBill(false)}
              className="w-full py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* CSS to ensure only the receipt prints */}
      <style>{`@media print { body * { visibility: hidden; } #printable-receipt, #printable-receipt * { visibility: visible; } #printable-receipt { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; } }`}</style>
    </>
  );
};

export default POS;
