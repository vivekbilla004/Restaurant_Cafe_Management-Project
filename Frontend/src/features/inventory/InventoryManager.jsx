import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { Package, Plus, AlertCircle, Link } from 'lucide-react';

const InventoryManager = () => {
  const [activeTab, setActiveTab] = useState('stock');
  const [inventory, setInventory] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedMenuItem, setSelectedMenuItem] = useState('');
  const [recipeForm, setRecipeForm] = useState({ inventoryId: '', requiredQty: '' });

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockForm, setStockForm] = useState({ name: '', quantity: '', unit: 'Kg', minStockLevel: 10, totalCost: 0 });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invRes, menuRes, recipeRes] = await Promise.all([
        api.get('/api/inventory'),
        api.get('/api/menu/pos-data'),
        api.get('/api/inventory/recipes') // Fetches all mapped recipes
      ]);
      setInventory(invRes.data);
      setMenuItems(menuRes.data.flatMap(cat => cat.items));
      setAllRecipes(recipeRes.data);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/inventory', { ...stockForm, quantity: Number(stockForm.quantity), minStockLevel: Number(stockForm.minStockLevel), totalCost: Number(stockForm.totalCost) });
      toast.success('Stock updated!');
      setShowStockModal(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to add stock');
    }
  };

  const handleAddRecipe = async (e) => {
    e.preventDefault();
    if (!selectedMenuItem || !recipeForm.inventoryId) return toast.error("Missing fields");
    try {
      await api.post('/api/inventory/recipes', { menuItemId: selectedMenuItem, inventoryId: recipeForm.inventoryId, requiredQty: Number(recipeForm.requiredQty) });
      toast.success('Recipe mapped!');
      fetchData();
    } catch (err) {
      toast.error('Failed to map recipe');
    }
  };

  // Filter recipes for the currently selected menu item
  const currentItemRecipes = allRecipes.filter(r => r.menuItemId?._id === selectedMenuItem);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto bg-slate-50 font-sans">
      <Toaster />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Package className="text-blue-600" /> Inventory Tracker</h1>
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
          <button onClick={() => setActiveTab('stock')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${activeTab === 'stock' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Raw Stock</button>
          <button onClick={() => setActiveTab('recipes')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${activeTab === 'recipes' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Recipe Mapping</button>
        </div>
      </div>

      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={() => setShowStockModal(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-sm shadow-sm"><Plus size={16}/> Add Stock</button></div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500"><th className="px-6 py-4 font-semibold">Item</th><th className="px-6 py-4 font-semibold">Stock</th><th className="px-6 py-4 font-semibold">Unit Cost</th><th className="px-6 py-4 font-semibold">Status</th></thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">{item.name}</td>
                    <td className="px-6 py-4 text-sm"><span className="font-black text-slate-900">{item.quantity.toFixed(2)}</span> <span className="text-slate-500">{item.unit}</span></td>
                    <td className="px-6 py-4 font-medium text-slate-600 text-sm">₹{item.unitCost?.toFixed(2) || 0}</td>
                    <td className="px-6 py-4">
                      {/* Using the exact boolean your backend passes */}
                      {item.isLowStock ? (
                        <span className="px-2.5 py-1 rounded bg-red-100 text-red-700 text-xs font-bold border border-red-200 flex items-center gap-1 w-max"><AlertCircle size={12}/> Low Stock (Min: {item.minStockLevel})</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">Adequate</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'recipes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Map Menu to Stock</h3>
            <select value={selectedMenuItem} onChange={(e) => setSelectedMenuItem(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold mb-6 outline-none">
              <option value="">-- Select Dish --</option>
              {menuItems.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
            </select>
            {selectedMenuItem && (
              <form onSubmit={handleAddRecipe} className="space-y-4 border-t border-slate-100 pt-6">
                <select required value={recipeForm.inventoryId} onChange={e => setRecipeForm({...recipeForm, inventoryId: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                  <option value="">Select Raw Ingredient...</option>
                  {inventory.map(inv => <option key={inv._id} value={inv._id}>{inv.name} ({inv.unit})</option>)}
                </select>
                <input type="number" step="0.01" required value={recipeForm.requiredQty} onChange={e => setRecipeForm({...recipeForm, requiredQty: e.target.value})} placeholder="Qty to deduct per order" className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm outline-none" />
                <button type="submit" className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-lg text-sm"><Link size={16} className="inline mr-2"/> Map Ingredient</button>
              </form>
            )}
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Current Recipe</h3>
            {!selectedMenuItem ? <p className="text-sm text-slate-400">Select an item to view recipe.</p> : (
              currentItemRecipes.length === 0 ? <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">No ingredients mapped. Auto-deduct is off.</p> :
              <div className="space-y-2">
                {currentItemRecipes.map((r, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    <span className="font-bold text-slate-800">{r.inventoryId?.name}</span>
                    <span className="text-slate-500 font-medium">Deducts {r.requiredQty} per order</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Add Stock Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add Stock Item</h2>
            <form onSubmit={handleAddStock} className="space-y-3">
              <input type="text" required placeholder="Name" value={stockForm.name} onChange={e => setStockForm({...stockForm, name: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none text-sm font-medium" />
              <div className="flex gap-2">
                <input type="number" required placeholder="Qty" value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none text-sm font-medium" />
                <select value={stockForm.unit} onChange={e => setStockForm({...stockForm, unit: e.target.value})} className="w-24 p-2.5 bg-slate-50 border rounded-lg outline-none text-sm font-medium"><option>Kg</option><option>Gram</option><option>Ltr</option><option>Piece</option></select>
              </div>
              <input type="number" required placeholder="Total Cost Paid (₹)" value={stockForm.totalCost} onChange={e => setStockForm({...stockForm, totalCost: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none text-sm font-medium" />
              <input type="number" required placeholder="Min Stock Level Alert" value={stockForm.minStockLevel} onChange={e => setStockForm({...stockForm, minStockLevel: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none text-sm font-medium" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowStockModal(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-slate-900 text-white font-bold rounded-lg text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default InventoryManager;