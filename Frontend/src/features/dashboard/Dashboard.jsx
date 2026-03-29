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
  const location = useLocation();

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

        // 2. Fetch today's orders to calculate Top Items and Graph data dynamically
        const ordersRes = await api.get("/api/orders");
        const todaysOrders = ordersRes.data.filter((o) =>
          o.createdAt.startsWith(todayStr),
        );

        // Set Recent Orders (Last 5)
        setRecentOrders(todaysOrders.slice(0, 5));

        // Calculate Top Items dynamically
        const itemTracker = {};
        todaysOrders.forEach((order) => {
          order.items?.forEach(
            (item) => {
              const name = item.menuItemId?.name || "Unknown";
              if (!itemTracker[name])
                itemTracker[name] = { name, sold: 0, revenue: 0 };
              itemTracker[name].sold += item.quantity;
              itemTracker[name].revenue += item.total;
            },
            [[location.key]],
          );
        });
        const sortedItems = Object.values(itemTracker)
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 4);
        setTopItems(sortedItems);

        // Calculate Hourly Graph Data dynamically
        const hourlyData = {};
        todaysOrders.forEach((order) => {
          const hour = new Date(order.createdAt).getHours();
          const ampm = hour >= 12 ? "PM" : "AM";
          const formatHour = hour % 12 || 12;
          const label = `${formatHour} ${ampm}`;
          if (!hourlyData[label]) hourlyData[label] = 0;
          hourlyData[label] += order.finalAmount;
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
      <div className="p-10 text-center text-slate-500 font-medium">
        Syncing live operations...
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-full font-sans">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Today's Pulse
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Live operational snapshot for {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* KPI CARDS (Connected to getSalesReport) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Today's Sales"
          value={`₹${kpi.revenue.toLocaleString()}`}
          icon={<TrendingUp />}
          trend="Live"
          positive
        />
        <KPICard
          title="Total Orders"
          value={kpi.orders}
          icon={<ShoppingBag />}
          trend="Live"
          positive
        />
        <KPICard
          title="Today's Expenses"
          value={`₹${kpi.expenses.toLocaleString()}`}
          icon={<Banknote />}
          trend="Live"
          positive={false}
        />
        <KPICard
          title="Net Profit"
          value={`₹${kpi.profit.toLocaleString()}`}
          icon={<Wallet />}
          trend="Live"
          positive
          bg="bg-slate-900 text-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GRAPH: Today's Revenue Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">
            Revenue Timeline (Today)
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
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
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
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">
            Top Performers
          </h3>
          <div className="space-y-5">
            {topItems.length === 0 ? (
              <p className="text-sm text-slate-400">No items sold today yet.</p>
            ) : (
              topItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-sm">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">{item.sold} sold</p>
                    </div>
                  </div>
                  <span className="font-black text-slate-900 text-sm">
                    ₹{item.revenue.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RECENT ORDERS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Live Order Feed
          </h3>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
              <th className="px-6 py-3 font-semibold">Order ID</th>
              <th className="px-6 py-3 font-semibold">Time</th>
              <th className="px-6 py-3 font-semibold">Amount</th>
              <th className="px-6 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {recentOrders.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-6 text-center text-slate-400">
                  No recent orders
                </td>
              </tr>
            ) : (
              recentOrders.map((order, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-bold text-slate-900">
                    #{order._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(order.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    ₹{order.finalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold ${order.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
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
    className={`${bg} p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between`}
  >
    <div className="flex justify-between items-start mb-4">
      <div
        className={`p-3 rounded-lg ${bg === "bg-white text-slate-900" ? "bg-blue-50 text-blue-600" : "bg-white/20 text-white"}`}
      >
        {icon}
      </div>
      <span
        className={`text-xs font-bold px-2 py-1 rounded ${positive ? "text-emerald-600 bg-emerald-50" : "text-slate-500 bg-slate-100"}`}
      >
        {trend}
      </span>
    </div>
    <div>
      <h4 className="text-2xl font-black tracking-tight">{value}</h4>
      <p
        className={`text-sm font-medium mt-1 ${bg === "bg-white text-slate-900" ? "text-slate-500" : "text-slate-300"}`}
      >
        {title}
      </p>
    </div>
  </div>
);

export default Dashboard;
