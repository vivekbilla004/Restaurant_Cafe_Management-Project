import React, { useState, useEffect, useRef } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import {
  UploadCloud,
  X,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";

const ItemModal = ({ categories, onClose, refreshData, itemToEdit }) => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    categoryId: "",
    image: "",
  });
  const [imageType, setImageType] = useState("upload");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        name: itemToEdit.name || "",
        price: itemToEdit.price || "",
        categoryId:
          itemToEdit.categoryId ||
          categories.find((c) => c.items.some((i) => i._id === itemToEdit._id))
            ?._id ||
          "",
        image: itemToEdit.image || "",
      });
      if (itemToEdit.image) {
        setImagePreview(itemToEdit.image);
        if (itemToEdit.image.startsWith("http")) setImageType("url");
      }
    }
  }, [itemToEdit, categories]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) return toast.error("Max 4MB allowed");
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, price: Number(formData.price) };
      if (itemToEdit) {
        await api.put(`/api/menu/items/${itemToEdit._id}`, payload);
        toast.success("Updated!");
      } else {
        await api.post("/api/menu/items", payload);
        toast.success("Added!");
      }
      refreshData();
      onClose();
    } catch (err) {
      console.error("Upload Error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to save item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
            {itemToEdit ? "Edit Item" : "New Menu Item"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
        >
          {/* TABS */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {["upload", "url"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setImageType(t)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${imageType === t ? "bg-white shadow text-blue-600" : "text-slate-500"}`}
              >
                {t === "upload" ? (
                  <>
                    <UploadCloud className="inline mr-1" size={14} /> Upload
                  </>
                ) : (
                  <>
                    <LinkIcon className="inline mr-1" size={14} /> URL
                  </>
                )}
              </button>
            ))}
          </div>

          {/* IMAGE BOX */}
          <div className="relative group border-2 border-dashed border-slate-200 rounded-2xl h-40 flex items-center justify-center overflow-hidden bg-slate-50 hover:border-blue-400 transition-all">
            {imagePreview ? (
              <img
                src={imagePreview}
                className="h-full w-full object-cover"
                alt="Preview"
              />
            ) : (
              <div
                className="text-center"
                onClick={() =>
                  imageType === "upload" && fileInputRef.current.click()
                }
              >
                <ImageIcon className="mx-auto text-slate-300 mb-1" size={32} />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Image Preview
                </p>
              </div>
            )}
            {imageType === "upload" && (
              <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
              />
            )}
          </div>

          {imageType === "url" && (
            <input
              type="url"
              placeholder="Paste URL here..."
              value={formData.image || ""}
              onChange={(e) => {
                setFormData({ ...formData, image: e.target.value });
                setImagePreview(e.target.value);
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                Item Name
              </label>
              <input
                type="text"
                required
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                  Price (₹)
                </label>
                <input
                  type="number"
                  required
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                  Category
                </label>
                <select
                  required
                  value={formData.categoryId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="order-2 sm:order-1 flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="order-1 sm:order-2 flex-1 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              {loading ? "SAVING..." : "SAVE ITEM"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ItemModal;
