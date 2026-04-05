import { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

import {
  LayoutDashboard,
  ShoppingCart,
  ListOrdered,
  UtensilsCrossed,
  Grid,
  Package,
  Users,
  Receipt,
  LineChart,
  CreditCard,
  Settings,
  LogOut,
  ChefHat,
  Menu as MenuIcon,
  X,
  Bell,
} from "lucide-react";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  // console.log("DEBUG USER OBJECT:", user);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- REAL NOTIFICATION LOGIC ---
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      text: "Table 4 requested the bill",
      time: "2 min ago",
      unread: true,
    },
    {
      id: 2,
      text: "Stock low: Chicken Breast",
      time: "10 min ago",
      unread: true,
    },
  ]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["Owner", "Manager"],
    },
    {
      name: "POS",
      path: "/pos",
      icon: ShoppingCart,
      roles: ["Owner", "Manager", "Cashier", "Waiter"],
    },
    {
      name: "KOT",
      path: "/kitchen",
      icon: ChefHat,
      roles: ["Owner", "Kitchen"],
    },
    {
      name: "Orders",
      path: "/orders",
      icon: ListOrdered,
      roles: ["Owner", "Manager", "Cashier", "Kitchen"],
    },
    { name: "Menu", path: "/menu", icon: UtensilsCrossed, roles: ["Owner"] },
    {
      name: "Tables",
      path: "/tables",
      icon: Grid,
      roles: ["Owner", "Waiter", "Cashier", "Manager"],
    },
    {
      name: "Inventory",
      path: "/inventory",
      icon: Package,
      roles: ["Owner", "Manager"],
    },
    { name: "Staff", path: "/staff", icon: Users, roles: ["Owner"] },
    {
      name: "Expenses",
      path: "/expenses",
      icon: Receipt,
      roles: ["Owner"],
    },
    {
      name: "Reports",
      path: "/reports",
      icon: LineChart,
      roles: ["Owner", "Manager"],
    },
    {
      name: "Subscription",
      path: "/subscription",
      icon: CreditCard,
      roles: ["Owner"],
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
      roles: ["Owner", "Manager"],
    },
  ];

  const allowedMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  // Dynamic Header Title based on path
  const currentPathName =
    menuItems.find((item) => item.path === location.pathname)?.name || "Omicra";

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white shadow-xl">
        <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-800">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <UtensilsCrossed size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight">OMICRA</h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
          {allowedMenuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5 opacity-80" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-400 rounded-xl hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* TOP NAVBAR */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              onClick={() => setMobileMenuOpen(true)}
            >
              <MenuIcon size={24} />
            </button>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide hidden sm:block">
              {currentPathName}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            {/* NOTIFICATIONS DROPDOWN */}
            <div className="relative" ref={notifRef}>
              <button
                className="p-2 text-slate-500 hover:bg-slate-50 rounded-full relative transition-colors"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                    <span className="font-bold text-slate-800">
                      Notifications
                    </span>
                    <button
                      className="text-xs text-blue-600 font-bold"
                      onClick={() => setNotifications([])}
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                        >
                          <p className="text-sm text-slate-700 font-medium">
                            {n.text}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">
                            {n.time}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        No new alerts
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* USER PROFILE */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
              <div className="hidden md:text-right md:block">
                <p className="text-sm font-black text-slate-800 leading-none mb-1">
                  {user?.name || "User"}
                </p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter bg-blue-50 px-1.5 py-0.5 rounded-md inline-block">
                  {user?.role}
                </p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-blue-100">
                {user?.name?.charAt(0) || "U"}
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>

      {/* --- TABLET/MOBILE BOTTOM NAV --- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 px-2 py-1 z-40">
        <div className="flex justify-around items-center h-16">
          {allowedMenuItems.slice(0, 4).map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
                  isActive ? "text-blue-600 scale-110" : "text-slate-400"
                }`
              }
            >
              {/* 🔥 FIX: We use a function here to get the 'isActive' state for the icon too */}
              {({ isActive }) => (
                <>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-1"
          >
            <MenuIcon size={22} />
            <span className="text-[9px] font-black uppercase tracking-tighter">
              More
            </span>
          </button>
        </div>
      </div>

      {/* --- MOBILE OVERLAY DRAWER --- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-slate-900 text-white flex flex-col h-full shadow-2xl animate-slide-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h1 className="text-xl font-black text-blue-400">OMICRA</h1>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 bg-slate-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {allowedMenuItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-xl font-bold transition-all ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-800"
                    }`
                  }
                >
                  <item.icon className="mr-4 h-5 w-5" /> {item.name}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="flex items-center w-full p-3 text-red-400 font-bold rounded-xl hover:bg-red-500/10"
              >
                <LogOut className="mr-4 h-5 w-5" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
