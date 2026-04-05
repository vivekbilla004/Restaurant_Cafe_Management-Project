import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";
import { Package, Plus, AlertCircle, Link, ChefHat } from "lucide-react";

const InventoryManager = () => {
  const [activeTab, setActiveTab] = useState("stock");
  const [inventory, setInventory] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedMenuItem, setSelectedMenuItem] = useState("");
  const [recipeForm, setRecipeForm] = useState({
    inventoryId: "",
    requiredQty: "",
  });

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockForm, setStockForm] = useState({
    name: "",
    quantity: "",
    unit: "Kg",
    minStockLevel: 10,
    totalCost: "",
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invRes, menuRes, recipeRes] = await Promise.all([
        api.get("/api/inventory"),
        api.get("/api/menu/pos-data"),
        api.get("/api/inventory/recipes"),
      ]);
      setInventory(invRes.data);
      setMenuItems(menuRes.data.flatMap((cat) => cat.items));
      setAllRecipes(recipeRes.data);
    } catch (err) {
      toast.error("Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStock = async (e) => {
    e.preventDefault();
    const loadToast = toast.loading("Saving Stock...");
    try {
      await api.post("/api/inventory", {
        ...stockForm,
        quantity: Number(stockForm.quantity),
        minStockLevel: Number(stockForm.minStockLevel),
        totalCost: Number(stockForm.totalCost),
      });
      toast.success("Stock updated!", { id: loadToast });
      setShowStockModal(false);
      setStockForm({
        name: "",
        quantity: "",
        unit: "Kg",
        minStockLevel: 10,
        totalCost: "",
      }); // Reset form
      fetchData();
    } catch (err) {
      toast.error("Failed to add stock", { id: loadToast });
    }
  };

  const handleAddRecipe = async (e) => {
    e.preventDefault();
    if (!selectedMenuItem || !recipeForm.inventoryId)
      return toast.error("Missing fields");
    const loadToast = toast.loading("Mapping Recipe...");
    try {
      await api.post("/api/inventory/recipes", {
        menuItemId: selectedMenuItem,
        inventoryId: recipeForm.inventoryId,
        requiredQty: Number(recipeForm.requiredQty),
      });
      toast.success("Recipe mapped successfully!", { id: loadToast });
      setRecipeForm({ inventoryId: "", requiredQty: "" }); // Reset form
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to map recipe", {
        id: loadToast,
      });
    }
  };

  const currentItemRecipes = allRecipes.filter(
    (r) => r.menuItemId?._id === selectedMenuItem,
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto bg-slate-50 font-sans custom-scrollbar pb-24 md:pb-8">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
            <Package className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Inventory Engine
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest mt-1">
              Stock & Auto-Deduction
            </p>
          </div>
        </div>

        <div className="flex w-full md:w-auto bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab("stock")}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "stock" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Raw Stock
          </button>
          <button
            onClick={() => setActiveTab("recipes")}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "recipes" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Recipes
          </button>
        </div>
      </div>

      {/* RAW STOCK TAB */}
      {activeTab === "stock" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-end">
            <button
              onClick={() => setShowStockModal(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm shadow-lg shadow-blue-200 transition active:scale-95"
            >
              <Plus size={18} /> ADD STOCK
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Ingredient Name</th>
                    <th className="px-6 py-4">Current Stock</th>
                    <th className="px-6 py-4">Avg Unit Cost</th>
                    <th className="px-6 py-4">Status Indicator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="font-black text-slate-900 text-lg">
                          {item.quantity.toFixed(2)}
                        </span>{" "}
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-600 text-sm">
                        ₹{item.unitCost?.toFixed(2) || 0}
                      </td>
                      <td className="px-6 py-4">
                        {item.isLowStock ? (
                          <span className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100 flex items-center gap-1.5 w-max">
                            <AlertCircle size={14} /> Low Stock (Min:{" "}
                            {item.minStockLevel})
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 w-max inline-block">
                            Adequate
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {inventory.map((item) => (
                <div key={item._id} className="p-4 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-900 text-base">
                      {item.name}
                    </span>
                    {item.isLowStock ? (
                      <AlertCircle size={18} className="text-red-500" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2"></div>
                    )}
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Available Stock
                      </p>
                      <p className="text-lg font-black text-slate-900">
                        {item.quantity.toFixed(2)}{" "}
                        <span className="text-xs text-slate-500 uppercase">
                          {item.unit}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Avg Cost
                      </p>
                      <p className="font-bold text-slate-600">
                        ₹{item.unitCost?.toFixed(2) || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {inventory.length === 0 && (
              <div className="p-12 text-center text-slate-400 font-bold">
                No stock added yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECIPES TAB */}
      {activeTab === "recipes" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Map Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-max">
            <h3 className="font-black text-slate-800 mb-2 flex items-center gap-2">
              <ChefHat className="text-blue-600" /> Build Recipe
            </h3>
            <p className="text-xs text-slate-500 font-bold mb-6">
              Link raw ingredients to menu items for auto-deduction.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                1. Select Menu Item
              </label>
              <select
                value={selectedMenuItem}
                onChange={(e) => setSelectedMenuItem(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  -- Choose a Dish --
                </option>
                {menuItems.map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.name} (₹{i.price})
                  </option>
                ))}
              </select>
            </div>

            {selectedMenuItem && (
              <form
                onSubmit={handleAddRecipe}
                className="space-y-4 border-t border-slate-100 pt-6 mt-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    2. Select Raw Ingredient to Deduct
                  </label>
                  <select
                    required
                    value={recipeForm.inventoryId}
                    onChange={(e) =>
                      setRecipeForm({
                        ...recipeForm,
                        inventoryId: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      -- Choose Raw Stock --
                    </option>
                    {inventory.map((inv) => (
                      <option key={inv._id} value={inv._id}>
                        {inv.name} (measured in {inv.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    3. Quantity to deduct per order
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={recipeForm.requiredQty}
                    onChange={(e) =>
                      setRecipeForm({
                        ...recipeForm,
                        requiredQty: e.target.value,
                      })
                    }
                    placeholder="e.g., 0.15 (for 150g out of 1Kg)"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-sm transition active:scale-95 shadow-lg shadow-slate-900/20 flex justify-center items-center gap-2 mt-4"
                >
                  <Link size={18} /> MAP INGREDIENT
                </button>
              </form>
            )}
          </div>

          {/* Current Recipe View */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-max">
            <h3 className="font-black text-slate-800 mb-6 uppercase tracking-wider text-sm">
              Current Active Recipe
            </h3>

            {!selectedMenuItem ? (
              <div className="flex flex-col items-center justify-center p-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <ChefHat size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-bold">
                  Select a menu item on the left to view its recipe.
                </p>
              </div>
            ) : currentItemRecipes.length === 0 ? (
              <div className="flex items-center gap-3 bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-700">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-sm font-bold">
                  No ingredients mapped yet. Auto-deduction is disabled for this
                  dish.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentItemRecipes.map((r, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black">
                        {i + 1}
                      </div>
                      <span className="font-bold text-slate-900">
                        {r.inventoryId?.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Deducts
                      </span>
                      <span className="font-black text-blue-600 text-lg">
                        {r.requiredQty}{" "}
                        <span className="text-xs uppercase">
                          {r.inventoryId?.unit}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STOCK MODAL */}
      {showStockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-900">
                Add Raw Stock
              </h2>
            </div>

            <form onSubmit={handleAddStock} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Ingredient Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Chicken Breast"
                  value={stockForm.name}
                  onChange={(e) =>
                    setStockForm({ ...stockForm, name: e.target.value })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Purchased Qty
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={stockForm.quantity}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, quantity: e.target.value })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Unit
                  </label>
                  <select
                    value={stockForm.unit}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, unit: e.target.value })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option>Kg</option>
                    <option>Gram</option>
                    <option>Ltr</option>
                    <option>Piece</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Total Amount Paid (₹)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g., 500"
                  value={stockForm.totalCost}
                  onChange={(e) =>
                    setStockForm({ ...stockForm, totalCost: e.target.value })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="space-y-1 border-t border-slate-100 pt-4 mt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Low Stock Alert Level
                </label>
                <input
                  type="number"
                  required
                  placeholder="Notify me when stock falls below..."
                  value={stockForm.minStockLevel}
                  onChange={(e) =>
                    setStockForm({
                      ...stockForm,
                      minStockLevel: e.target.value,
                    })
                  }
                  className="w-full p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 font-bold"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-sm transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm shadow-lg shadow-blue-200 active:scale-95 transition"
                >
                  SAVE STOCK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default InventoryManager;
