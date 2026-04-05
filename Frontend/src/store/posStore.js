// import { create } from 'zustand';

// const usePosStore = create((set, get) => ({
//   cart: [],
//   orderType: 'DineIn', // DineIn, Parcel, Online [cite: 65-66, 392]
//   selectedTable: '',
//   discount: 0,
//   taxRate: 5, // 5% GST [cite: 302, 394]

//   // Actions
//   setOrderType: (type) => set({ orderType: type, selectedTable: type === 'DineIn' ? get().selectedTable : '' }),
//   setSelectedTable: (tableId) => set({ selectedTable: tableId }),
//   setDiscount: (amount) => set({ discount: Number(amount) }),

//   addToCart: (item) => set((state) => {
//     const existing = state.cart.find(c => c.menuItemId === item._id);
//     if (existing) {
//       return { cart: state.cart.map(c => c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c) };
//     }
//     return { cart: [...state.cart, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }] };
//   }),

//   updateQuantity: (id, delta) => set((state) => ({
//     cart: state.cart.map(c => {
//       if (c.menuItemId === id) {
//         const newQty = c.quantity + delta;
//         return newQty > 0 ? { ...c, quantity: newQty } : null;
//       }
//       return c;
//     }).filter(Boolean)
//   })),

//   clearCart: () => set({ cart: [], discount: 0, selectedTable: '' }),
// }));

// export default usePosStore;

import { create } from "zustand";

const usePosStore = create((set) => ({
  cart: [],
  orderType: "DineIn",
  selectedTable: "",
  discount: 0,
  taxRate: 5,
  runningOrderId: null, // 🔥 NEW: Remembers if we are editing an existing order

  setOrderType: (type) => set({ orderType: type }),
  setSelectedTable: (tableId) => set({ selectedTable: tableId }),
  setDiscount: (amount) => set({ discount: Number(amount) }),
  setRunningOrderId: (id) => set({ runningOrderId: id }), // 🔥 NEW

  // 🔥 NEW: Load a running order from the database into the POS
  loadExistingOrder: (order) =>
    set({
      cart: order.items,
      selectedTable: order.tableId || "",
      orderType: order.orderType,
      discount: order.discount,
      runningOrderId: order._id,
    }),

  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find((i) => i.menuItemId === item._id);
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      return {
        cart: [
          ...state.cart,
          {
            menuItemId: item._id,
            name: item.name,
            price: item.price,
            quantity: 1,
          },
        ],
      };
    }),

  updateQuantity: (id, delta) =>
    set((state) => ({
      cart: state.cart
        .map((i) =>
          i.menuItemId === id
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    })),

  clearCart: () =>
    set({ cart: [], discount: 0, selectedTable: "", runningOrderId: null }),
}));

export default usePosStore;
