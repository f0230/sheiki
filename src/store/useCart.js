import { create } from 'zustand';

export const useCart = create((set, get) => ({
    items: [],

    addToCart: (product, color, talle, quantity) => {
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
                        precio: product.precio, // Precio añadido
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
}));
