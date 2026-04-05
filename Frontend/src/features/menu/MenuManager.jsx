import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";
import {
  Search,
  Plus,
  Coffee,
  AlertCircle,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
} from "lucide-react";
import CategoryModal from "./CategoryModal";
import ItemModal from "./ItemModal";

const MenuManager = () => {
  const [menuData, setMenuData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setItemModalOpen] = useState(false);

  const fetchMenu = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get("/api/menu/admin-data");
      setMenuData(data);
    } catch (err) {
      toast.error("Failed to sync menu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleArchive = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${name}? This will hide it from POS and Menu Manager.`,
      )
    )
      return;
    try {
      await api.delete(`/api/menu/items/${id}`);
      toast.success("Item archived");
      fetchMenu();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const filteredMenu = menuData
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((i) =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50">
      <Toaster position="top-right" />

      {/* RESPONSIVE HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
            <Coffee className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Menu Engine
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Global control for your kitchen
            </p>
          </div>
        </div>

        <div className="flex w-full lg:w-auto gap-3">
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="flex-1 lg:flex-none py-3 px-6 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition shadow-sm"
          >
            + Category
          </button>
          <button
            onClick={() => {
              setEditingItem(null);
              setItemModalOpen(true);
            }}
            className="flex-1 lg:flex-none py-3 px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition"
          >
            + Menu Item
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative mb-8 group">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
          size={20}
        />
        <input
          type="text"
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm font-medium"
          placeholder="Search items or categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* CATEGORY SECTIONS */}
      <div className="space-y-10">
        {filteredMenu.map((category) => (
          <section
            key={category._id}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-wider">
                {category.name}
              </h2>
              <div className="h-[2px] flex-1 bg-slate-200"></div>
              <span className="text-xs font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                {category.items.length} ITEMS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {category.items.map((item) => (
                <div
                  key={item._id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex gap-4">
                    <img
                      src={item.image || "https://via.placeholder.com/150"}
                      className="w-20 h-20 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                      alt={item.name}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-slate-900 truncate pr-2">
                          {item.name}
                        </h3>
                        <p className="font-black text-blue-600">
                          ₹{item.price}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setItemModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleArchive(item._id, item.name)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* TOGGLE SWITCH */}
                        <button
                          onClick={() =>
                            api
                              .put(`/api/menu/items/${item._id}/status`, {
                                isAvailable: !item.isAvailable,
                              })
                              .then(fetchMenu)
                          }
                          className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${item.isAvailable ? "bg-emerald-500" : "bg-slate-300"}`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${item.isAvailable ? "translate-x-6" : "translate-x-0"}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Modal Components remain the same as previous step */}
      {isCategoryModalOpen && (
        <CategoryModal
          onClose={() => setCategoryModalOpen(false)}
          refreshData={fetchMenu}
        />
      )}
      {isItemModalOpen && (
        <ItemModal
          onClose={() => setItemModalOpen(false)}
          refreshData={fetchMenu}
          itemToEdit={editingItem}
          categories={menuData}
        />
      )}
    </div>
  );
};

export default MenuManager;
