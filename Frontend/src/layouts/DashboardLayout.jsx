import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
// Using Lucide React for clean, modern icons (npm install lucide-react)
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
} from "lucide-react";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Define the 2.1 Sidebar Menu Items and map them to their required roles
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
      roles: ["Owner", "Waiter"],
    },
    {
      name: "Inventory",
      path: "/inventory",
      icon: Package,
      roles: ["Owner"],
    },
    { name: "Staff", path: "/staff", icon: Users, roles: ["Owner"] },
    {
      name: "Expenses",
      path: "/expenses",
      icon: Receipt,
      roles: ["Owner", "Manager"],
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

  // Filter items based on the current user's role
  const allowedMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* --- DESKTOP LEFT SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white transition-all duration-300">
        <div className="flex items-center justify-center h-16 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-blue-400">Omicra</h1>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {allowedMenuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer (Logout) */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-400 rounded-md hover:bg-slate-800 hover:text-red-300"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        {/* --- TOP NAVBAR --- */}
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b shadow-sm md:px-6">
          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            onClick={() => setMobileMenuOpen(true)}
          >
            <MenuIcon className="h-6 w-6" />
          </button>

          <div className="hidden md:block">
            <h2 className="text-xl font-semibold text-gray-800">
              {/* Dynamic Page Title could go here */}
            </h2>
          </div>

          {/* Profile & Notifications */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-700 relative">
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* --- PAGE CONTENT (Outlet) --- */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <Outlet />{" "}
          {/* This is where Dashboard, Menu, POS components inject themselves */}
        </main>
      </div>

      {/* --- MOBILE/TABLET BOTTOM NAVIGATION BAR --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
        <div className="flex justify-around items-center h-16">
          {/* Slice the first 4 allowed items for the bottom nav to prevent overcrowding */}
          {allowedMenuItems.slice(0, 4).map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-900"
                }`
              }
            >
              <item.icon className="h-6 w-6" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </NavLink>
          ))}
          {/* Mobile More/Menu button for items that don't fit */}
          {allowedMenuItems.length > 4 && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500"
            >
              <MenuIcon className="h-6 w-6" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Overlay (For "More" menu) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 text-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-2xl font-bold text-blue-400">Omicra</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {allowedMenuItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <item.icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex bg-slate-800 p-4">
              <button
                onClick={handleLogout}
                className="flex-shrink-0 group block w-full text-red-400 hover:text-red-300 flex items-center"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
