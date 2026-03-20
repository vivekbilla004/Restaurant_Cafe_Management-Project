import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Receipt, Search, Eye, X } from 'lucide-react';

const OrdersManager = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null); // For the View Modal

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/api/orders');
        setOrders(response.data);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Simple search filter (by Order ID or Table Number)
  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    const orderIdMatch = order._id.toLowerCase().includes(searchLower);
    const tableMatch = order.tableId?.tableNumber?.toLowerCase().includes(searchLower);
    return orderIdMatch || tableMatch;
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-full pt-20 text-slate-500">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-lg font-medium">Loading Order History...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="text-blue-600" /> Order History
          </h1>
          <p className="text-slate-500 mt-1">View and search all past transactions.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
            placeholder="Search Order ID or Table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 font-semibold">Order ID & Date</th>
                <th className="px-6 py-4 font-semibold">Type / Table</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">No orders found.</td></tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 text-sm">#{order._id.slice(-6).toUpperCase()}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 text-sm">{order.orderType}</p>
                      {order.tableId && <p className="text-xs text-slate-500 mt-0.5">Table {order.tableId.tableNumber}</p>}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ₹{order.finalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {order.paymentStatus} ({order.paymentMode})
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- View Order Details Modal --- */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Order Details</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white transition"><X size={20} /></button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <p className="text-sm text-slate-500">Order ID</p>
                  <p className="font-bold text-slate-900">#{selectedOrder._id.slice(-6).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Date</p>
                  <p className="font-bold text-slate-900">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="font-medium text-slate-800">{item.menuItemId?.name || 'Item'} <span className="text-slate-500">x{item.quantity}</span></span>
                    <span className="font-bold text-slate-700">₹{item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm border border-slate-100">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₹{selectedOrder.totalAmount.toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-600"><span>Discount</span><span>-₹{selectedOrder.discount.toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-600"><span>GST</span><span>₹{selectedOrder.tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-black text-lg text-slate-900 pt-2 border-t border-slate-200 mt-2">
                  <span>Total</span><span>₹{selectedOrder.finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrdersManager;