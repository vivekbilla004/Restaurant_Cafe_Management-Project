import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import { useLocation } from "react-router-dom";
import { TrendingUp, ShoppingBag, Banknote, Wallet } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
} from "recharts";

const Dashboard = () => {
  const [kpi, setKpi] = useState({
    revenue: 0,
    orders: 0,
    expenses: 0,
    profit: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRealWorldData = async () => {
      setIsLoading(true);
      try {
        const todayStr = new Date().toISOString().split("T")[0];

        // 1. Fetch KPIs from your Aggregation Pipeline
        const reportRes = await api.get(
          `/api/reports/sales?startDate=${todayStr}&endDate=${todayStr}`,
        );
        setKpi(reportRes.data);

        // 2. Fetch today's orders
        const ordersRes = await api.get("/api/orders");
        const todaysOrders = ordersRes.data.filter((o) =>
          o.createdAt.startsWith(todayStr),
        );

        // Set Recent Orders (Last 5)
        setRecentOrders(todaysOrders.slice(0, 5));

        // 3. 🔥 FIXED: Calculate Top Items Dynamically
        const itemTracker = {};

        todaysOrders.forEach((order) => {
          // Optional: Only count items from orders that weren't cancelled
          if (order.status === "Cancelled") return;

          order.items?.forEach((item) => {
            const name = item.menuItemId?.name || item.name || "Unknown Item";
            const qty = item.quantity || 1;
            const price = item.price || 0;

            if (!itemTracker[name]) {
              itemTracker[name] = { name, sold: 0, revenue: 0 };
            }

            itemTracker[name].sold += qty;
            itemTracker[name].revenue += price * qty; // Safely calculate revenue
          });
        });

        // Sort by highest sold and grab the top 4
        const sortedItems = Object.values(itemTracker)
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 4);

        setTopItems(sortedItems);

        // 4. Calculate Hourly Graph Data dynamically
        const hourlyData = {};
        todaysOrders.forEach((order) => {
          const hour = new Date(order.createdAt).getHours();
          const ampm = hour >= 12 ? "PM" : "AM";
          const formatHour = hour % 12 || 12;
          const label = `${formatHour} ${ampm}`;

          if (!hourlyData[label]) hourlyData[label] = 0;
          hourlyData[label] += order.finalAmount || 0;
        });

        // Format for Recharts
        const formattedGraph = Object.keys(hourlyData).map((key) => ({
          time: key,
          sales: hourlyData[key],
        }));

        setGraphData(
          formattedGraph.length > 0
            ? formattedGraph
            : [{ time: "Now", sales: 0 }],
        );
      } catch (error) {
        console.error("Failed to load live dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealWorldData();
  }, []);

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20 text-slate-500 font-bold uppercase tracking-widest text-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        Syncing live operations...
      </div>
    );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 bg-slate-50 min-h-full font-sans pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          Today's Pulse
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
          Live operational snapshot for {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard
          title="Today's Sales"
          value={`₹${kpi.revenue.toLocaleString()}`}
          icon={<TrendingUp size={20} />}
          trend="Live"
          positive
        />
        <KPICard
          title="Total Orders"
          value={kpi.orders}
          icon={<ShoppingBag size={20} />}
          trend="Live"
          positive
        />
        <KPICard
          title="Today's Expenses"
          value={`₹${kpi.expenses.toLocaleString()}`}
          icon={<Banknote size={20} />}
          trend="Live"
          positive={false}
        />
        <KPICard
          title="Net Profit"
          value={`₹${kpi.profit.toLocaleString()}`}
          icon={<Wallet size={20} />}
          trend="Live"
          positive
          bg="bg-slate-900 text-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* GRAPH: Today's Revenue Trend */}
        <div className="lg:col-span-2 bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
            <LineChart size={16} className="text-blue-600" /> Revenue Timeline
          </h3>
          <div style={{ height: "300px", width: "100%", minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={graphData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontWeight: "bold",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP SELLING ITEMS */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest mb-6">
            Top Performers
          </h3>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {topItems.length === 0 ? (
              <p className="text-sm text-slate-400 font-bold text-center">
                No items sold today yet.
              </p>
            ) : (
              topItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-lg font-black flex items-center justify-center text-sm ${idx === 0 ? "bg-yellow-100 text-yellow-700" : idx === 1 ? "bg-slate-200 text-slate-700" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-blue-50 text-blue-700"}`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-black text-slate-900 text-sm">
                        {item.name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {item.sold} sold
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-blue-600 text-sm">
                    ₹{item.revenue.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RECENT ORDERS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 md:px-6 py-4 md:py-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest">
            Live Order Feed
          </h3>
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-5 md:px-6 py-4 whitespace-nowrap">
                  Order ID
                </th>
                <th className="px-5 md:px-6 py-4 whitespace-nowrap">Time</th>
                <th className="px-5 md:px-6 py-4 whitespace-nowrap">Amount</th>
                <th className="px-5 md:px-6 py-4 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="p-8 text-center text-slate-400 font-bold"
                  >
                    Awaiting first order...
                  </td>
                </tr>
              ) : (
                recentOrders.map((order, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 md:px-6 py-4 font-black text-slate-900 whitespace-nowrap">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-5 md:px-6 py-4 font-bold text-slate-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 md:px-6 py-4 font-black text-slate-900 whitespace-nowrap">
                      ₹{(order.finalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 md:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-black ${order.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({
  title,
  value,
  icon,
  trend,
  positive,
  bg = "bg-white text-slate-900",
}) => (
  <div
    className={`${bg} p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300`}
  >
    <div className="flex justify-between items-start mb-4">
      <div
        className={`p-2.5 md:p-3 rounded-xl ${bg === "bg-white text-slate-900" ? "bg-blue-50 text-blue-600" : "bg-white/20 text-white"}`}
      >
        {icon}
      </div>
      <span
        className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${positive ? "text-emerald-700 bg-emerald-100" : "text-slate-600 bg-slate-200"}`}
      >
        {trend}
      </span>
    </div>
    <div>
      <h4 className="text-2xl md:text-3xl font-black tracking-tight">
        {value}
      </h4>
      <p
        className={`text-[10px] md:text-xs font-black uppercase tracking-widest mt-1 ${bg === "bg-white text-slate-900" ? "text-slate-400" : "text-slate-300"}`}
      >
        {title}
      </p>
    </div>
  </div>
);

export default Dashboard;
