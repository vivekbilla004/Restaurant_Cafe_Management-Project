import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";
import { Search, Plus, Coffee, AlertCircle, Edit2, Trash2 } from "lucide-react";
import CategoryModal from "./CategoryModal";
import ItemModal from "./ItemModal";

const MenuManager = () => {
  const [menuData, setMenuData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState(null); // Holds the item being edited

  // Modal States
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setItemModalOpen] = useState(false);

  const fetchMenu = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/menu/pos-data");
      setMenuData(response.data);
    } catch (err) {
      toast.error("Failed to load menu data. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const toggleItemStatus = async (itemId, currentStatus, itemName) => {
    // Optimistic UI update for instant feedback
    const loadingToast = toast.loading(`Updating ${itemName}...`);
    try {
      await api.put(`/api/menu/items/${itemId}/status`, {
        isAvailable: !currentStatus,
      });
      toast.success(
        `${itemName} is now ${!currentStatus ? "Available" : "Unavailable"}`,
        { id: loadingToast },
      );
      fetchMenu(); // Refresh to ensure sync with DB
    } catch (err) {
      toast.error("Failed to update status", { id: loadingToast });
    }
  };

  // Dynamic Search Filter Logic
  const filteredMenu = menuData
    .map((category) => ({
      ...category,
      items: category.items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter(
      (category) =>
        category.items.length > 0 ||
        category.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20 text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg font-medium">Loading Menu Data...</p>
      </div>
    );

  //Add the Archive/Soft-Delete function

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <Toaster position="top-right" /> {/* Notification Provider */}
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Coffee className="text-blue-600" /> Menu Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your categories, items, and live pricing.
          </p>
        </div>

        <div className="flex w-full md:w-auto space-x-3">
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            <Plus size={18} /> Category
          </button>
          <button
            onClick={() => setItemModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition"
          >
            <Plus size={18} /> Menu Item
          </button>
        </div>
      </div>
      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
          placeholder="Search items or categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {/* Categories & Items Display */}
      <div className="space-y-6">
        {filteredMenu.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 border-dashed flex flex-col items-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">
              No items found
            </h3>
            <p className="text-gray-500 mt-1">
              Try adjusting your search or add a new item.
            </p>
          </div>
        ) : (
          filteredMenu.map((category) => (
            <div
              key={category._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">
                  {category.name}
                </h2>
                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600">
                  {category.items.length} Items
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                      <th className="px-6 py-3 font-semibold">Item Name</th>
                      <th className="px-6 py-3 font-semibold">Price</th>
                      <th className="px-6 py-3 font-semibold text-right">
                        Status Toggle
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {category.items.map((item) => (
                      <tr
                        key={item._id}
                        className="hover:bg-blue-50/30 transition-colors group"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                            />
                          )}
                          {item.name}
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-medium">
                          ₹{item.price}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              toggleItemStatus(
                                item._id,
                                item.isAvailable,
                                item.name,
                              )
                            }
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${item.isAvailable ? "bg-green-500" : "bg-gray-300"}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.isAvailable ? "translate-x-5" : "translate-x-0"}`}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end items-center gap-3">
                          <button
                            onClick={() => {
                              setEditingItem(item); // Set the item
                              setItemModalOpen(true); // Open the modal
                            }}
                            className="p-4 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Item"
                          >
                            <Edit2 size={18} />
                          </button>
                          {/* Archive/Delete Button */}
                          <button
                            onClick={() =>
                              handleArchiveItem(item._id, item.name)
                            }
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove Item"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Modals */}
      {isCategoryModalOpen && (
        <CategoryModal
          onClose={() => setCategoryModalOpen(false)}
          refreshData={fetchMenu}
        />
      )}
      {isItemModalOpen && (
  <ItemModal 
    categories={menuData} 
    itemToEdit={editingItem} // Pass the data!
    onClose={() => {
      setItemModalOpen(false);
      setEditingItem(null); // Clear it when closed
    }} 
    refreshData={fetchMenu} 
  />
)}
    </div>
  );
};

export default MenuManager;
