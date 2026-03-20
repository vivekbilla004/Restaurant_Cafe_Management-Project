import { create } from 'zustand';

const usePosStore = create((set, get) => ({
  cart: [],
  orderType: 'DineIn', // DineIn, Parcel, Online [cite: 65-66, 392]
  selectedTable: '',
  discount: 0,
  taxRate: 5, // 5% GST [cite: 302, 394]

  // Actions
  setOrderType: (type) => set({ orderType: type, selectedTable: type === 'DineIn' ? get().selectedTable : '' }),
  setSelectedTable: (tableId) => set({ selectedTable: tableId }),
  setDiscount: (amount) => set({ discount: Number(amount) }),
  
  addToCart: (item) => set((state) => {
    const existing = state.cart.find(c => c.menuItemId === item._id);
    if (existing) {
      return { cart: state.cart.map(c => c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c) };
    }
    return { cart: [...state.cart, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }] };
  }),

  updateQuantity: (id, delta) => set((state) => ({
    cart: state.cart.map(c => {
      if (c.menuItemId === id) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : null;
      }
      return c;
    }).filter(Boolean)
  })),

  clearCart: () => set({ cart: [], discount: 0, selectedTable: '' }),
}));

export default usePosStore;