import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCart = create(
    persist(
        (set, get) => ({
            items: [],

            addToCart: (product, color, talle, quantity, imagen) => {
                const items = get().items;
                const existingIndex = items.findIndex(
                    (item) =>
                        item.id === product.id &&
                        item.color === color &&
                        item.talle === talle
                );

                if (existingIndex !== -1) {
                    const updatedItems = [...items];
                    updatedItems[existingIndex].quantity += quantity;
                    set({ items: updatedItems });
                } else {
                    set({
                        items: [
                            ...items,
                            {
                                ...product,
                                color,
                                talle,
                                quantity,
                                precio: product.precio,
                                imagen, // ✅ imagen por color
                            },
                        ],
                    });
                }
            },

            removeFromCart: (index) => {
                const items = get().items.filter((_, i) => i !== index);
                set({ items });
            },

            clearCart: () => set({ items: [] }),
        }),
        {
            name: 'cart-storage',
            getStorage: () => localStorage,
        }
    )
);
