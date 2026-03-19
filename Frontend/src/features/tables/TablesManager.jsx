import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Users, LayoutDashboard, Clock, Link as LinkIcon, CheckCircle } from 'lucide-react';
import TableModal from './TableModal';

const TablesManager = () => {
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTable, setActiveTable] = useState(null); // Table selected for actions
  
  // Merge Mode States
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState([]);

  // Reservation Form State
  const [reserveForm, setReserveForm] = useState({ name: '', time: '' });

  const fetchTables = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/tables');
      setTables(response.data);
    } catch (err) {
      toast.error('Failed to load tables.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTables(); }, []);

  // --- MERGE LOGIC ---
  const toggleMergeSelection = (tableId) => {
    if (selectedForMerge.includes(tableId)) {
      setSelectedForMerge(selectedForMerge.filter(id => id !== tableId));
    } else {
      setSelectedForMerge([...selectedForMerge, tableId]);
    }
  };

  const executeMerge = async () => {
    if (selectedForMerge.length < 2) return toast.error("Select at least 2 tables to merge.");
    const loadingToast = toast.loading('Merging tables...');
    try {
      await api.post('/api/tables/merge', { tableIds: selectedForMerge });
      toast.success('Tables merged!', { id: loadingToast });
      setIsMergeMode(false);
      setSelectedForMerge([]);
      fetchTables();
    } catch (err) {
      toast.error('Failed to merge', { id: loadingToast });
    }
  };

  // --- RESERVATION & STATUS LOGIC ---
  const handleReserve = async (e) => {
    e.preventDefault();
    if (!reserveForm.name || !reserveForm.time) return toast.error("Name and time required.");
    
    try {
      await api.put(`/api/tables/${activeTable._id}/reserve`, {
        reservationName: reserveForm.name,
        reservationTime: reserveForm.time
      });
      toast.success(`Reserved for ${reserveForm.name}`);
      setActiveTable(null);
      setReserveForm({ name: '', time: '' });
      fetchTables();
    } catch (err) {
      toast.error('Reservation failed');
    }
  };

  const updateStatus = async (status) => {
    try {
      // If freeing a table, we clear the reservation details in the backend too
      await api.put(`/api/tables/${activeTable._id}/status`, { status });
      toast.success(`Table marked as ${status}`);
      setActiveTable(null);
      fetchTables();
    } catch (err) {
      toast.error('Status update failed');
    }
  };

  const getTableStyle = (table) => {
    const isSelected = selectedForMerge.includes(table._id);
    const base = isSelected ? 'ring-4 ring-blue-500 shadow-xl scale-105 ' : '';
    
    // Visually show merged tables
    if (table.mergedWith && table.mergedWith.length > 0) return base + 'bg-indigo-50 border-indigo-200 text-indigo-800';
    
    switch (table.status) {
      case 'Available': return base + 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100';
      case 'Occupied': return base + 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100';
      case 'Reserved': return base + 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100';
      default: return base + 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <Toaster position="top-right" />

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="text-blue-600" /> Floor Plan
          </h1>
          <p className="text-gray-500 mt-1">Manage live table statuses, reservations, and merges.</p>
        </div>
        
        <div className="flex space-x-3">
          {/* Merge Mode Toggle Button */}
          {isMergeMode ? (
            <>
              <button onClick={() => { setIsMergeMode(false); setSelectedForMerge([]); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel Merge</button>
              <button onClick={executeMerge} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm"><CheckCircle size={18}/> Confirm Merge</button>
            </>
          ) : (
            <button onClick={() => setIsMergeMode(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 shadow-sm"><LinkIcon size={18}/> Merge Tables</button>
          )}

          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm">
            <Plus size={18} /> Add Table
          </button>
        </div>
      </div>

      {/* Interactive Table Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {tables.map((table) => (
          <div 
            key={table._id} 
            onClick={() => {
              if (isMergeMode) toggleMergeSelection(table._id);
              else setActiveTable(table); // Open Action Modal
            }}
            className={`relative group cursor-pointer border-2 rounded-2xl p-5 flex flex-col items-center justify-center aspect-square transition-all duration-200 ${getTableStyle(table)}`}
          >
            {/* Merged Icon Indicator */}
            {table.mergedWith && table.mergedWith.length > 0 && (
               <LinkIcon size={16} className="absolute top-3 left-3 opacity-60" />
            )}

            <h3 className="text-3xl font-black tracking-tight mb-2">{table.tableNumber}</h3>
            
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full text-xs font-bold">
              <Users size={14} /> {table.capacity}
            </div>

            {/* Display Reservation Info if Reserved */}
            {table.status === 'Reserved' && table.reservationName && (
              <div className="absolute inset-x-0 bottom-2 text-center px-1">
                <p className="text-xs font-bold truncate bg-amber-100 rounded text-amber-900">{table.reservationName}</p>
                <p className="text-[10px] text-amber-800">{new Date(table.reservationTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ACTION MODAL (Pops up when you click a table) */}
      {activeTable && !isMergeMode && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 animate-in fade-in zoom-in-95">
            <h2 className="text-2xl font-black mb-1">{activeTable.tableNumber}</h2>
            <p className="text-sm text-gray-500 mb-6">Current Status: <span className="font-bold uppercase">{activeTable.status}</span></p>

            {/* Quick Actions */}
            <div className="space-y-3 mb-6">
              {activeTable.status !== 'Occupied' && (
                <button onClick={() => updateStatus('Occupied')} className="w-full py-3 bg-red-50 text-red-700 border border-red-200 font-bold rounded-xl hover:bg-red-100">Seat Guest (Mark Occupied)</button>
              )}
              {activeTable.status !== 'Available' && (
                <button onClick={() => updateStatus('Available')} className="w-full py-3 bg-green-50 text-green-700 border border-green-200 font-bold rounded-xl hover:bg-green-100">Clear Table (Mark Available)</button>
              )}
            </div>

            {/* Reservation Form (Only show if table is Available) */}
            {activeTable.status === 'Available' && (
              <form onSubmit={handleReserve} className="border-t pt-4">
                <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase">Add Reservation</h3>
                <input type="text" placeholder="Customer Name" required value={reserveForm.name} onChange={e => setReserveForm({...reserveForm, name: e.target.value})} className="w-full mb-3 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                <input type="datetime-local" required value={reserveForm.time} onChange={e => setReserveForm({...reserveForm, time: e.target.value})} className="w-full mb-3 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                <button type="submit" className="w-full py-2.5 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600">Confirm Reservation</button>
              </form>
            )}

            <button onClick={() => setActiveTable(null)} className="w-full mt-4 py-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {isAddModalOpen && <TableModal onClose={() => setIsAddModalOpen(false)} refreshData={fetchTables} />}
    </div>
  );
};

export default TablesManager;