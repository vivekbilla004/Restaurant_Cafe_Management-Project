// import React, { useState } from 'react';
// import api from '../../lib/api';
// import toast from 'react-hot-toast';

// const ItemModal = ({ categories, onClose, refreshData }) => {
//   const [formData, setFormData] = useState({ name: '', price: '', categoryId: '', image: '' });
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (formData.price <= 0) return toast.error('Price must be greater than zero');
//     if (!formData.categoryId) return toast.error('Please select a category');

//     setLoading(true);
//     try {
//       await api.post('/api/menu/items', { ...formData, price: Number(formData.price) });
//       toast.success('Menu item added successfully!');
//       refreshData();
//       onClose();
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Failed to add item');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
//         <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
//           <h2 className="text-lg font-bold text-gray-900">Add Menu Item</h2>
//           <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">&times;</button>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6 space-y-5">
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name</label>
//             <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="e.g., Masala Dosa" />
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹)</label>
//               <input type="number" required min="1" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="120" />
//             </div>
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
//               <select required value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer">
//                 <option value="">Select Category...</option>
//                 {categories.map((cat) => (
//                   <option key={cat._id} value={cat._id}>{cat.name}</option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL <span className="text-gray-400 font-normal">(Optional)</span></label>
//             <input type="url" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="https://..." />
//           </div>

//           <div className="flex gap-3 pt-2">
//             <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition">Cancel</button>
//             <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-70 flex justify-center items-center">
//               {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Save Item'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default ItemModal;

import React, { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { UploadCloud, X } from 'lucide-react';

const ItemModal = ({ categories, onClose, refreshData, itemToEdit }) => {
  const [formData, setFormData] = useState({ name: '', price: '', categoryId: '', image: '' });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // If itemToEdit exists, pre-fill the form!
  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        name: itemToEdit.name,
        price: itemToEdit.price,
        categoryId: itemToEdit.categoryId || categories.find(c => c.items.some(i => i._id === itemToEdit._id))?._id || '',
        image: itemToEdit.image || ''
      });
      if (itemToEdit.image) setImagePreview(itemToEdit.image);
    }
  }, [itemToEdit, categories]);

  // Handle Image Selection (Simulating an upload by converting to Base64)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toast.error("Image must be less than 2MB");
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, image: reader.result }); // Save Base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.price <= 0) return toast.error('Price must be greater than zero');
    if (!formData.categoryId) return toast.error('Please select a category');

    setLoading(true);
    try {
      if (itemToEdit) {
        // EDIT MODE: Call PUT API
        await api.put(`/api/menu/items/${itemToEdit._id}`, { ...formData, price: Number(formData.price) });
        toast.success('Item updated successfully!');
      } else {
        // CREATE MODE: Call POST API
        await api.post('/api/menu/items', { ...formData, price: Number(formData.price) });
        toast.success('Menu item added successfully!');
      }
      refreshData();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">
            {itemToEdit ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image Upload Zone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Item Image</label>
            <div 
              className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 transition-colors ${imagePreview ? 'border-blue-400 bg-blue-50/30' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
            >
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
              
              {imagePreview ? (
                <div className="relative group w-full h-32 flex justify-center">
                  <img src={imagePreview} alt="Preview" className="h-full object-contain rounded-lg shadow-sm" />
                  <button type="button" onClick={() => { setImagePreview(null); setFormData({...formData, image: ''}) }} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg translate-x-2 -translate-y-2">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="text-center cursor-pointer py-4" onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 font-medium">Click to upload an image</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="e.g., Masala Dosa" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹)</label>
              <input type="number" required min="1" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="120" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              <select required value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer">
                <option value="" disabled>Select Category...</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-70 flex justify-center items-center shadow-sm hover:shadow">
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : (itemToEdit ? 'Update Item' : 'Save Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemModal;